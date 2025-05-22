from typing import Dict, Any, Optional
from datetime import datetime


class HistoryEntry:
    """Represents an entry in the inventory history."""
    
    def __init__(self, 
                 id: Optional[int], 
                 action: str, 
                 item_name: str, 
                 quantity: Optional[int] = None, 
                 group_name: Optional[str] = None,
                 timestamp: Optional[datetime] = None):
        """
        Initialize a history entry.
        
        Args:
            id: Database ID (optional)
            action: The action performed (ADD, REMOVE, DELETE, etc.)
            item_name: The name of the item affected
            quantity: The quantity affected (if applicable)
            group_name: The group name (if applicable)
            timestamp: When the action occurred (defaults to now)
        """
        self.id = id
        self.action = action
        self.item_name = item_name
        self.quantity = quantity
        self.group_name = group_name
        self.timestamp = timestamp or datetime.now()
    
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
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the history entry to a dictionary."""
        return {
            'id': self.id,
            'action': self.action,
            'item_name': self.item_name,
            'quantity': self.quantity,
            'group_name': self.group_name,
            'timestamp': self.timestamp.isoformat()
        }
    
    def __str__(self) -> str:
        """String representation of the history entry."""
        return (f"{self.timestamp.isoformat()}: {self.action} - "
                f"Item: {self.item_name}, "
                f"Quantity: {self.quantity or 'N/A'}, "
                f"Group: {self.group_name or 'N/A'}") 