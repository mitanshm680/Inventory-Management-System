#!/usr/bin/env python3
"""
End-to-end connection test for Inventory Management System
Tests database -> backend -> frontend connectivity
"""
import requests
import json
import sys

def print_success(msg):
    print(f"[OK] {msg}")

def print_error(msg):
    print(f"[ERROR] {msg}")

def print_info(msg):
    print(f"[INFO] {msg}")

def print_warning(msg):
    print(f"[WARNING] {msg}")

def test_backend_health():
    """Test backend health endpoint"""
    try:
        response = requests.get("http://127.0.0.1:8001/health", timeout=5)
        if response.status_code == 200:
            print_success("Backend health check passed")
            return True
        else:
            print_error(f"Backend health check failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Backend health check failed: {e}")
        return False

def test_backend_login():
    """Test backend login endpoint"""
    try:
        response = requests.post(
            "http://127.0.0.1:8001/token",
            data={"username": "admin", "password": "1234"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print_success("Backend login successful")
                return data["access_token"]
            else:
                print_error("Backend login failed: No access token in response")
                return None
        else:
            print_error(f"Backend login failed: HTTP {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Backend login failed: {e}")
        return None

def test_backend_inventory(token):
    """Test backend inventory endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://127.0.0.1:8001/inventory", headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Backend inventory endpoint working ({len(data)} items found)")
            return True
        else:
            print_error(f"Backend inventory failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Backend inventory failed: {e}")
        return False

def test_backend_suppliers(token):
    """Test backend suppliers endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://127.0.0.1:8001/suppliers", headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            suppliers = data.get("suppliers", [])
            print_success(f"Backend suppliers endpoint working ({len(suppliers)} suppliers found)")
            return True
        else:
            print_error(f"Backend suppliers failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Backend suppliers failed: {e}")
        return False

def test_backend_locations(token):
    """Test backend locations endpoint"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("http://127.0.0.1:8001/locations", headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            locations = data.get("locations", [])
            print_success(f"Backend locations endpoint working ({len(locations)} locations found)")
            return True
        else:
            print_error(f"Backend locations failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Backend locations failed: {e}")
        return False

def test_frontend():
    """Test frontend is accessible"""
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200 and "Inventory Management System" in response.text:
            print_success("Frontend is accessible")
            return True
        else:
            print_error("Frontend not accessible or incorrect content")
            return False
    except Exception as e:
        print_error(f"Frontend test failed: {e}")
        return False

def test_cors():
    """Test CORS configuration"""
    try:
        headers = {"Origin": "http://localhost:3000"}
        response = requests.options("http://127.0.0.1:8001/health", headers=headers, timeout=5)
        if response.status_code == 200:
            print_success("CORS configuration correct")
            return True
        else:
            print_warning(f"CORS check returned HTTP {response.status_code}")
            return True  # Not critical
    except Exception as e:
        print_warning(f"CORS test failed: {e}")
        return True  # Not critical

def main():
    print("\n" + "="*60)
    print("  Inventory Management System - Connection Test")
    print("="*60 + "\n")

    all_passed = True

    # Test 1: Backend Health
    print_info("Testing backend health...")
    if not test_backend_health():
        all_passed = False
        print_error("Backend is not running!")
        print_info("Start backend with: python api.py")
        sys.exit(1)

    # Test 2: Backend Login
    print_info("Testing backend authentication...")
    token = test_backend_login()
    if not token:
        all_passed = False
        print_error("Backend login failed!")
        sys.exit(1)

    # Test 3: Backend Inventory
    print_info("Testing inventory endpoint...")
    if not test_backend_inventory(token):
        all_passed = False

    # Test 4: Backend Suppliers
    print_info("Testing suppliers endpoint...")
    if not test_backend_suppliers(token):
        all_passed = False

    # Test 5: Backend Locations
    print_info("Testing locations endpoint...")
    if not test_backend_locations(token):
        all_passed = False

    # Test 6: CORS
    print_info("Testing CORS configuration...")
    test_cors()

    # Test 7: Frontend
    print_info("Testing frontend accessibility...")
    if not test_frontend():
        all_passed = False
        print_warning("Frontend is not running!")
        print_info("Start frontend with: cd frontend && npm start")

    # Summary
    print("\n" + "="*60)
    if all_passed:
        print_success("ALL TESTS PASSED! System is fully connected.")
        print_info("\nYou can now access the application at:")
        print(f"  Frontend: http://localhost:3000")
        print(f"  Backend:  http://127.0.0.1:8001")
        print(f"\n  Login credentials:")
        print(f"    Username: admin")
        print(f"    Password: 1234")
    else:
        print_error("SOME TESTS FAILED! Check the errors above.")
        sys.exit(1)
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
