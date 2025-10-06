"""Test database and SQL operations"""
import sys
import os

# Force UTF-8 encoding for Windows console
if os.name == 'nt':
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from database.setup import initialize_database
from services.inventory_service import InventoryService
from services.user_service import UserService

def test_database():
    print("="*60)
    print("TESTING DATABASE OPERATIONS")
    print("="*60)

    # Initialize database
    print("\n1. Initializing database...")
    try:
        initialize_database()
        print("   [OK] Database initialized")
    except Exception as e:
        print(f"   [FAIL] Error: {e}")
        return False

    # Test user service
    print("\n2. Testing user service...")
    try:
        user_service = UserService()
        role = user_service.authenticate("admin", "1234")
        if role == "admin":
            print("   ✓ Admin login successful")
        else:
            print(f"   ✗ Login failed, got role: {role}")
            return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

    # Test inventory service
    print("\n3. Testing inventory service...")
    try:
        inv_service = InventoryService()

        # Add item
        print("   - Adding test item...")
        success = inv_service.add_item("Test Item", 100, "Electronics", {"color": "blue"})
        if success:
            print("     ✓ Item added")
        else:
            print("     ✗ Failed to add item")
            return False

        # Get item
        print("   - Retrieving item...")
        item = inv_service.get_item("Test Item")
        if item and item.quantity == 100:
            print(f"     ✓ Item retrieved: {item.item_name}, qty: {item.quantity}")
        else:
            print("     ✗ Failed to retrieve item")
            return False

        # Update item
        print("   - Removing 10 units...")
        success = inv_service.remove_item("Test Item", 10)
        if success:
            updated_item = inv_service.get_item("Test Item")
            if updated_item.quantity == 90:
                print(f"     ✓ Quantity updated to {updated_item.quantity}")
            else:
                print(f"     ✗ Wrong quantity: {updated_item.quantity}")
                return False
        else:
            print("     ✗ Failed to remove quantity")
            return False

        # Get all items
        print("   - Getting all items...")
        items = inv_service.get_inventory()
        if len(items) == 1:
            print(f"     ✓ Found {len(items)} item(s)")
        else:
            print(f"     ✗ Expected 1 item, found {len(items)}")
            return False

        # Delete item
        print("   - Deleting item...")
        success = inv_service.delete_item("Test Item")
        if success:
            items = inv_service.get_inventory()
            if len(items) == 0:
                print("     ✓ Item deleted")
            else:
                print(f"     ✗ Item still exists")
                return False
        else:
            print("     ✗ Failed to delete item")
            return False

    except Exception as e:
        print(f"   ✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

    print("\n" + "="*60)
    print("✓ ALL TESTS PASSED!")
    print("="*60)
    return True

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)
