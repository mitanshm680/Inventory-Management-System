# services/price_service.py

import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

from database.db_connection import DBConnection
from models.price_entry import PriceEntry


class PriceService:
    """Service class for price operations."""
    
    def __init__(self):
        """Initialize the price service."""
        self.db = DBConnection()
    
    def set_price(self, 
                  item_name: str, 
                  price: float, 
                  supplier: Optional[str] = None,
                  is_unit_price: bool = True) -> bool:
        """
        Set or update the price for an item.
        
        Args:
            item_name: Name of the item
            price: Price of the item (unit price or total price)
            supplier: Supplier name (optional)
            is_unit_price: Whether the price is per unit (True) or total (False)
            
        Returns:
            bool: True if successful
        """
        timestamp = datetime.now().isoformat()
        
        with self.db.get_cursor() as cursor:
            # First check if the item exists in inventory and get its quantity
            cursor.execute("SELECT quantity FROM items WHERE item_name = ?", (item_name,))
            result = cursor.fetchone()
            
            if not result:
                logging.warning(f"Item does not exist in inventory: {item_name}")
                return False
                
            quantity = result['quantity']
            
            # Calculate the unit price if total price was provided
            unit_price = price if is_unit_price else (price / quantity if quantity > 0 else price)
            
            # Add to price history
            cursor.execute(
                """
                INSERT INTO price_history (
                    item_name, 
                    price, 
                    supplier, 
                    timestamp,
                    is_unit_price,
                    quantity_at_time
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (item_name, unit_price, supplier, timestamp, True, quantity)
            )
            
            # Update current price
            cursor.execute(
                """
                INSERT OR REPLACE INTO prices (
                    item_name, 
                    price, 
                    supplier, 
                    date_updated,
                    is_unit_price
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (item_name, unit_price, supplier, timestamp, True)
            )
            
            logging.info(
                f"Price updated for {item_name}: {unit_price} per unit "
                f"(total: {unit_price * quantity}) from supplier {supplier}"
            )
            return True
    
    def get_price(self, 
                  item_name: str, 
                  supplier: Optional[str] = None,
                  as_unit_price: bool = True) -> Optional[PriceEntry]:
        """
        Get the current price for an item.
        
        Args:
            item_name: Name of the item
            supplier: Specific supplier to query (optional)
            as_unit_price: Whether to return unit price (True) or total price (False)
            
        Returns:
            Optional[PriceEntry]: The price entry if found, None otherwise
        """
        with self.db.get_cursor() as cursor:
            # Get the current quantity
            cursor.execute("SELECT quantity FROM items WHERE item_name = ?", (item_name,))
            quantity_result = cursor.fetchone()
            quantity = quantity_result['quantity'] if quantity_result else 0
            
            # Get the price entry
            if supplier:
                cursor.execute(
                    "SELECT * FROM prices WHERE item_name = ? AND supplier = ?",
                    (item_name, supplier)
                )
            else:
                cursor.execute(
                    "SELECT * FROM prices WHERE item_name = ? ORDER BY date_updated DESC LIMIT 1",
                    (item_name,)
                )
                
            row = cursor.fetchone()
            if not row:
                return None
                
            # Create price entry with the correct price type
            entry = PriceEntry.from_db_row(row)
            if not as_unit_price and quantity > 0:
                entry.price = entry.price * quantity
                entry.is_unit_price = False
                
            return entry
    
    def get_price_history(self, 
                         item_name: str, 
                         supplier: Optional[str] = None,
                         as_unit_price: bool = True) -> List[Dict[str, Any]]:
        """
        Get the price history for an item.
        
        Args:
            item_name: Name of the item
            supplier: Filter by specific supplier (optional)
            as_unit_price: Whether to return unit prices (True) or total prices (False)
            
        Returns:
            List[Dict[str, Any]]: List of price history entries
        """
        with self.db.get_cursor() as cursor:
            if supplier:
                cursor.execute(
                    """
                    SELECT ph.*, i.quantity as current_quantity 
                    FROM price_history ph
                    LEFT JOIN items i ON i.item_name = ph.item_name
                    WHERE ph.item_name = ? AND ph.supplier = ?
                    ORDER BY ph.timestamp DESC
                    """,
                    (item_name, supplier)
                )
            else:
                cursor.execute(
                    """
                    SELECT ph.*, i.quantity as current_quantity
                    FROM price_history ph
                    LEFT JOIN items i ON i.item_name = ph.item_name
                    WHERE ph.item_name = ?
                    ORDER BY ph.timestamp DESC
                    """,
                    (item_name,)
                )
                
            history = []
            for row in cursor.fetchall():
                date_updated = datetime.fromisoformat(row['timestamp']) if row['timestamp'] else datetime.now()
                quantity = row['quantity_at_time'] or row['current_quantity'] or 0
                price = row['price']
                
                if not as_unit_price and quantity > 0:
                    price = price * quantity
                
                history.append({
                    'item_name': row['item_name'],
                    'price': price,
                    'supplier': row['supplier'],
                    'timestamp': date_updated.isoformat(),
                    'is_unit_price': as_unit_price,
                    'quantity': quantity
                })
                
            return history
    
    def get_all_prices(self, as_unit_price: bool = True) -> Dict[str, List[PriceEntry]]:
        """
        Get all current prices grouped by item.
        
        Args:
            as_unit_price: Whether to return unit prices (True) or total prices (False)
            
        Returns:
            Dict[str, List[PriceEntry]]: Dictionary mapping item names to price entries
        """
        prices = {}
        
        with self.db.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT p.*, i.quantity 
                FROM prices p
                LEFT JOIN items i ON i.item_name = p.item_name
                ORDER BY p.item_name
                """
            )
            
            for row in cursor.fetchall():
                entry = PriceEntry.from_db_row(row)
                quantity = row['quantity'] or 0
                
                if not as_unit_price and quantity > 0:
                    entry.price = entry.price * quantity
                    entry.is_unit_price = False
                
                if entry.item_name not in prices:
                    prices[entry.item_name] = []
                    
                prices[entry.item_name].append(entry)
                
        return prices
    
    def get_cheapest_supplier(self, item_name: str) -> Tuple[Optional[str], Optional[float]]:
        """
        Get the cheapest supplier for an item.
        
        Args:
            item_name: Name of the item
            
        Returns:
            Tuple[Optional[str], Optional[float]]: Tuple of supplier name and unit price
        """
        with self.db.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT supplier, price 
                FROM prices 
                WHERE item_name = ?
                ORDER BY price ASC
                LIMIT 1
                """,
                (item_name,)
            )
            
            row = cursor.fetchone()
            if row:
                return row['supplier'], row['price']
                
        return None, None
    
    def delete_price(self, item_name: str, supplier: Optional[str] = None) -> bool:
        """
        Delete price entries for an item.
        
        Args:
            item_name: Name of the item
            supplier: Specific supplier to delete (optional, if None deletes all suppliers)
            
        Returns:
            bool: True if any entries were deleted
        """
        with self.db.get_cursor() as cursor:
            if supplier:
                cursor.execute(
                    "DELETE FROM prices WHERE item_name = ? AND supplier = ?",
                    (item_name, supplier)
                )
            else:
                cursor.execute("DELETE FROM prices WHERE item_name = ?", (item_name,))
                
            return cursor.rowcount > 0 