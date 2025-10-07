"""Verify all system connections"""
import sqlite3
import requests
import sys
import io

# Fix encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("VERIFYING ALL SYSTEM CONNECTIONS")
print("=" * 70)

# 1. Check Backend-Database Connection
print("\n[1/3] Checking Backend ↔ Database Connection...")
try:
    conn = sqlite3.connect('inventory.db')
    cursor = conn.cursor()

    # Check all tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall()]

    print(f"   ✓ Database accessible")
    print(f"   ✓ Found {len(tables)} tables")

    # Check sample data
    cursor.execute("SELECT COUNT(*) FROM suppliers")
    suppliers_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM locations")
    locations_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM items")
    items_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM supplier_products")
    sp_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM supplier_locations")
    sl_count = cursor.fetchone()[0]

    print(f"   ✓ Suppliers: {suppliers_count}")
    print(f"   ✓ Locations: {locations_count}")
    print(f"   ✓ Items: {items_count}")
    print(f"   ✓ Supplier-Products: {sp_count}")
    print(f"   ✓ Supplier-Locations: {sl_count}")

    conn.close()
    print("   ✓ BACKEND-DATABASE: CONNECTED")

except Exception as e:
    print(f"   ✗ BACKEND-DATABASE: FAILED - {e}")
    sys.exit(1)

# 2. Check Backend API is running
print("\n[2/3] Checking Backend API...")
try:
    response = requests.get("http://127.0.0.1:8001/health", timeout=5)
    if response.status_code == 200:
        print("   ✓ Backend API is running on port 8001")
        print("   ✓ BACKEND API: ONLINE")
    else:
        print(f"   ✗ Backend returned status: {response.status_code}")
        sys.exit(1)
except requests.exceptions.ConnectionError:
    print("   ✗ BACKEND API: NOT RUNNING")
    print("   → Start backend with: python api.py")
    sys.exit(1)
except Exception as e:
    print(f"   ✗ BACKEND API: ERROR - {e}")
    sys.exit(1)

# 3. Check Frontend-Backend Connection via API
print("\n[3/3] Checking Frontend ↔ Backend Connection (via API)...")
try:
    # Login
    response = requests.post(
        "http://127.0.0.1:8001/token",
        data={"username": "admin", "password": "1234"},
        timeout=5
    )

    if response.status_code != 200:
        print(f"   ✗ Login failed: {response.status_code}")
        sys.exit(1)

    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   ✓ Authentication working")

    # Test suppliers endpoint
    response = requests.get("http://127.0.0.1:8001/suppliers", headers=headers, timeout=5)
    if response.status_code == 200:
        data = response.json()
        suppliers = data.get('suppliers', data)
        print(f"   ✓ Suppliers endpoint: {len(suppliers)} suppliers")
    else:
        print(f"   ✗ Suppliers endpoint failed: {response.status_code}")
        sys.exit(1)

    # Test locations endpoint
    response = requests.get("http://127.0.0.1:8001/locations", headers=headers, timeout=5)
    if response.status_code == 200:
        data = response.json()
        locations = data.get('locations', data)
        print(f"   ✓ Locations endpoint: {len(locations)} locations")
    else:
        print(f"   ✗ Locations endpoint failed: {response.status_code}")
        sys.exit(1)

    # Test new supplier-products endpoint
    response = requests.get("http://127.0.0.1:8001/supplier-products/1", headers=headers, timeout=5)
    if response.status_code == 200:
        products = response.json()
        print(f"   ✓ Supplier-Products endpoint: {len(products)} products")
    else:
        print(f"   ✗ Supplier-Products endpoint failed: {response.status_code}")
        sys.exit(1)

    # Test new supplier-locations endpoint
    response = requests.get("http://127.0.0.1:8001/supplier-locations/1", headers=headers, timeout=5)
    if response.status_code == 200:
        sl_data = response.json()
        print(f"   ✓ Supplier-Locations endpoint: {len(sl_data)} locations")
    else:
        print(f"   ✗ Supplier-Locations endpoint failed: {response.status_code}")
        sys.exit(1)

    print("   ✓ FRONTEND-BACKEND: CONNECTED")

except Exception as e:
    print(f"   ✗ FRONTEND-BACKEND: ERROR - {e}")
    sys.exit(1)

# Summary
print("\n" + "=" * 70)
print("✓ ALL CONNECTIONS VERIFIED SUCCESSFULLY!")
print("=" * 70)
print("\nConnection Summary:")
print("  ✓ Backend ↔ Database: WORKING")
print("  ✓ Backend API: ONLINE (port 8001)")
print("  ✓ Frontend ↔ Backend: READY")
print("\nData Summary:")
print(f"  ✓ {suppliers_count} suppliers, {locations_count} locations, {items_count} items")
print(f"  ✓ {sp_count} supplier-product relationships")
print(f"  ✓ {sl_count} supplier-location relationships")
print("\nSystem Status: FULLY OPERATIONAL ✓")
print("=" * 70)
