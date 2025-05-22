# models/item.py

import json
from typing import Dict, Any, Optional


class Item:
    """Represents an inventory item."""
    
    def __init__(self, item_name: str, quantity: int, group_name: Optional[str] = None, 
                 custom_fields: Optional[Dict[str, Any]] = None):
        """
        Initialize an item.
        
        Args:
            item_name: The name of the item
            quantity: The quantity of the item
            group_name: The optional group the item belongs to
            custom_fields: Any additional custom fields for the item
        """
        self.item_name = item_name
        self.quantity = quantity
        self.group_name = group_name
        self.custom_fields = custom_fields or {}
    
    @classmethod
    def from_db_row(cls, row):
        """Create an Item object from a database row."""
        custom_fields = {}
        if row['custom_fields']:
            try:
                custom_fields = json.loads(row['custom_fields'])
            except json.JSONDecodeError:
                pass
        
        return cls(
            item_name=row['item_name'],
            quantity=row['quantity'],
            group_name=row['group_name'],
            custom_fields=custom_fields
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the item to a dictionary."""
        return {
            'item_name': self.item_name,
            'quantity': self.quantity,
            'group_name': self.group_name,
            'custom_fields': self.custom_fields
        }
    
    def __str__(self) -> str:
        """String representation of the item."""
        custom_fields_str = ', '.join(f"{k}: {v}" for k, v in self.custom_fields.items())
        return (f"Item: {self.item_name}, Quantity: {self.quantity}, "
                f"Group: {self.group_name or 'None'}, "
                f"Custom Fields: {custom_fields_str or 'None'}") 