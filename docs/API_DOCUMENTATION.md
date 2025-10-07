# API Documentation

Complete API reference for the Inventory Management System.

**Base URL:** `http://localhost:8000`

**Interactive Documentation:** `http://localhost:8000/docs`

## Authentication

All endpoints (except `/token`) require JWT authentication via Bearer token.

### Login
```http
POST /token
Content-Type: application/x-www-form-urlencoded

username=admin&password=1234
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

**Usage:**
Add token to request headers:
```
Authorization: Bearer eyJhbGc...
```

---

## Users

### Get Current User
```http
GET /users/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "username": "admin",
  "role": "admin",
  "created_at": "2025-01-01T00:00:00"
}
```

### List All Users
```http
GET /users
Authorization: Bearer {token}
```
**Requires:** Admin role

**Response:**
```json
[
  {
    "username": "admin",
    "role": "admin",
    "created_at": "2025-01-01T00:00:00"
  }
]
```

### Create User
```http
POST /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "role": "editor"
}
```
**Requires:** Admin role

### Update User
```http
PUT /users/{username}
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "viewer"
}
```
**Requires:** Admin role

### Delete User
```http
DELETE /users/{username}
Authorization: Bearer {token}
```
**Requires:** Admin role

### Change Password
```http
POST /users/me/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "old_password": "1234",
  "new_password": "newpass123"
}
```

---

## Inventory

### List All Items
```http
GET /inventory
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "item_name": "Laptop Dell XPS 15",
    "quantity": 150,
    "group_name": "Electronics",
    "custom_fields": {},
    "reorder_level": 10,
    "reorder_quantity": 50
  }
]
```

### Get Specific Item
```http
GET /inventory/{item_name}
Authorization: Bearer {token}
```

### Create Item
```http
POST /inventory
Authorization: Bearer {token}
Content-Type: application/json

{
  "item_name": "New Item",
  "quantity": 100,
  "group_name": "Electronics",
  "reorder_level": 10,
  "reorder_quantity": 50,
  "custom_fields": {}
}
```
**Requires:** Admin or Editor role

### Update Item
```http
PUT /inventory/{item_name}
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 200,
  "group_name": "Electronics"
}
```
**Requires:** Admin or Editor role

### Delete Item
```http
DELETE /inventory/{item_name}
Authorization: Bearer {token}
```
**Requires:** Admin role

### Search Items
```http
POST /inventory/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "item_name": "laptop",
  "group_name": "Electronics"
}
```

### Get Item History
```http
GET /inventory/{item_name}/history
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "action": "quantity_changed",
    "item_name": "Laptop",
    "quantity": 10,
    "timestamp": "2025-01-01T10:00:00",
    "user_name": "admin"
  }
]
```

---

## Suppliers

### List Suppliers
```http
GET /suppliers?active_only=true
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "TechWorld Solutions",
    "contact_person": "John Smith",
    "email": "john@techworld.com",
    "phone": "555-0101",
    "address": "123 Tech St",
    "city": "San Francisco",
    "state": "CA",
    "rating": 4,
    "is_active": 1
  }
]
```

### Get Supplier
```http
GET /suppliers/{id}
Authorization: Bearer {token}
```

### Create Supplier
```http
POST /suppliers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Supplier",
  "contact_person": "Jane Doe",
  "email": "jane@supplier.com",
  "phone": "555-1234",
  "rating": 5,
  "is_active": 1
}
```
**Requires:** Admin or Editor role

### Update Supplier
```http
PUT /suppliers/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "is_active": 0
}
```
**Requires:** Admin or Editor role

### Delete Supplier
```http
DELETE /suppliers/{id}
Authorization: Bearer {token}
```
**Requires:** Admin role

### Get Supplier Items
```http
GET /suppliers/{id}/items
Authorization: Bearer {token}
```

### Search Suppliers
```http
GET /suppliers/search/{name}
Authorization: Bearer {token}
```

---

## Locations

### List Locations
```http
GET /locations?active_only=true
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Warehouse",
    "address": "1000 Storage Way",
    "city": "Los Angeles",
    "state": "CA",
    "location_type": "warehouse",
    "capacity": 10000,
    "current_utilization": 5000,
    "is_active": 1
  }
]
```

### Get Location
```http
GET /locations/{id}
Authorization: Bearer {token}
```

### Create Location
```http
POST /locations
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Warehouse",
  "address": "123 Storage St",
  "city": "New York",
  "state": "NY",
  "location_type": "warehouse",
  "capacity": 5000,
  "is_active": 1
}
```
**Requires:** Admin or Editor role

### Update Location
```http
PUT /locations/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_utilization": 6000
}
```
**Requires:** Admin or Editor role

### Delete Location
```http
DELETE /locations/{id}
Authorization: Bearer {token}
```
**Requires:** Admin role

### Get Location Items
```http
GET /locations/{id}/items
Authorization: Bearer {token}
```

### Assign Item to Location
```http
POST /item-locations
Authorization: Bearer {token}
Content-Type: application/json

{
  "item_name": "Laptop",
  "location_id": 1,
  "quantity": 50,
  "aisle": "A1",
  "shelf": "S3"
}
```
**Requires:** Admin or Editor role

---

## Batches

### List Batches
```http
GET /batches?status=active&expiring_soon=true
Authorization: Bearer {token}
```

**Query Parameters:**
- `status`: Filter by status (active, expired, recalled, quarantined, sold_out)
- `expiring_soon`: Filter batches expiring within 30 days

**Response:**
```json
[
  {
    "id": 1,
    "batch_number": "BATCH-LAPTOP-1234",
    "item_name": "Laptop Dell XPS 15",
    "quantity": 50,
    "manufacturing_date": "2024-01-01",
    "expiry_date": "2025-06-01",
    "received_date": "2024-02-01",
    "status": "active"
  }
]
```

### Create Batch
```http
POST /batches
Authorization: Bearer {token}
Content-Type: application/json

{
  "batch_number": "BATCH-001",
  "item_name": "Laptop",
  "location_id": 1,
  "quantity": 100,
  "manufacturing_date": "2025-01-01",
  "expiry_date": "2026-01-01",
  "supplier_id": 1,
  "cost_per_unit": 500.00,
  "status": "active"
}
```
**Requires:** Admin or Editor role

### Update Batch
```http
PUT /batches/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "expired",
  "quantity": 0
}
```
**Requires:** Admin or Editor role

### Get Item Batches
```http
GET /items/{item_name}/batches?active_only=true
Authorization: Bearer {token}
```

---

## Stock Adjustments

### List Adjustments
```http
GET /stock-adjustments?item_name=Laptop&limit=100
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "item_name": "Laptop",
    "adjustment_type": "decrease",
    "quantity": 5,
    "reason": "damaged",
    "reason_notes": "Water damage",
    "adjusted_by": "admin",
    "adjustment_date": "2025-01-01T10:00:00"
  }
]
```

### Create Adjustment
```http
POST /stock-adjustments
Authorization: Bearer {token}
Content-Type: application/json

{
  "item_name": "Laptop",
  "adjustment_type": "decrease",
  "quantity": 5,
  "reason": "damaged",
  "reason_notes": "Screen broken",
  "adjusted_by": "admin",
  "location_id": 1
}
```
**Requires:** Admin or Editor role

**Adjustment Reasons:**
- `damaged` - Items damaged
- `stolen` - Theft
- `lost` - Lost items
- `expired` - Expired products
- `returned` - Customer returns
- `found` - Found items
- `correction` - Inventory count correction
- `transfer` - Location transfer
- `donation` - Donated items
- `sample` - Sample/demo items
- `other` - Other reasons

---

## Alerts

### List Alerts
```http
GET /alerts?unread_only=true&alert_type=low_stock
Authorization: Bearer {token}
```

**Query Parameters:**
- `unread_only`: Show only unread alerts
- `alert_type`: Filter by type (low_stock, reorder, expiring_soon, expired, etc.)

**Response:**
```json
[
  {
    "id": 1,
    "alert_type": "low_stock",
    "severity": "high",
    "item_name": "Laptop",
    "message": "Low stock alert: Laptop is running low",
    "is_read": false,
    "is_resolved": false,
    "created_at": "2025-01-01T10:00:00"
  }
]
```

### Update Alert
```http
PUT /alerts/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_read": true,
  "is_resolved": true
}
```

### Check Reorder Levels
```http
POST /alerts/check-reorder-levels
Authorization: Bearer {token}
```

Creates alerts for items below reorder level.

---

## Prices

### List All Prices
```http
GET /prices
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "item_name": "Laptop",
    "price": 899.99,
    "supplier": "TechWorld Solutions",
    "date_updated": "2025-01-01T00:00:00",
    "is_unit_price": 1
  }
]
```

### Get Item Prices
```http
GET /prices/{item_name}
Authorization: Bearer {token}
```

Returns all supplier prices for an item.

### Add Price
```http
POST /prices/{item_name}
Authorization: Bearer {token}
Content-Type: application/json

{
  "price": 899.99,
  "supplier": "TechWorld Solutions",
  "is_unit_price": 1
}
```
**Requires:** Admin or Editor role

### Update Price
```http
PUT /prices/{item_name}
Authorization: Bearer {token}
Content-Type: application/json

{
  "price": 849.99,
  "supplier": "TechWorld Solutions"
}
```
**Requires:** Admin or Editor role

### Delete Price
```http
DELETE /prices/{item_name}?supplier=TechWorld
Authorization: Bearer {token}
```
**Requires:** Admin role

### Get Cheapest Supplier
```http
GET /prices/{item_name}/cheapest
Authorization: Bearer {token}
```

**Response:**
```json
{
  "supplier": "TechWorld Solutions",
  "price": 799.99
}
```

### Get Price History
```http
GET /prices/{item_name}/history
Authorization: Bearer {token}
```

### Compare All Prices
```http
GET /prices/compare/all
Authorization: Bearer {token}
```

Returns price comparison for all items across suppliers.

---

## Groups

### List Groups
```http
GET /groups
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "group_name": "Electronics",
    "description": "Electronic items",
    "item_count": 15
  }
]
```

### Create Group
```http
POST /groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "group_name": "New Category",
  "description": "Description here"
}
```
**Requires:** Admin role

### Rename Group
```http
PUT /groups/{old_name}
Authorization: Bearer {token}
Content-Type: application/json

{
  "new_name": "Updated Category"
}
```
**Requires:** Admin role

### Delete Group
```http
DELETE /groups/{group_name}
Authorization: Bearer {token}
```
**Requires:** Admin role

---

## Reports

### Low Stock Report
```http
GET /reports/low-stock?threshold=10
Authorization: Bearer {token}
```

Returns items below threshold quantity.

### Inventory Report
```http
GET /reports/inventory?groups=Electronics,Furniture
Authorization: Bearer {token}
```

Returns inventory summary by groups.

### Activity Report
```http
GET /reports/activity?start_date=2025-01-01&end_date=2025-01-31
Authorization: Bearer {token}
```

Returns activity log for date range.

---

## System

### Create Backup
```http
POST /backup
Authorization: Bearer {token}
```

Creates database backup file.

**Response:**
```json
{
  "message": "Backup created",
  "filename": "inventory_backup_20250101_120000.db"
}
```
**Requires:** Admin role

### Export to CSV
```http
GET /export/csv?groups=Electronics
Authorization: Bearer {token}
```

Downloads inventory as CSV file.

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "detail": "Error message here"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

## CORS

CORS is enabled for:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:8001`
- `http://127.0.0.1:8001`

## Testing

Use the interactive API documentation at `http://localhost:8000/docs` to test endpoints.

Or use curl:
```bash
# Login
curl -X POST http://localhost:8000/token \
  -d "username=admin&password=1234"

# Get inventory (with token)
curl http://localhost:8000/inventory \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
