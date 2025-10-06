# models/price_entry.py

from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class PriceEntry(BaseModel):
    """Model for price entries."""
    item_name: str
    price: float = Field(gt=0)
    supplier: Optional[str] = None
    date_updated: datetime = Field(default_factory=datetime.now)
    is_unit_price: bool = True
    
    def __init__(self, **data):
        super().__init__(**data)
        self.quantity = data.get('quantity')
    
    @classmethod
    def from_db_row(cls, row):
        """Create a PriceEntry object from a database row."""
        date_updated = datetime.fromisoformat(row['date_updated']) if row['date_updated'] else datetime.now()
        
        # Check if columns exist in the row
        is_unit_price = row['is_unit_price'] if 'is_unit_price' in row else True
        quantity = row['quantity_at_time'] if 'quantity_at_time' in row else None
        
        return cls(
            item_name=row['item_name'],
            price=row['price'],
            supplier=row['supplier'],
            date_updated=date_updated,
            is_unit_price=is_unit_price,
            quantity=quantity
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the price entry to a dictionary."""
        data = {
            'item_name': self.item_name,
            'price': self.price,
            'supplier': self.supplier,
            'date_updated': self.date_updated.isoformat(),
            'is_unit_price': self.is_unit_price
        }
        
        if self.quantity is not None:
            data['quantity'] = self.quantity
            if self.is_unit_price:
                data['total_price'] = self.price * self.quantity
            else:
                data['unit_price'] = self.price / self.quantity if self.quantity > 0 else self.price
                
        return data
    
    def __str__(self) -> str:
        """String representation of the price entry."""
        price_type = "per unit" if self.is_unit_price else "total"
        supplier_str = f", Supplier: {self.supplier}" if self.supplier else ""
        quantity_str = f", Quantity: {self.quantity}" if self.quantity is not None else ""
        
        return (f"Item: {self.item_name}, Price: {self.price} ({price_type})"
                f"{supplier_str}{quantity_str}, "
                f"Updated: {self.date_updated.isoformat()}")
                
    def get_unit_price(self) -> float:
        """Get the unit price regardless of how the price is stored."""
        if self.is_unit_price:
            return self.price
        return self.price / self.quantity if self.quantity and self.quantity > 0 else self.price
        
    def get_total_price(self) -> float:
        """Get the total price regardless of how the price is stored."""
        if not self.is_unit_price:
            return self.price
        return self.price * self.quantity if self.quantity else self.price 