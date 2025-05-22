# services/report_service.py

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from services.inventory_service import InventoryService
from models.item import Item
from utils.export import generate_report


class ReportService:
    """Service for generating reports and analytics from inventory data."""
    
    def __init__(self):
        """Initialize the report service."""
        self.inventory_service = InventoryService()
    
    def generate_inventory_report(self, filename: str, groups: Optional[List[str]] = None, 
                                 format_type: str = 'csv') -> str:
        """
        Generate an inventory report file.
        
        Args:
            filename: Name of the output file
            groups: Optional list of groups to include
            format_type: Format of the report (csv or json)
            
        Returns:
            str: Path to the generated report file
        """
        items = self.inventory_service.get_inventory(groups)
        generate_report(filename, items, format_type)
        logging.info(f"Report generated: {filename}")
        return filename
    
    def get_low_stock_items(self, threshold: int = 10) -> List[Item]:
        """
        Get items with stock levels below the threshold.
        
        Args:
            threshold: Stock level threshold
            
        Returns:
            List[Item]: List of items with low stock
        """
        items = self.inventory_service.get_inventory()
        low_stock_items = [item for item in items if item.quantity < threshold]
        return low_stock_items
    
    def get_inventory_value(self, price_map: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculate the total value of inventory using a price map.
        
        Args:
            price_map: Dictionary mapping item names to prices
            
        Returns:
            Dict[str, Any]: Report containing total value and item details
        """
        items = self.inventory_service.get_inventory()
        total_value = 0.0
        item_values = []
        
        for item in items:
            price = price_map.get(item.item_name, 0.0)
            value = price * item.quantity
            total_value += value
            
            item_values.append({
                'item_name': item.item_name,
                'quantity': item.quantity,
                'unit_price': price,
                'total_value': value
            })
        
        return {
            'total_value': total_value,
            'items': item_values,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_activity_report(self, days: int = 30) -> Dict[str, Any]:
        """
        Get a report of inventory activity for the last N days.
        
        Args:
            days: Number of days to include in the report
            
        Returns:
            Dict[str, Any]: Report of inventory activity
        """
        # Get current timestamp and calculate cutoff
        now = datetime.now()
        cutoff = now.replace(day=now.day-days)
        
        # Get all items to track their history
        items = self.inventory_service.get_inventory()
        
        activity_data = {
            'additions': 0,
            'removals': 0,
            'deletions': 0,
            'items_added': set(),
            'items_removed': set(),
            'items_deleted': set(),
            'timestamp': now.isoformat(),
            'period_days': days
        }
        
        # For each item, get its history
        for item in items:
            history = self.inventory_service.get_item_history(item.item_name)
            
            for entry in history:
                # Skip entries older than cutoff
                if entry.timestamp < cutoff:
                    continue
                    
                if entry.action == 'ADD':
                    activity_data['additions'] += 1
                    activity_data['items_added'].add(entry.item_name)
                elif entry.action == 'REMOVE':
                    activity_data['removals'] += 1
                    activity_data['items_removed'].add(entry.item_name)
                elif entry.action == 'DELETE':
                    activity_data['deletions'] += 1
                    activity_data['items_deleted'].add(entry.item_name)
        
        # Convert sets to lists for serialization
        activity_data['items_added'] = list(activity_data['items_added'])
        activity_data['items_removed'] = list(activity_data['items_removed'])
        activity_data['items_deleted'] = list(activity_data['items_deleted'])
        
        return activity_data 