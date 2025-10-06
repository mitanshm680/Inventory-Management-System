"""
Test script for all new features
Tests SHA-256 hashing, search, CSV export, low stock, and more
"""

import os
import sys
import hashlib
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.user_service import UserService
from services.inventory_service import InventoryService
from database.setup import initialize_database

def print_section(title):
    """Print a section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_password_hashing():
    """Test SHA-256 password hashing"""
    print_section("Testing SHA-256 Password Hashing")

    user_service = UserService()

    # Test admin authentication
    print("1. Testing admin login with password '1234'...")
    role = user_service.authenticate("admin", "1234")
    if role == "admin":
        print("   [OK] Admin authentication successful")
    else:
        print("   [ERROR] Admin authentication failed")
        return False

    # Test creating a new user with unique name
    print("\n2. Creating test user with SHA-256 hashed password...")
    import random
    test_username = f"testuser_{random.randint(1000, 9999)}"
    try:
        user_service.create_user(test_username, "testpass123", "editor")
        print("   [OK] User created successfully")
    except Exception as e:
        print(f"   [ERROR] Failed to create user: {e}")
        return False

    # Test authenticating the new user
    print("\n3. Testing new user authentication...")
    role = user_service.authenticate(test_username, "testpass123")
    if role == "editor":
        print("   [OK] Test user authentication successful")
    else:
        print("   [ERROR] Test user authentication failed")
        return False

    # Test password change
    print("\n4. Testing password change...")
    try:
        user_service.change_password(test_username, "testpass123", "newpass456")
        print("   [OK] Password changed successfully")

        # Verify new password works
        role = user_service.authenticate(test_username, "newpass456")
        if role == "editor":
            print("   [OK] New password authentication successful")
        else:
            print("   [ERROR] New password authentication failed")
            return False
    except Exception as e:
        print(f"   [ERROR] Password change failed: {e}")
        return False

    return True

def test_custom_fields():
    """Test custom fields for items"""
    print_section("Testing Custom Fields")

    inventory_service = InventoryService()

    print("1. Adding item with custom fields...")
    custom_fields = {
        "brand": "Dell",
        "model": "XPS 15",
        "serial": "ABC123",
        "warranty": "2025-12-31"
    }

    success = inventory_service.add_item(
        "Laptop",
        5,
        "Electronics",
        custom_fields
    )

    if success:
        print("   [OK] Item added with custom fields")
    else:
        print("   [ERROR] Failed to add item")
        return False

    print("\n2. Retrieving item and checking custom fields...")
    item = inventory_service.get_item("Laptop")
    if item and item.custom_fields == custom_fields:
        print("   [OK] Custom fields retrieved correctly")
        print(f"   Custom fields: {item.custom_fields}")
    else:
        print("   [ERROR] Custom fields mismatch")
        return False

    return True

def test_advanced_search():
    """Test advanced search functionality"""
    print_section("Testing Advanced Search")

    inventory_service = InventoryService()

    # Add test items
    print("1. Adding test items...")
    test_items = [
        ("Laptop Pro", 10, "Electronics"),
        ("Laptop Air", 15, "Electronics"),
        ("Desktop", 5, "Electronics"),
        ("Tablet", 20, "Electronics"),
    ]

    for item_name, qty, group in test_items:
        inventory_service.add_item(item_name, qty, group)
    print(f"   [OK] Added {len(test_items)} test items")

    # Test starts_with search
    print("\n2. Testing 'starts_with' search for 'Lap'...")
    results = inventory_service.search_items("Lap", "starts_with")
    lap_items = [item for item in results if item.item_name.startswith("Lap")]
    if len(lap_items) >= 2:
        print(f"   [OK] Found {len(lap_items)} items starting with 'Lap'")
        for item in lap_items:
            print(f"      - {item.item_name}")
    else:
        print(f"   [ERROR] Expected at least 2 items, found {len(lap_items)}")
        return False

    # Test contains search
    print("\n3. Testing 'contains' search for 'top'...")
    results = inventory_service.search_items("top", "contains")
    if len(results) >= 2:
        print(f"   [OK] Found {len(results)} items containing 'top'")
        for item in results:
            print(f"      - {item.item_name}")
    else:
        print(f"   [ERROR] Expected at least 2 items, found {len(results)}")
        return False

    # Test exact search
    print("\n4. Testing 'exact' search for 'Tablet'...")
    results = inventory_service.search_items("Tablet", "exact")
    if len(results) == 1 and results[0].item_name == "Tablet":
        print(f"   [OK] Found exact match: {results[0].item_name}")
    else:
        print(f"   [ERROR] Exact search failed")
        return False

    return True

def test_low_stock_alerts():
    """Test low stock alert functionality"""
    print_section("Testing Low Stock Alerts")

    inventory_service = InventoryService()

    # Add items with low quantities (not adding, just setting)
    print("1. Adding unique test items with low stock...")
    import random
    suffix = random.randint(1000, 9999)
    test_low_1 = f"Low_Stock_Test_{suffix}_A"
    test_low_2 = f"Low_Stock_Test_{suffix}_B"
    test_normal = f"Normal_Stock_Test_{suffix}"

    inventory_service.add_item(test_low_1, 3, "TestLowStock")
    inventory_service.add_item(test_low_2, 7, "TestLowStock")
    inventory_service.add_item(test_normal, 50, "TestLowStock")
    print("   [OK] Test items added")

    # Check low stock with threshold 10
    print("\n2. Checking low stock (threshold: 10)...")
    low_stock = inventory_service.check_low_stock(10)

    # Count our specific test items
    test_low_items = [item for item in low_stock if 'Low_Stock_Test_' in item['item_name']]
    if len(test_low_items) >= 2:
        print(f"   [OK] Found {len(test_low_items)} low stock test items")
        for item in test_low_items:
            print(f"      - {item['item_name']}: {item['quantity']} units")
    else:
        print(f"   [ERROR] Expected at least 2 low stock items, found {len(test_low_items)}")
        return False

    return True

def test_csv_export():
    """Test CSV export functionality"""
    print_section("Testing CSV Export")

    inventory_service = InventoryService()

    print("1. Exporting inventory to CSV...")
    filename = "test_export.csv"

    success = inventory_service.export_to_csv(filename)
    if success and os.path.exists(filename):
        print(f"   [OK] CSV exported successfully: {filename}")

        # Read and display first few lines
        print("\n2. CSV file preview:")
        with open(filename, 'r') as f:
            lines = f.readlines()[:5]
            for line in lines:
                print(f"      {line.strip()}")

        # Clean up
        os.remove(filename)
        print("\n   [OK] Test file cleaned up")
    else:
        print("   [ERROR] CSV export failed")
        return False

    return True

def test_reporting():
    """Test comprehensive reporting"""
    print_section("Testing Enhanced Reporting")

    inventory_service = InventoryService()

    print("1. Generating comprehensive report...")
    report = inventory_service.generate_report()

    if report and 'summary' in report:
        print("   [OK] Report generated successfully")
        print(f"\n   Summary:")
        print(f"      Total Items: {report['summary']['total_items']}")
        print(f"      Total Quantity: {report['summary']['total_quantity']}")
        print(f"      Groups: {report['summary']['groups_count']}")
        print(f"      Low Stock Items: {report['low_stock_count']}")

        if report['groups_breakdown']:
            print(f"\n   Groups Breakdown:")
            for group, data in report['groups_breakdown'].items():
                print(f"      {group}: {data['count']} items, {data['total_quantity']} units")
    else:
        print("   [ERROR] Report generation failed")
        return False

    return True

def test_backup():
    """Test backup functionality"""
    print_section("Testing Backup System")

    inventory_service = InventoryService()

    print("1. Creating database backup...")
    try:
        backup_file = inventory_service.backup_data()
        if os.path.exists(backup_file):
            print(f"   [OK] Backup created: {backup_file}")

            # Check file size
            size = os.path.getsize(backup_file)
            print(f"   Backup size: {size} bytes")

            # Clean up
            os.remove(backup_file)
            print("   [OK] Test backup file cleaned up")
        else:
            print("   [ERROR] Backup file not found")
            return False
    except Exception as e:
        print(f"   [ERROR] Backup failed: {e}")
        return False

    return True

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  TESTING ALL NEW FEATURES")
    print("="*60)

    # Initialize database
    print("\nInitializing database...")
    initialize_database()
    print("[OK] Database initialized\n")

    # Run all tests
    tests = [
        ("SHA-256 Password Hashing", test_password_hashing),
        ("Custom Fields", test_custom_fields),
        ("Advanced Search", test_advanced_search),
        ("Low Stock Alerts", test_low_stock_alerts),
        ("CSV Export", test_csv_export),
        ("Enhanced Reporting", test_reporting),
        ("Backup System", test_backup),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n[ERROR] Test '{test_name}' crashed: {e}")
            results.append((test_name, False))

    # Print summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} - {test_name}")

    print(f"\n{'='*60}")
    print(f"  Total: {passed}/{total} tests passed")
    print(f"{'='*60}\n")

    if passed == total:
        print("*** ALL TESTS PASSED! ***\n")
        return 0
    else:
        print("*** SOME TESTS FAILED ***\n")
        return 1

if __name__ == "__main__":
    exit(main())
