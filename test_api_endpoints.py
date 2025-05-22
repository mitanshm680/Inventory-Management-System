import requests
import json

BASE_URL = "http://localhost:8001"

# Authentication
def get_auth_token():
    login_data = {
        "username": "user",
        "password": "1234"
    }
    response = requests.post(f"{BASE_URL}/token", data=login_data)
    if response.status_code == 200:
        token = response.json()["access_token"]
        return token
    else:
        print(f"Authentication failed: {response.text}")
        return None

token = get_auth_token()
if not token:
    print("Could not authenticate, exiting.")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Test inventory endpoints
print("\nTesting inventory endpoints...")

# Add a test item
test_item = {
    "item_name": "test_item",
    "quantity": 10,
    "group": "test_group",
    "custom_fields": {
        "color": "red",
        "size": "large"
    }
}
response = requests.post(f"{BASE_URL}/inventory", json=test_item, headers=headers)
print(f"Add item result: {response.status_code}, {response.text}")

# Get inventory
response = requests.get(f"{BASE_URL}/inventory", headers=headers)
print(f"Get inventory result: {response.status_code}")
print(f"Items in inventory: {len(response.json())}")

# Update item's custom fields
custom_fields_update = {
    "custom_fields": {
        "color": "blue",
        "size": "medium",
        "material": "cotton"
    },
    "merge": True
}
response = requests.put(f"{BASE_URL}/inventory/test_item/custom-fields", 
                       json=custom_fields_update, headers=headers)
print(f"Update custom fields result: {response.status_code}, {response.text}")

# Test price endpoints
print("\nTesting price endpoints...")

try:
    # Set price for test item
    price_data = {
        "price": 19.99,
        "supplier": "test_supplier"
    }
    response = requests.put(f"{BASE_URL}/prices/test_item", json=price_data, headers=headers)
    print(f"Set price result: {response.status_code}, {response.text}")

    # Get price for test item
    response = requests.get(f"{BASE_URL}/prices/test_item", headers=headers)
    if response.status_code == 200:
        print(f"Get price result: {response.status_code}")
        print(f"Price data: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Get price failed: {response.status_code}, {response.text}")
except Exception as e:
    print(f"Price endpoint error: {e}")

# Test reports
print("\nTesting report endpoints...")
try:
    response = requests.get(f"{BASE_URL}/reports/low-stock", headers=headers)
    print(f"Low stock report result: {response.status_code}")
    if response.status_code == 200:
        print(f"Low stock items: {len(response.json())}")
    else:
        print(f"Low stock report failed: {response.text}")
except Exception as e:
    print(f"Report endpoint error: {e}")

print("\nTests completed!") 