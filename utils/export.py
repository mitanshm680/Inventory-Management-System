# utils/export.py

import csv
import json
from typing import List, Dict, Any

from models.item import Item


def export_to_csv(filename: str, items: List[Item]) -> None:
    """
    Export items to a CSV file.
    
    Args:
        filename: Path to the output CSV file
        items: List of items to export
    """
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        
        # Write header
        writer.writerow(['Item Name', 'Quantity', 'Group', 'Custom Fields'])
        
        # Write items
        for item in items:
            custom_fields_str = ', '.join(f"{k}: {v}" for k, v in item.custom_fields.items())
            writer.writerow([
                item.item_name,
                item.quantity,
                item.group_name or '',
                custom_fields_str
            ])


def export_to_json(filename: str, items: List[Item]) -> None:
    """
    Export items to a JSON file.
    
    Args:
        filename: Path to the output JSON file
        items: List of items to export
    """
    items_dict = [item.to_dict() for item in items]
    
    with open(filename, 'w') as f:
        json.dump(items_dict, f, indent=4)


def generate_report(filename: str, items: List[Item], format_type: str = 'csv') -> None:
    """
    Generate a report of items.
    
    Args:
        filename: Path to the output file
        items: List of items to include in the report
        format_type: Format of the report ('csv' or 'json')
    """
    if format_type.lower() == 'csv':
        export_to_csv(filename, items)
    elif format_type.lower() == 'json':
        export_to_json(filename, items)
    else:
        raise ValueError(f"Unsupported format: {format_type}") 