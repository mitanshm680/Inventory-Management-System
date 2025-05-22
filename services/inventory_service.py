# services/inventory_service.py

import json
import logging
import shutil
from datetime import datetime
from typing import List, Dict, Any, Optional

from database.db_connection import DBConnection
from models.item import Item
from models.history_entry import HistoryEntry


class InventoryService:
    """Service class for inventory operations."""
    
    def __init__(self):
        """Initialize the inventory service."""
        self.db = DBConnection()
    
    def add_item(self, item_name: str, quantity: int, group: Optional[str] = None, 
                custom_fields: Optional[Dict[str, Any]] = None) -> None:
        """
        Add or update an item in the inventory.
        
        Args:
            item_name: Name of the item
            quantity: Quantity to add
            group: Group the item belongs to (optional)
            custom_fields: Custom fields for the item (optional)
        """
        with self.db.get_cursor() as cursor:
            # Check if item exists
            cursor.execute("SELECT quantity FROM items WHERE item_name = ?", (item_name,))
            result = cursor.fetchone()
            
            if result:
                # Update existing item
                new_quantity = result['quantity'] + quantity
                cursor.execute(
                    "UPDATE items SET quantity = ? WHERE item_name = ?",
                    (new_quantity, item_name)
                )
            else:
                # Add new item
                cursor.execute(
                    "INSERT INTO items (item_name, quantity, group_name, custom_fields) VALUES (?, ?, ?, ?)",
                    (item_name, quantity, group, json.dumps(custom_fields) if custom_fields else None)
                )
            
            # Log the action
            self._log_action('ADD', item_name, quantity, group)
            
        self.check_low_stock(item_name)
    
    def remove_item(self, item_name: str, quantity: int) -> bool:
        """
        Remove a quantity of an item or delete it if quantity reaches 0.
        
        Args:
            item_name: Name of the item to remove
            quantity: Quantity to remove
        
        Returns:
            bool: True if successful, False otherwise
        """
        with self.db.get_cursor() as cursor:
            cursor.execute("SELECT quantity FROM items WHERE item_name = ?", (item_name,))
            result = cursor.fetchone()
            
            if not result:
                logging.warning(f"Item not found in inventory: {item_name}")
                return False
            
            current_quantity = result['quantity']
            if current_quantity < quantity:
                logging.warning(f"Not enough quantity in inventory for {item_name}")
                return False
                
            new_quantity = current_quantity - quantity
            if new_quantity == 0:
                cursor.execute("DELETE FROM items WHERE item_name = ?", (item_name,))
            else:
                cursor.execute(
                    "UPDATE items SET quantity = ? WHERE item_name = ?", 
                    (new_quantity, item_name)
                )
            
            # Log the action
            self._log_action('REMOVE', item_name, quantity)
            
        self.check_low_stock(item_name)
        return True
    
    def check_low_stock(self, item_name: str, threshold: int = 10) -> bool:
        """
        Check if an item's stock is below the threshold.
        
        Args:
            item_name: Name of the item to check
            threshold: Threshold for low stock warning
            
        Returns:
            bool: True if stock is low, False otherwise
        """
        with self.db.get_cursor() as cursor:
            cursor.execute("SELECT quantity FROM items WHERE item_name = ?", (item_name,))
            result = cursor.fetchone()
            
            if result and result['quantity'] < threshold:
                logging.warning(
                    f"Low stock for item '{item_name}'. Current quantity: {result['quantity']}"
                )
                return True
        return False
    
    def get_inventory(self, groups: Optional[List[str]] = None) -> List[Item]:
        """
        Get the inventory, optionally filtered by groups.
        
        Args:
            groups: List of group names to filter by (optional)
            
        Returns:
            List[Item]: List of items
        """
        with self.db.get_cursor() as cursor:
            if groups:
                placeholders = ','.join('?' for _ in groups)
                cursor.execute(
                    f"SELECT * FROM items WHERE group_name IN ({placeholders})",
                    groups
                )
            else:
                cursor.execute("SELECT * FROM items")
            
            return [Item.from_db_row(row) for row in cursor.fetchall()]
    
    def get_item(self, item_name: str) -> Optional[Item]:
        """
        Get a specific item by name.
        
        Args:
            item_name: Name of the item
            
        Returns:
            Optional[Item]: The item if found, None otherwise
        """
        with self.db.get_cursor() as cursor:
            cursor.execute("SELECT * FROM items WHERE item_name = ?", (item_name,))
            row = cursor.fetchone()
            
            if row:
                return Item.from_db_row(row)
            return None
    
    def search_items(self, search_term: str) -> List[Item]:
        """
        Search for items by name.
        
        Args:
            search_term: Term to search for
            
        Returns:
            List[Item]: List of matching items
        """
        with self.db.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM items WHERE item_name LIKE ?", 
                (f"%{search_term}%",)
            )
            return [Item.from_db_row(row) for row in cursor.fetchall()]
    
    def delete_item(self, item_name: str) -> bool:
        """
        Delete an item completely.
        
        Args:
            item_name: Name of the item to delete
            
        Returns:
            bool: True if successful, False if item not found
        """
        with self.db.get_cursor() as cursor:
            cursor.execute("SELECT 1 FROM items WHERE item_name = ?", (item_name,))
            if not cursor.fetchone():
                return False
                
            cursor.execute("DELETE FROM items WHERE item_name = ?", (item_name,))
            self._log_action('DELETE', item_name)
            return True
    
    def get_item_history(self, item_name: str) -> List[HistoryEntry]:
        """
        Get the history of a specific item.
        
        Args:
            item_name: Name of the item
            
        Returns:
            List[HistoryEntry]: List of history entries for the item
        """
        with self.db.get_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM history WHERE item_name = ? ORDER BY timestamp DESC", 
                (item_name,)
            )
            return [HistoryEntry.from_db_row(row) for row in cursor.fetchall()]
    
    def get_groups(self) -> List[str]:
        """
        Get all unique groups in the inventory.
        
        Returns:
            List[str]: List of group names
        """
        with self.db.get_cursor() as cursor:
            cursor.execute("SELECT DISTINCT group_name FROM items WHERE group_name IS NOT NULL")
            return [row['group_name'] for row in cursor.fetchall()]
    
    def rename_group(self, old_group_name: str, new_group_name: str) -> bool:
        """
        Rename a group.
        
        Args:
            old_group_name: Current name of the group
            new_group_name: New name for the group
            
        Returns:
            bool: True if successful, False otherwise
        """
        with self.db.get_cursor() as cursor:
            cursor.execute(
                "UPDATE items SET group_name = ? WHERE group_name = ?",
                (new_group_name, old_group_name)
            )
            return cursor.rowcount > 0
    
    def backup_data(self) -> str:
        """
        Create a backup of the database.
        
        Returns:
            str: Filename of the backup
        """
        backup_filename = f"backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.db"
        shutil.copy(self.db.db_name, backup_filename)
        logging.info(f"Backup created: {backup_filename}")
        return backup_filename
    
    def _log_action(self, action: str, item_name: str, quantity: Optional[int] = None, 
                   group: Optional[str] = None) -> None:
        """
        Log actions in the history table.
        
        Args:
            action: Action performed (ADD, REMOVE, DELETE, etc.)
            item_name: Name of the affected item
            quantity: Quantity affected (optional)
            group: Group name (optional)
        """
        timestamp = datetime.now().isoformat()
        
        with self.db.get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO history (action, item_name, quantity, group_name, timestamp)
                VALUES (?, ?, ?, ?, ?)
                """,
                (action, item_name, quantity, group, timestamp)
            )
    
    def update_item_group(self, item_name: str, new_group: Optional[str]) -> bool:
        """
        Update an item's group.
        
        Args:
            item_name: Name of the item to update
            new_group: New group name (or None to remove from group)
            
        Returns:
            bool: True if successful, False if item not found
        """
        with self.db.get_cursor() as cursor:
            cursor.execute("SELECT 1 FROM items WHERE item_name = ?", (item_name,))
            if not cursor.fetchone():
                logging.warning(f"Item not found: {item_name}")
                return False
            
            cursor.execute(
                "UPDATE items SET group_name = ? WHERE item_name = ?",
                (new_group, item_name)
            )
            
            # Log the action
            self._log_action('UPDATE_GROUP', item_name, group=new_group)
            return True
    
    def update_item_custom_fields(self, item_name: str, custom_fields: Dict[str, Any]) -> bool:
        """
        Update an item's custom fields.
        
        Args:
            item_name: Name of the item to update
            custom_fields: New custom fields (will replace existing)
            
        Returns:
            bool: True if successful, False if item not found
        """
        with self.db.get_cursor() as cursor:
            cursor.execute("SELECT custom_fields FROM items WHERE item_name = ?", (item_name,))
            result = cursor.fetchone()
            
            if not result:
                logging.warning(f"Item not found: {item_name}")
                return False
            
            # Save new custom fields
            cursor.execute(
                "UPDATE items SET custom_fields = ? WHERE item_name = ?",
                (json.dumps(custom_fields), item_name)
            )
            
            # Log the action
            self._log_action('UPDATE_FIELDS', item_name)
            return True
    
    def merge_item_custom_fields(self, item_name: str, custom_fields: Dict[str, Any]) -> bool:
        """
        Merge new custom fields with existing ones.
        
        Args:
            item_name: Name of the item to update
            custom_fields: Custom fields to merge with existing ones
            
        Returns:
            bool: True if successful, False if item not found
        """
        with self.db.get_cursor() as cursor:
            cursor.execute("SELECT custom_fields FROM items WHERE item_name = ?", (item_name,))
            result = cursor.fetchone()
            
            if not result:
                logging.warning(f"Item not found: {item_name}")
                return False
            
            # Load existing custom fields
            existing_fields = {}
            if result['custom_fields']:
                try:
                    existing_fields = json.loads(result['custom_fields'])
                except json.JSONDecodeError:
                    pass
            
            # Merge with new fields
            existing_fields.update(custom_fields)
            
            # Save merged fields
            cursor.execute(
                "UPDATE items SET custom_fields = ? WHERE item_name = ?",
                (json.dumps(existing_fields), item_name)
            )
            
            # Log the action
            self._log_action('UPDATE_FIELDS', item_name)
            return True 