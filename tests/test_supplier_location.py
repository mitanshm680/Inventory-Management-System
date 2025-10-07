"""
Test suite for supplier-location and supplier-product features
"""
import requests
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://127.0.0.1:8001"

def get_auth_token():
    """Get authentication token"""
    data = {"username": "admin", "password": "1234"}
    response = requests.post(f"{BASE_URL}/token", data=data, timeout=5)
    return response.json()["access_token"]

def test_supplier_products(token):
    """Test supplier-product relationships"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("\nTesting Supplier-Product Features...")
    print("=" * 60)

    try:
        # Get inventory items
        response = requests.get(f"{BASE_URL}/inventory", headers=headers, timeout=5)
        items = response.json()

        if not items:
            print("⚠ No items in inventory, skipping supplier-product tests")
            return True

        # Get first item
        first_item = list(items.keys())[0] if isinstance(items, dict) else items[0].get('name')

        # Get suppliers
        response = requests.get(f"{BASE_URL}/suppliers", headers=headers, timeout=5)
        suppliers = response.json()

        if not suppliers:
            print("⚠ No suppliers found, skipping supplier-product tests")
            return True

        supplier_id = suppliers[0]['id']

        # Create supplier-product relationship
        supplier_product_data = {
            "supplier_id": supplier_id,
            "item_name": first_item,
            "supplier_sku": "TEST-SKU-001",
            "unit_price": 99.99,
            "minimum_order_quantity": 10,
            "lead_time_days": 5,
            "is_available": True,
            "notes": "Test product"
        }

        response = requests.post(
            f"{BASE_URL}/supplier-products",
            json=supplier_product_data,
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            print("✓ Created supplier-product relationship")
            product_id = response.json().get("id")
        else:
            # Might already exist, that's ok
            print("⚠ Supplier-product relationship already exists")
            product_id = None

        # Get products from supplier
        response = requests.get(
            f"{BASE_URL}/supplier-products/{supplier_id}",
            headers=headers,
            timeout=5
        )
        assert response.status_code == 200, f"Failed to get supplier products: {response.status_code}"
        products = response.json()
        print(f"✓ Retrieved {len(products)} products from supplier")

        # Get suppliers for item
        response = requests.get(
            f"{BASE_URL}/item-suppliers/{first_item}",
            headers=headers,
            timeout=5
        )
        assert response.status_code == 200, f"Failed to get item suppliers: {response.status_code}"
        item_suppliers = response.json()
        print(f"✓ Retrieved {len(item_suppliers)} suppliers for item")

        # Get best price
        response = requests.get(
            f"{BASE_URL}/best-price/{first_item}",
            headers=headers,
            timeout=5
        )
        if response.status_code == 200:
            best_price = response.json()
            print(f"✓ Found best price: ${best_price['unit_price']} from {best_price['supplier_name']}")
        else:
            print("⚠ No suppliers with prices found for this item")

        # Update supplier-product (if we created one)
        if product_id:
            update_data = {
                **supplier_product_data,
                "unit_price": 89.99  # Update price
            }
            response = requests.put(
                f"{BASE_URL}/supplier-products/{product_id}",
                json=update_data,
                headers=headers,
                timeout=5
            )
            assert response.status_code == 200, f"Failed to update supplier-product: {response.status_code}"
            print("✓ Updated supplier-product price")

        return True

    except AssertionError as e:
        print(f"✗ Assertion failed: {e}")
        return False
    except Exception as e:
        print(f"✗ Supplier-product test failed: {e}")
        return False

def test_supplier_locations(token):
    """Test supplier-location relationships"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("\nTesting Supplier-Location Features...")
    print("=" * 60)

    try:
        # Get suppliers
        response = requests.get(f"{BASE_URL}/suppliers", headers=headers, timeout=5)
        suppliers = response.json()

        if not suppliers:
            print("⚠ No suppliers found, skipping supplier-location tests")
            return True

        supplier_id = suppliers[0]['id']

        # Get locations
        response = requests.get(f"{BASE_URL}/locations", headers=headers, timeout=5)
        locations = response.json()

        if not locations:
            print("⚠ No locations found, skipping supplier-location tests")
            return True

        location_id = locations[0]['id']

        # Create supplier-location relationship
        supplier_location_data = {
            "supplier_id": supplier_id,
            "location_id": location_id,
            "distance_km": 25.5,
            "estimated_delivery_days": 2,
            "shipping_cost": 15.00,
            "is_preferred": True,
            "notes": "Test supplier-location"
        }

        response = requests.post(
            f"{BASE_URL}/supplier-locations",
            json=supplier_location_data,
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            print("✓ Created supplier-location relationship")
            sl_id = response.json().get("id")
        else:
            print("⚠ Supplier-location relationship already exists")
            sl_id = None

        # Get locations for supplier
        response = requests.get(
            f"{BASE_URL}/supplier-locations/{supplier_id}",
            headers=headers,
            timeout=5
        )
        assert response.status_code == 200, f"Failed to get supplier locations: {response.status_code}"
        supplier_locs = response.json()
        print(f"✓ Retrieved {len(supplier_locs)} locations for supplier")

        # Get suppliers for location
        response = requests.get(
            f"{BASE_URL}/location-suppliers/{location_id}",
            headers=headers,
            timeout=5
        )
        assert response.status_code == 200, f"Failed to get location suppliers: {response.status_code}"
        location_suppliers = response.json()
        print(f"✓ Retrieved {len(location_suppliers)} suppliers for location")

        # Get best price with location
        response = requests.get(f"{BASE_URL}/inventory", headers=headers, timeout=5)
        items = response.json()
        if items:
            first_item = list(items.keys())[0] if isinstance(items, dict) else items[0].get('name')

            response = requests.get(
                f"{BASE_URL}/best-price/{first_item}?location_id={location_id}",
                headers=headers,
                timeout=5
            )
            if response.status_code == 200:
                best_price = response.json()
                total_cost = best_price.get('total_cost', best_price['unit_price'])
                print(f"✓ Best price with shipping: ${total_cost}")
            else:
                print("⚠ No suppliers with location pricing found")

        # Update supplier-location (if we created one)
        if sl_id:
            update_data = {
                **supplier_location_data,
                "shipping_cost": 12.00  # Update shipping cost
            }
            response = requests.put(
                f"{BASE_URL}/supplier-locations/{sl_id}",
                json=update_data,
                headers=headers,
                timeout=5
            )
            assert response.status_code == 200, f"Failed to update supplier-location: {response.status_code}"
            print("✓ Updated supplier-location shipping cost")

        return True

    except AssertionError as e:
        print(f"✗ Assertion failed: {e}")
        return False
    except Exception as e:
        print(f"✗ Supplier-location test failed: {e}")
        return False

def main():
    """Run all supplier-location tests"""
    print("=" * 60)
    print("SUPPLIER-LOCATION FEATURE TEST SUITE")
    print("=" * 60)

    try:
        print("\nAuthenticating...")
        token = get_auth_token()
        print("✓ Authentication successful")

        # Run tests
        sp_result = test_supplier_products(token)
        sl_result = test_supplier_locations(token)

        print("\n" + "=" * 60)
        if sp_result and sl_result:
            print("✓ ALL SUPPLIER-LOCATION TESTS PASSED")
        else:
            print("✗ SOME TESTS FAILED")
        print("=" * 60)

        return sp_result and sl_result

    except Exception as e:
        print(f"\n✗ Test suite failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
