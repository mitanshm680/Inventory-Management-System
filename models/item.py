# models/item.py

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, validator

class Item(BaseModel):
    """Model for inventory items."""
    item_name: str = Field(..., description="The name of the item")
    quantity: int = Field(..., ge=0, description="The quantity of the item")
    group_name: Optional[str] = Field(None, description="The group the item belongs to")
    custom_fields: Dict[str, Any] = Field(default_factory=dict, description="Additional custom fields for the item")
    
    @validator('quantity')
    def validate_quantity(cls, v):
        """Validate the item quantity."""
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v
    
    @classmethod
    def from_db_row(cls, row):
        """Create an Item object from a database row."""
        import json
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
    
    def __str__(self) -> str:
        """String representation of the item."""
        custom_fields_str = ', '.join(f"{k}: {v}" for k, v in self.custom_fields.items())
        return (f"Item: {self.item_name}, Quantity: {self.quantity}, "
                f"Group: {self.group_name or 'None'}, "
                f"Custom Fields: {custom_fields_str or 'None'}") 