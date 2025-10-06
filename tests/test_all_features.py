"""
Test all 13 basic features to ensure they work
"""
import requests
import json
import sys
import os

# Fix Windows console encoding
if os.name == 'nt':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://127.0.0.1:8001"
TOKEN = None

def login():
    """Login and get token"""
    global TOKEN
    response = requests.post(
        f"{BASE_URL}/token",
        data={"username": "admin", "password": "1234"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if response.status_code == 200:
        TOKEN = response.json()["access_token"]
        print("✓ Login successful")
        return True
    print(f"✗ Login failed: {response.text}")
    return False

def get_headers():
    return {"Authorization": f"Bearer {TOKEN}"}

def test_1_add_item():
    """1. Add item"""
    print("\n[1/13] Testing: Add item")
    response = requests.post(
        f"{BASE_URL}/inventory",
        headers=get_headers(),
        json={"item_name": "Test Laptop", "quantity": 5, "group_name": "Electronics"}
    )
    if response.status_code == 200:
        print("✓ Add item works")
        return True
    print(f"✗ Add item failed: {response.text}")
    return False

def test_2_remove_item():
    """2. Remove item (reduce quantity)"""
    print("\n[2/13] Testing: Remove item")
    # First get the item
    response = requests.get(f"{BASE_URL}/inventory/Test Laptop", headers=get_headers())
    if response.status_code == 200:
        item = response.json()
        # Update with reduced quantity
        response = requests.put(
            f"{BASE_URL}/inventory/Test Laptop",
            headers=get_headers(),
            json={"quantity": item["quantity"] - 1}
        )
        if response.status_code == 200:
            print("✓ Remove item works")
            return True
    print(f"✗ Remove item failed")
    return False

def test_3_check_inventory():
    """3. Check inventory"""
    print("\n[3/13] Testing: Check inventory")
    response = requests.get(f"{BASE_URL}/inventory", headers=get_headers())
    if response.status_code == 200:
        items = response.json()
        print(f"✓ Check inventory works - Found {len(items)} items")
        return True
    print(f"✗ Check inventory failed: {response.text}")
    return False

def test_4_check_group():
    """4. Check group"""
    print("\n[4/13] Testing: Check group")
    # First create a group
    requests.post(
        f"{BASE_URL}/groups",
        headers=get_headers(),
        json={"group_name": "Test Group", "description": "Test description"}
    )
    # Now check groups
    response = requests.get(f"{BASE_URL}/groups", headers=get_headers())
    if response.status_code == 200:
        data = response.json()
        groups = data.get("groups", [])
        print(f"✓ Check group works - Found {len(groups)} groups")
        return True
    print(f"✗ Check group failed: {response.text}")
    return False

def test_5_search_item():
    """5. Search item"""
    print("\n[5/13] Testing: Search item")
    response = requests.get(f"{BASE_URL}/inventory/Test Laptop", headers=get_headers())
    if response.status_code == 200:
        item = response.json()
        print(f"✓ Search item works - Found: {item['item_name']}")
        return True
    print(f"✗ Search item failed")
    return False

def test_6_export_data():
    """6. Export data (Get inventory report)"""
    print("\n[6/13] Testing: Export data")
    response = requests.get(f"{BASE_URL}/reports/inventory", headers=get_headers())
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Export data works - Total items: {data['total_items']}")
        return True
    print(f"✗ Export data failed: {response.text}")
    return False

def test_7_generate_report():
    """7. Generate report"""
    print("\n[7/13] Testing: Generate report")
    # Test low stock report
    response = requests.get(f"{BASE_URL}/reports/low-stock?threshold=10", headers=get_headers())
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Generate report works - Low stock items: {len(data['low_stock_items'])}")
        return True
    print(f"✗ Generate report failed: {response.text}")
    return False

def test_8_view_item_history():
    """8. View item history"""
    print("\n[8/13] Testing: View item history")
    response = requests.get(f"{BASE_URL}/inventory/Test Laptop/history", headers=get_headers())
    if response.status_code == 200:
        data = response.json()
        history = data.get("history", [])
        print(f"✓ View item history works - {len(history)} entries")
        return True
    print(f"✗ View item history failed: {response.text}")
    return False

def test_9_backup_data():
    """9. Backup data"""
    print("\n[9/13] Testing: Backup data")
    response = requests.post(f"{BASE_URL}/backup", headers=get_headers())
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Backup data works - File: {data['filename']}")
        return True
    print(f"✗ Backup data failed: {response.text}")
    return False

def test_10_delete_item():
    """10. Delete item"""
    print("\n[10/13] Testing: Delete item")
    # Create a temp item first
    requests.post(
        f"{BASE_URL}/inventory",
        headers=get_headers(),
        json={"item_name": "Temp Item", "quantity": 1}
    )
    # Delete it
    response = requests.delete(f"{BASE_URL}/inventory/Temp Item", headers=get_headers())
    if response.status_code == 200:
        print("✓ Delete item works")
        return True
    print(f"✗ Delete item failed: {response.text}")
    return False

def test_11_rename_group():
    """11. Rename group"""
    print("\n[11/13] Testing: Rename group")
    import time
    timestamp = str(int(time.time()))
    old_name = f"OldGroup{timestamp}"
    new_name = f"NewGroup{timestamp}"

    # Create a group first
    create_resp = requests.post(
        f"{BASE_URL}/groups",
        headers=get_headers(),
        json={"group_name": old_name, "description": "Test"}
    )

    # Rename it - URL encode
    from urllib.parse import quote
    response = requests.put(
        f"{BASE_URL}/groups/{quote(old_name)}",
        headers=get_headers(),
        json={"new_name": new_name}
    )
    if response.status_code == 200:
        print("✓ Rename group works")
        return True
    print(f"✗ Rename group failed: {response.status_code} - {response.text}")
    return False

def test_12_manage_users():
    """12. Manage users"""
    print("\n[12/13] Testing: Manage users")
    # Get users
    response = requests.get(f"{BASE_URL}/users", headers=get_headers())
    if response.status_code == 200:
        data = response.json()
        users = data.get("users", [])
        print(f"✓ Manage users works - {len(users)} users")

        # Test create user
        create_response = requests.post(
            f"{BASE_URL}/users",
            headers=get_headers(),
            json={"username": "testuser", "password": "test123", "role": "viewer"}
        )
        if create_response.status_code == 200:
            print("  ✓ Create user works")
            # Delete test user
            requests.delete(f"{BASE_URL}/users/testuser", headers=get_headers())
        return True
    print(f"✗ Manage users failed: {response.text}")
    return False

def test_13_price_management():
    """13. Price management (bonus feature)"""
    print("\n[13/13] Testing: Price management")
    # Add price
    from urllib.parse import quote
    response = requests.put(
        f"{BASE_URL}/prices/{quote('Test Laptop')}",
        headers=get_headers(),
        json={"price": 999.99, "supplier": "TechStore"}
    )
    print(f"  PUT price response: {response.status_code} - {response.text}")
    if response.status_code == 200:
        # Get price
        get_response = requests.get(f"{BASE_URL}/prices/{quote('Test Laptop')}", headers=get_headers())
        print(f"  GET price response: {get_response.status_code}")
        if get_response.status_code == 200:
            print("✓ Price management works")
            return True
    print(f"✗ Price management failed: PUT={response.status_code}")
    return False

def main():
    print("="*60)
    print("TESTING ALL 13 BASIC FEATURES")
    print("="*60)

    # Login first
    if not login():
        print("\n✗ Cannot proceed without login")
        sys.exit(1)

    results = []
    results.append(("1. Add item", test_1_add_item()))
    results.append(("2. Remove item", test_2_remove_item()))
    results.append(("3. Check inventory", test_3_check_inventory()))
    results.append(("4. Check group", test_4_check_group()))
    results.append(("5. Search item", test_5_search_item()))
    results.append(("6. Export data", test_6_export_data()))
    results.append(("7. Generate report", test_7_generate_report()))
    results.append(("8. View item history", test_8_view_item_history()))
    results.append(("9. Backup data", test_9_backup_data()))
    results.append(("10. Delete item", test_10_delete_item()))
    results.append(("11. Rename group", test_11_rename_group()))
    results.append(("12. Manage users", test_12_manage_users()))
    results.append(("13. Price management", test_13_price_management()))

    print("\n" + "="*60)
    print("RESULTS SUMMARY")
    print("="*60)

    passed = 0
    failed = 0
    for feature, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{feature:30s} {status}")
        if result:
            passed += 1
        else:
            failed += 1

    print("="*60)
    print(f"TOTAL: {passed} passed, {failed} failed out of {len(results)}")
    print("="*60)

    if failed == 0:
        print("\n🎉 ALL FEATURES WORKING PERFECTLY!")
        return 0
    else:
        print(f"\n⚠️  {failed} features need fixing")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Cannot connect to backend server!")
        print("Make sure the backend is running: python api.py")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
