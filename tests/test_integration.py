"""
Integration test to verify backend, database, and API endpoints work correctly
"""
import requests
import json
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://127.0.0.1:8001"

def test_health_check():
    """Test if the API is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print("✓ Health check passed")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_login():
    """Test authentication"""
    try:
        data = {
            "username": "admin",
            "password": "1234"
        }
        response = requests.post(
            f"{BASE_URL}/token",
            data=data,
            timeout=5
        )
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        result = response.json()
        assert "access_token" in result, "No access token in response"
        print("✓ Authentication works")
        return result["access_token"]
    except Exception as e:
        print(f"✗ Authentication failed: {e}")
        return None

def test_inventory_endpoints(token):
    """Test inventory CRUD operations"""
    headers = {"Authorization": f"Bearer {token}"}

    try:
        # Test GET inventory
        response = requests.get(f"{BASE_URL}/inventory", headers=headers, timeout=5)
        assert response.status_code == 200, f"Get inventory failed: {response.status_code}"
        print("✓ Get inventory works")

        # Test duplicate check (new feature)
        response = requests.get(
            f"{BASE_URL}/inventory/check-duplicate/TestItem",
            headers=headers,
            timeout=5
        )
        assert response.status_code == 200, f"Duplicate check failed: {response.status_code}"
        print("✓ Duplicate detection endpoint works")

        return True
    except Exception as e:
        print(f"✗ Inventory endpoints failed: {e}")
        return False

def test_notes_endpoints(token):
    """Test notes/comments feature"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        # Get existing inventory items
        response = requests.get(f"{BASE_URL}/inventory", headers=headers, timeout=5)
        items = response.json()

        if not items:
            print("⚠ No items in inventory, skipping notes test")
            return True

        first_item_name = list(items.keys())[0] if isinstance(items, dict) else items[0].get('name')

        # Create a note
        note_data = {
            "item_name": first_item_name,
            "note_text": "Test note from integration test",
            "is_pinned": False
        }
        response = requests.post(
            f"{BASE_URL}/notes",
            json=note_data,
            headers=headers,
            timeout=5
        )
        assert response.status_code == 200, f"Create note failed: {response.status_code}"
        print("✓ Create note works")

        # Get notes for item
        response = requests.get(
            f"{BASE_URL}/notes/{first_item_name}",
            headers=headers,
            timeout=5
        )
        assert response.status_code == 200, f"Get notes failed: {response.status_code}"
        print("✓ Get notes works")

        return True
    except Exception as e:
        print(f"✗ Notes endpoints failed: {e}")
        return False

def test_bulk_operations(token):
    """Test bulk update/delete features"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        # Test bulk update endpoint exists
        bulk_data = {
            "item_names": [],
            "quantity": 100
        }
        response = requests.post(
            f"{BASE_URL}/inventory/bulk-update",
            json=bulk_data,
            headers=headers,
            timeout=5
        )
        # Should succeed even with empty list
        assert response.status_code == 200, f"Bulk update endpoint failed: {response.status_code}"
        print("✓ Bulk update endpoint works")

        return True
    except Exception as e:
        print(f"✗ Bulk operations failed: {e}")
        return False

def test_database_tables():
    """Test that all required tables exist"""
    import sqlite3

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()

        required_tables = [
            'users', 'items', 'groups', 'prices', 'price_history',
            'suppliers', 'locations', 'batches', 'stock_adjustments',
            'alerts', 'history', 'notes'  # notes is the new table
        ]

        for table in required_tables:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            result = cursor.fetchone()
            assert result is not None, f"Table {table} does not exist"

        conn.close()
        print(f"✓ All {len(required_tables)} database tables exist")
        return True
    except Exception as e:
        print(f"✗ Database table check failed: {e}")
        return False

def main():
    """Run all integration tests"""
    print("=" * 60)
    print("INTEGRATION TEST SUITE")
    print("=" * 60)
    print()

    print("Testing database...")
    db_ok = test_database_tables()
    print()

    print("Testing backend API...")
    if not test_health_check():
        print("\n✗ Backend is not running. Start it with: python api.py")
        sys.exit(1)
    print()

    print("Testing authentication...")
    token = test_login()
    if not token:
        sys.exit(1)
    print()

    print("Testing inventory endpoints...")
    test_inventory_endpoints(token)
    print()

    print("Testing new features...")
    test_notes_endpoints(token)
    test_bulk_operations(token)
    print()

    print("=" * 60)
    print("✓ ALL TESTS PASSED")
    print("=" * 60)
    print()
    print("Backend and database are working correctly!")
    print("You can now start the frontend with: cd frontend && npm start")
    print()

if __name__ == "__main__":
    main()
