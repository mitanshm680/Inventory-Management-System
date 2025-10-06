from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class HistoryEntry(BaseModel):
    """Model for history entries."""
    id: Optional[int] = None
    action: str = Field(..., description="The action performed (ADD, REMOVE, DELETE, etc.)")
    item_name: str = Field(..., description="The name of the item affected")
    quantity: Optional[int] = Field(None, description="The quantity affected (if applicable)")
    group_name: Optional[str] = Field(None, description="The group name (if applicable)")
    timestamp: datetime = Field(default_factory=datetime.now, description="When the action occurred")
    
    @classmethod
    def from_db_row(cls, row):
        """Create a HistoryEntry object from a database row."""
        timestamp = datetime.fromisoformat(row['timestamp']) if row['timestamp'] else datetime.now()
        
        return cls(
            id=row['id'],
            action=row['action'],
            item_name=row['item_name'],
            quantity=row['quantity'],
            group_name=row['group_name'],
            timestamp=timestamp
        )
    
    def __str__(self) -> str:
        """String representation of the history entry."""
        return (f"{self.timestamp.isoformat()}: {self.action} - "
                f"Item: {self.item_name}, "
                f"Quantity: {self.quantity or 'N/A'}, "
                f"Group: {self.group_name or 'N/A'}") 