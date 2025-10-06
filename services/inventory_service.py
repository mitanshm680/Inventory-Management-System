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

    def get_inventory(self, groups: Optional[List[str]] = None) -> List[Item]:
        """Get all items in inventory, optionally filtered by groups."""
        try:
            with self.db.get_cursor() as cursor:
                if groups:
                    placeholders = ','.join(['?' for _ in groups])
                    query = f"""
                        SELECT item_name, quantity, group_name, custom_fields
                        FROM items
                        WHERE group_name IN ({placeholders})
                        ORDER BY item_name
                    """
                    cursor.execute(query, tuple(groups))
                else:
                    query = """
                        SELECT item_name, quantity, group_name, custom_fields
                        FROM items
                        ORDER BY item_name
                    """
                    cursor.execute(query)

                items = []
                for row in cursor.fetchall():
                    custom_fields = json.loads(row['custom_fields']) if row['custom_fields'] else {}
                    item = Item(
                        item_name=row['item_name'],
                        quantity=row['quantity'],
                        group_name=row['group_name'],
                        custom_fields=custom_fields
                    )
                    items.append(item)
                return items
        except Exception as e:
            logging.error(f"Error getting inventory: {e}")
            return []

    def get_item(self, item_name: str) -> Optional[Item]:
        """Get a specific item by name."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    SELECT item_name, quantity, group_name, custom_fields
                    FROM items
                    WHERE item_name = ?
                """, (item_name,))

                row = cursor.fetchone()
                if row:
                    custom_fields = json.loads(row['custom_fields']) if row['custom_fields'] else {}
                    return Item(
                        item_name=row['item_name'],
                        quantity=row['quantity'],
                        group_name=row['group_name'],
                        custom_fields=custom_fields
                    )
                return None
        except Exception as e:
            logging.error(f"Error getting item {item_name}: {e}")
            return None

    def add_item(self, item_name: str, quantity: int, group: Optional[str] = None,
                 custom_fields: Optional[Dict] = None) -> bool:
        """Add a new item or update quantity if exists."""
        try:
            with self.db.get_cursor() as cursor:
                # Check if item exists
                cursor.execute("SELECT quantity FROM items WHERE item_name = ?", (item_name,))
                existing = cursor.fetchone()

                if existing:
                    # Update existing item
                    new_quantity = existing['quantity'] + quantity
                    cursor.execute("""
                        UPDATE items
                        SET quantity = ?, group_name = COALESCE(?, group_name)
                        WHERE item_name = ?
                    """, (new_quantity, group, item_name))

                    # Log history - timestamp will be auto-generated
                    cursor.execute("""
                        INSERT INTO history (action, item_name, quantity, group_name, timestamp)
                        VALUES ('ADD', ?, ?, ?, datetime('now'))
                    """, (item_name, quantity, group))
                else:
                    # Insert new item
                    custom_fields_json = json.dumps(custom_fields) if custom_fields else None
                    cursor.execute("""
                        INSERT INTO items (item_name, quantity, group_name, custom_fields)
                        VALUES (?, ?, ?, ?)
                    """, (item_name, quantity, group, custom_fields_json))

                    # Log history - timestamp will be auto-generated
                    cursor.execute("""
                        INSERT INTO history (action, item_name, quantity, group_name, timestamp)
                        VALUES ('CREATE', ?, ?, ?, datetime('now'))
                    """, (item_name, quantity, group))

                logging.info(f"Added/Updated item: {item_name}, quantity: {quantity}")
                return True
        except Exception as e:
            logging.error(f"Error adding item {item_name}: {e}")
            return False

    def remove_item(self, item_name: str, quantity: int) -> bool:
        """Remove quantity from an item."""
        try:
            with self.db.get_cursor() as cursor:
                # Get current item
                cursor.execute("SELECT quantity FROM items WHERE item_name = ?", (item_name,))
                row = cursor.fetchone()

                if not row:
                    logging.warning(f"Item {item_name} not found")
                    return False

                current_qty = row['quantity']
                if current_qty < quantity:
                    logging.warning(f"Not enough quantity for {item_name}")
                    return False

                new_qty = current_qty - quantity

                if new_qty == 0:
                    # Delete item if quantity reaches 0
                    cursor.execute("DELETE FROM items WHERE item_name = ?", (item_name,))
                else:
                    # Update quantity
                    cursor.execute("""
                        UPDATE items SET quantity = ? WHERE item_name = ?
                    """, (new_qty, item_name))

                # Log history
                cursor.execute("""
                    INSERT INTO history (action, item_name, quantity, timestamp)
                    VALUES ('REMOVE', ?, ?, datetime('now'))
                """, (item_name, quantity))

                logging.info(f"Removed {quantity} from {item_name}")
                return True
        except Exception as e:
            logging.error(f"Error removing item {item_name}: {e}")
            return False

    def delete_item(self, item_name: str) -> bool:
        """Delete an item completely."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("DELETE FROM items WHERE item_name = ?", (item_name,))

                if cursor.rowcount > 0:
                    cursor.execute("""
                        INSERT INTO history (action, item_name, quantity, timestamp)
                        VALUES ('DELETE', ?, 0, datetime('now'))
                    """, (item_name,))
                    logging.info(f"Deleted item: {item_name}")
                    return True
                return False
        except Exception as e:
            logging.error(f"Error deleting item {item_name}: {e}")
            return False

    def update_item_group(self, item_name: str, group: Optional[str]) -> bool:
        """Update an item's group."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    UPDATE items SET group_name = ? WHERE item_name = ?
                """, (group, item_name))
                return cursor.rowcount > 0
        except Exception as e:
            logging.error(f"Error updating item group: {e}")
            return False

    def update_item_custom_fields(self, item_name: str, custom_fields: Dict) -> bool:
        """Replace custom fields for an item."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    UPDATE items SET custom_fields = ? WHERE item_name = ?
                """, (json.dumps(custom_fields), item_name))
                return cursor.rowcount > 0
        except Exception as e:
            logging.error(f"Error updating custom fields: {e}")
            return False

    def merge_item_custom_fields(self, item_name: str, new_fields: Dict) -> bool:
        """Merge new custom fields with existing ones."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    SELECT custom_fields FROM items WHERE item_name = ?
                """, (item_name,))
                row = cursor.fetchone()

                if not row:
                    return False

                existing_fields = json.loads(row['custom_fields']) if row['custom_fields'] else {}
                existing_fields.update(new_fields)

                cursor.execute("""
                    UPDATE items SET custom_fields = ? WHERE item_name = ?
                """, (json.dumps(existing_fields), item_name))
                return True
        except Exception as e:
            logging.error(f"Error merging custom fields: {e}")
            return False

    def get_item_history(self, item_name: str) -> List[HistoryEntry]:
        """Get history for a specific item."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    SELECT id, action, item_name, quantity, group_name, timestamp, user_name
                    FROM history
                    WHERE item_name = ?
                    ORDER BY timestamp DESC
                    LIMIT 100
                """, (item_name,))

                history = []
                for row in cursor.fetchall():
                    entry = HistoryEntry(
                        action=row['action'],
                        item_name=row['item_name'],
                        quantity=row['quantity'],
                        group_name=row['group_name'],
                        timestamp=row['timestamp']
                    )
                    history.append(entry)
                return history
        except Exception as e:
            logging.error(f"Error getting item history: {e}")
            return []

    def search_items(self, search_term: str, search_type: str = "contains") -> List[Item]:
        """
        Advanced search for items by name.
        search_type: 'starts_with', 'contains', or 'exact'
        """
        try:
            with self.db.get_cursor() as cursor:
                if search_type == "starts_with":
                    pattern = f'{search_term}%'
                elif search_type == "exact":
                    pattern = search_term
                else:  # contains
                    pattern = f'%{search_term}%'

                cursor.execute("""
                    SELECT item_name, quantity, group_name, custom_fields
                    FROM items
                    WHERE item_name LIKE ?
                    ORDER BY
                        CASE
                            WHEN item_name = ? THEN 1
                            WHEN item_name LIKE ? THEN 2
                            ELSE 3
                        END,
                        item_name
                """, (pattern, search_term, f'{search_term}%'))

                items = []
                for row in cursor.fetchall():
                    custom_fields = json.loads(row['custom_fields']) if row['custom_fields'] else {}
                    item = Item(
                        item_name=row['item_name'],
                        quantity=row['quantity'],
                        group_name=row['group_name'],
                        custom_fields=custom_fields
                    )
                    items.append(item)
                return items
        except Exception as e:
            logging.error(f"Error searching items: {e}")
            return []

    def rename_group(self, old_group_name: str, new_group_name: str) -> bool:
        """Rename a group across all items."""
        try:
            with self.db.get_cursor() as cursor:
                # Update group in groups table
                cursor.execute("""
                    UPDATE groups SET group_name = ? WHERE group_name = ?
                """, (new_group_name, old_group_name))

                # Update all items with this group
                cursor.execute("""
                    UPDATE items SET group_name = ? WHERE group_name = ?
                """, (new_group_name, old_group_name))

                logging.info(f"Renamed group {old_group_name} to {new_group_name}")
                return True
        except Exception as e:
            logging.error(f"Error renaming group: {e}")
            return False

    def backup_data(self) -> str:
        """Create a backup of the database."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = f"backup_{timestamp}.db"
            shutil.copy2(self.db.db_name, backup_file)
            logging.info(f"Created backup: {backup_file}")
            return backup_file
        except Exception as e:
            logging.error(f"Error creating backup: {e}")
            raise

    def check_low_stock(self, threshold: int = 10) -> List[Dict[str, Any]]:
        """
        Check for items with low stock below the threshold.
        Returns list of items with quantity below threshold.
        """
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    SELECT item_name, quantity, group_name, custom_fields
                    FROM items
                    WHERE quantity < ?
                    ORDER BY quantity ASC, item_name
                """, (threshold,))

                low_stock_items = []
                for row in cursor.fetchall():
                    custom_fields = json.loads(row['custom_fields']) if row['custom_fields'] else {}
                    low_stock_items.append({
                        'item_name': row['item_name'],
                        'quantity': row['quantity'],
                        'group_name': row['group_name'],
                        'custom_fields': custom_fields,
                        'threshold': threshold
                    })
                return low_stock_items
        except Exception as e:
            logging.error(f"Error checking low stock: {e}")
            return []

    def export_to_csv(self, filename: str, groups: Optional[List[str]] = None) -> bool:
        """Export inventory data to CSV file."""
        import csv
        try:
            items = self.get_inventory(groups)

            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['item_name', 'quantity', 'group_name', 'custom_fields']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

                writer.writeheader()
                for item in items:
                    custom_fields_str = ', '.join(f"{k}: {v}" for k, v in item.custom_fields.items())
                    writer.writerow({
                        'item_name': item.item_name,
                        'quantity': item.quantity,
                        'group_name': item.group_name or '',
                        'custom_fields': custom_fields_str
                    })

            logging.info(f"Exported {len(items)} items to {filename}")
            return True
        except Exception as e:
            logging.error(f"Error exporting to CSV: {e}")
            return False

    def generate_report(self, groups: Optional[List[str]] = None) -> Dict[str, Any]:
        """Generate comprehensive inventory report with statistics."""
        try:
            items = self.get_inventory(groups)

            total_items = len(items)
            total_quantity = sum(item.quantity for item in items)

            # Group by category
            groups_summary = {}
            for item in items:
                group = item.group_name or 'Ungrouped'
                if group not in groups_summary:
                    groups_summary[group] = {'count': 0, 'total_quantity': 0}
                groups_summary[group]['count'] += 1
                groups_summary[group]['total_quantity'] += item.quantity

            # Low stock items
            low_stock = self.check_low_stock(10)

            report = {
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total_items': total_items,
                    'total_quantity': total_quantity,
                    'groups_count': len(groups_summary)
                },
                'groups_breakdown': groups_summary,
                'low_stock_items': low_stock,
                'low_stock_count': len(low_stock)
            }

            logging.info(f"Generated report: {total_items} items, {len(low_stock)} low stock")
            return report
        except Exception as e:
            logging.error(f"Error generating report: {e}")
            return {}
