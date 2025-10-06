from database.setup import initialize_database
from services.inventory_service import InventoryService
import logging
import traceback

logging.basicConfig(level=logging.ERROR)
initialize_database()
inv = InventoryService()

try:
    result = inv.add_item('Test', 10)
    print(f"Result: {result}")
except Exception as e:
    traceback.print_exc()
