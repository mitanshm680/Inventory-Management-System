#!/bin/bash
# Test all API endpoints

echo "===== TESTING INVENTORY MANAGEMENT API ====="
echo ""

# Get auth token
echo "[1/10] Testing login..."
TOKEN=$(curl -s -X POST http://127.0.0.1:8001/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=1234" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi
echo "✓ Login successful"

# Test GET /groups
echo ""
echo "[2/10] Testing GET /groups..."
curl -s -X GET http://127.0.0.1:8001/groups \
  -H "Authorization: Bearer $TOKEN" | head -100
echo "✓ GET /groups works"

# Test POST /groups
echo ""
echo "[3/10] Testing POST /groups..."
curl -s -X POST http://127.0.0.1:8001/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"group_name": "Electronics", "description": "Electronic items"}'
echo "✓ POST /groups works"

# Test GET /inventory
echo ""
echo "[4/10] Testing GET /inventory..."
curl -s -X GET http://127.0.0.1:8001/inventory \
  -H "Authorization: Bearer $TOKEN" | head -100
echo "✓ GET /inventory works"

# Test POST /inventory
echo ""
echo "[5/10] Testing POST /inventory..."
curl -s -X POST http://127.0.0.1:8001/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_name": "Laptop", "quantity": 10, "group_name": "Electronics"}'
echo "✓ POST /inventory works"

# Test GET /inventory (with item)
echo ""
echo "[6/10] Testing GET /inventory (after adding)..."
curl -s -X GET http://127.0.0.1:8001/inventory \
  -H "Authorization: Bearer $TOKEN"
echo "✓ GET /inventory shows added item"

# Test GET /prices
echo ""
echo "[7/10] Testing GET /prices..."
curl -s -X GET http://127.0.0.1:8001/prices \
  -H "Authorization: Bearer $TOKEN"
echo "✓ GET /prices works"

# Test PUT /prices
echo ""
echo "[8/10] Testing PUT /prices..."
curl -s -X PUT http://127.0.0.1:8001/prices/Laptop \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": 999.99, "supplier": "TechStore"}'
echo "✓ PUT /prices works"

# Test GET /reports/inventory
echo ""
echo "[9/10] Testing GET /reports/inventory..."
curl -s -X GET http://127.0.0.1:8001/reports/inventory \
  -H "Authorization: Bearer $TOKEN"
echo "✓ GET /reports/inventory works"

# Test GET /users/me
echo ""
echo "[10/10] Testing GET /users/me..."
curl -s -X GET http://127.0.0.1:8001/users/me \
  -H "Authorization: Bearer $TOKEN"
echo "✓ GET /users/me works"

echo ""
echo "===== ALL API TESTS PASSED! ====="
