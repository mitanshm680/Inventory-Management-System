# 🧪 Step-by-Step Testing Guide

**Complete manual testing guide for new supplier-location features**

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Deleted old database (inventory.db)
- ✅ Python 3.8+ installed
- ✅ Node.js 14+ installed
- ✅ All dependencies installed (`pip install -r requirements.txt`)

---

## 🚀 STEP 1: Generate Fresh Database with Sample Data

Run this command to create a new database with all the new features:

```bash
python generate_sample_data.py
```

**Expected Output:**
```
Generating sample data...
============================================================

[1/12] Creating groups...
   Created 5 groups

[2/12] Creating suppliers...
   Created 5 suppliers

[3/12] Creating locations...
   Created 4 locations

[4/12] Creating items...
   Created 21 items

[5/12] Creating prices...
   Created XX prices

[10/12] Creating supplier-product relationships...
   Created 41 supplier-product relationships

[11/12] Creating supplier-location relationships...
   Created 14 supplier-location relationships

SUCCESS! Sample data generated successfully
```

✅ **Verification**: You should see "SUCCESS!" at the end

---

## 🚀 STEP 2: Start the Backend Server

Open a **new terminal** and run:

```bash
python api.py
```

**Expected Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8001
```

✅ **Verification**: Server should be running on port 8001
⚠️ **Keep this terminal open** - don't close it!

---

## 🧪 STEP 3: Test Authentication

Open a **new terminal** (keep the backend running) and test login:

```bash
curl -X POST "http://127.0.0.1:8001/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "username=admin&password=1234"
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

✅ **Verification**: You should receive an access token

**💡 Save the token** - you'll need it for the next steps!

---

## 🧪 STEP 4: Test Basic Endpoints

**Set your token** (replace YOUR_TOKEN with the actual token from Step 3):

**For Windows PowerShell:**
```powershell
$TOKEN = "YOUR_TOKEN_HERE"
```

**For Windows CMD:**
```cmd
set TOKEN=YOUR_TOKEN_HERE
```

**For Mac/Linux:**
```bash
export TOKEN="YOUR_TOKEN_HERE"
```

### Test 4.1: Get All Items
```bash
curl -X GET "http://127.0.0.1:8001/inventory" ^
  -H "Authorization: Bearer %TOKEN%"
```

✅ **Expected**: List of 21 items

### Test 4.2: Get All Suppliers
```bash
curl -X GET "http://127.0.0.1:8001/suppliers" ^
  -H "Authorization: Bearer %TOKEN%"
```

✅ **Expected**: List of 5 suppliers (TechWorld Solutions, Office Depot Pro, Global Electronics, Furniture Direct, Supply Hub)

### Test 4.3: Get All Locations
```bash
curl -X GET "http://127.0.0.1:8001/locations" ^
  -H "Authorization: Bearer %TOKEN%"
```

✅ **Expected**: List of 4 locations (Main Warehouse, Downtown Office, Distribution Center, West Coast Hub)

---

## 🆕 STEP 5: Test Supplier-Product Features

### Test 5.1: Get Products from Supplier #1
```bash
curl -X GET "http://127.0.0.1:8001/supplier-products/1" ^
  -H "Authorization: Bearer %TOKEN%"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "supplier_id": 1,
    "item_name": "Laptop Dell XPS 15",
    "supplier_sku": "SKU-1-LAPTO",
    "unit_price": 1299.99,
    "minimum_order_quantity": 10,
    "lead_time_days": 5,
    "is_available": true,
    "notes": "Best price for orders over 50 units"
  },
  ...
]
```

✅ **Verification**: You should see multiple products with prices

### Test 5.2: Find All Suppliers for an Item
```bash
curl -X GET "http://127.0.0.1:8001/item-suppliers/Laptop Dell XPS 15" ^
  -H "Authorization: Bearer %TOKEN%"
```

**Expected Response:**
```json
[
  {
    "supplier_id": 1,
    "supplier_name": "TechWorld Solutions",
    "unit_price": 1299.99,
    "supplier_sku": "SKU-1-LAPTO",
    "minimum_order_quantity": 10,
    "lead_time_days": 5,
    "is_available": true
  },
  {
    "supplier_id": 3,
    "supplier_name": "Global Electronics",
    "unit_price": 1349.99,
    "supplier_sku": "SKU-3-LAPTO",
    "minimum_order_quantity": 5,
    "lead_time_days": 3,
    "is_available": true
  }
]
```

✅ **Verification**: List should be sorted by price (cheapest first)

### Test 5.3: Find Best Price for an Item (No Location)
```bash
curl -X GET "http://127.0.0.1:8001/best-price/Laptop Dell XPS 15" ^
  -H "Authorization: Bearer %TOKEN%"
```

**Expected Response:**
```json
{
  "item_name": "Laptop Dell XPS 15",
  "supplier_id": 1,
  "supplier_name": "TechWorld Solutions",
  "unit_price": 1299.99,
  "supplier_sku": "SKU-1-LAPTO",
  "minimum_order_quantity": 10,
  "lead_time_days": 5
}
```

✅ **Verification**: Should return the cheapest supplier

---

## 🆕 STEP 6: Test Supplier-Location Features

### Test 6.1: Get Locations Supplier Can Deliver To
```bash
curl -X GET "http://127.0.0.1:8001/supplier-locations/1" ^
  -H "Authorization: Bearer %TOKEN%"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "supplier_id": 1,
    "location_id": 1,
    "location_name": "Main Warehouse",
    "distance_km": 125.5,
    "estimated_delivery_days": 2,
    "shipping_cost": 15.50,
    "is_preferred": true,
    "notes": "Free shipping for orders over $500"
  },
  ...
]
```

✅ **Verification**: Should show multiple locations with shipping info

### Test 6.2: Get Suppliers That Deliver to a Location
```bash
curl -X GET "http://127.0.0.1:8001/location-suppliers/1" ^
  -H "Authorization: Bearer %TOKEN%"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "supplier_id": 1,
    "supplier_name": "TechWorld Solutions",
    "location_id": 1,
    "distance_km": 125.5,
    "estimated_delivery_days": 2,
    "shipping_cost": 15.50,
    "is_preferred": true
  },
  ...
]
```

✅ **Verification**: Should show all suppliers that deliver to this location

### Test 6.3: Find Best Price Including Shipping (THE BIG TEST!)
```bash
curl -X GET "http://127.0.0.1:8001/best-price/Laptop Dell XPS 15?location_id=1" ^
  -H "Authorization: Bearer %TOKEN%"
```

**Expected Response:**
```json
{
  "item_name": "Laptop Dell XPS 15",
  "supplier_id": 3,
  "supplier_name": "Global Electronics",
  "unit_price": 1349.99,
  "shipping_cost": 5.00,
  "total_cost": 1354.99,
  "distance_km": 25.0,
  "estimated_delivery_days": 1,
  "supplier_sku": "SKU-3-LAPTO",
  "minimum_order_quantity": 5,
  "lead_time_days": 3,
  "notes": "Free shipping for orders over $500"
}
```

✅ **Verification**:
- Notice supplier changed from #1 to #3!
- Even though unit_price is higher ($1349.99 vs $1299.99)
- Total cost is lower because shipping is cheaper ($5 vs $50)
- This is the **SMART FEATURE** working!

---

## 🧪 STEP 7: Test Adding New Data (CRUD Operations)

### Test 7.1: Add a New Supplier-Product Relationship
```bash
curl -X POST "http://127.0.0.1:8001/supplier-products" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"supplier_id\":2,\"item_name\":\"Laptop Dell XPS 15\",\"unit_price\":1199.99,\"minimum_order_quantity\":1,\"lead_time_days\":7,\"supplier_sku\":\"SKU-2-LAPTO\"}"
```

**Expected Response:**
```json
{
  "message": "Supplier product added successfully",
  "id": 42
}
```

✅ **Verification**: Should return success with new ID

### Test 7.2: Verify the New Product Was Added
```bash
curl -X GET "http://127.0.0.1:8001/item-suppliers/Laptop Dell XPS 15" ^
  -H "Authorization: Bearer %TOKEN%"
```

✅ **Verification**: Should now show **3 suppliers** instead of 2, with supplier #2 having price $1199.99

### Test 7.3: Add a New Supplier-Location Link
```bash
curl -X POST "http://127.0.0.1:8001/supplier-locations" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"supplier_id\":2,\"location_id\":1,\"distance_km\":50.0,\"shipping_cost\":10.0,\"estimated_delivery_days\":1}"
```

**Expected Response:**
```json
{
  "message": "Supplier location added successfully",
  "id": 15
}
```

✅ **Verification**: Should return success

### Test 7.4: Verify Best Price Changed!
```bash
curl -X GET "http://127.0.0.1:8001/best-price/Laptop Dell XPS 15?location_id=1" ^
  -H "Authorization: Bearer %TOKEN%"
```

✅ **Expected**: Should now show supplier #2 with total cost $1209.99 ($1199.99 + $10 shipping)

---

## 🌐 STEP 8: Test Using Browser (API Documentation)

Open your browser and go to:
```
http://127.0.0.1:8001/docs
```

You should see **Swagger UI** with all API endpoints.

### Test in Browser:

1. **Click "Authorize"** button at the top right
2. **Login**:
   - Username: `admin`
   - Password: `1234`
3. **Try the new endpoints**:
   - Scroll down to "Supplier-Products" section
   - Click on `GET /supplier-products/{supplier_id}`
   - Click "Try it out"
   - Enter supplier_id: `1`
   - Click "Execute"
   - ✅ Should see products list

4. **Try best price finder**:
   - Find `GET /best-price/{item_name}`
   - Click "Try it out"
   - item_name: `Laptop Dell XPS 15`
   - location_id: `1`
   - Click "Execute"
   - ✅ Should see best price with shipping

---

## 🚀 STEP 9: Start Frontend (Optional)

If you want to test the full UI:

**Open a third terminal** and run:
```bash
cd frontend
npm start
```

**Access**: http://localhost:3000

**Login:**
- Username: `admin`
- Password: `1234`

**Test Global Search:**
- Press **Ctrl+K** (or Cmd+K on Mac)
- Type any item name
- ✅ Should see search results

---

## 📊 STEP 10: Run Automated Test Suite

To verify everything at once:

```bash
python tests/test_complete_system.py
```

**Expected Output:**
```
============================================================
COMPLETE SYSTEM TEST
============================================================

[1] Testing Authentication...
   ✅ OK - Authentication successful

[2] Testing Basic Endpoints...
   ✅ OK - Retrieved 21 items
   ✅ OK - Retrieved 5 suppliers
   ✅ OK - Retrieved 4 locations

[3] Testing Supplier-Product Endpoints...
   ✅ OK - Supplier products working
   ✅ OK - Item suppliers working
   ✅ OK - Best price finder working

[4] Testing Supplier-Location Endpoints...
   ✅ OK - Supplier locations working
   ✅ OK - Location suppliers working
   ✅ OK - Best price with location working

[5] Testing Other Features...
   ✅ OK - All features working

============================================================
ALL TESTS PASSED ✅
============================================================
```

---

## 🎯 What to Look For (Success Criteria)

### ✅ Multi-Supplier Products Working:
- One product can have multiple suppliers
- Each supplier has different prices
- Can compare all suppliers for any item
- Results sorted by price

### ✅ Supplier-Location Working:
- Each supplier linked to multiple locations
- Distance and shipping cost tracked
- Can find all suppliers for a location
- Can find all locations for a supplier

### ✅ Best Price Finder Working:
- **Without location**: Returns cheapest unit price
- **With location**: Returns cheapest **total** price (unit + shipping)
- Considers shipping costs in calculation
- May return different supplier when location is specified

### ✅ Smart Feature Working:
The key feature to test is this scenario:
- Supplier A: $100 item + $50 shipping = **$150 total**
- Supplier B: $120 item + $10 shipping = **$130 total**
- System should choose **Supplier B** (cheaper total even though item is more expensive)

---

## 🐛 Troubleshooting

### Problem: "Connection refused"
**Solution**: Make sure backend is running (`python api.py`)

### Problem: "Unauthorized"
**Solution**: Get a new token from Step 3

### Problem: "No data returned"
**Solution**: Regenerate database (`python generate_sample_data.py`)

### Problem: "Module not found"
**Solution**: Install dependencies (`pip install -r requirements.txt`)

### Problem: Port 8001 already in use
**Solution**:
```bash
# Find and kill the process
netstat -ano | findstr :8001
taskkill /PID <PID_NUMBER> /F
```

---

## 📝 Quick Test Checklist

Use this checklist to verify everything works:

- [ ] Database generated successfully
- [ ] Backend server started on port 8001
- [ ] Can login and get JWT token
- [ ] Can retrieve items, suppliers, locations
- [ ] Can get products from a supplier
- [ ] Can get suppliers for an item
- [ ] Can find best price (no location)
- [ ] Can get supplier locations
- [ ] Can get location suppliers
- [ ] **Can find best price with location (and it considers shipping!)**
- [ ] Can add new supplier-product relationship
- [ ] Can add new supplier-location relationship
- [ ] Can update existing relationships
- [ ] Automated test suite passes
- [ ] API docs accessible at /docs
- [ ] Frontend starts (optional)
- [ ] Global search works (Ctrl+K) (optional)

---

## 🎓 Understanding the Data

After running `generate_sample_data.py`, you'll have:

**5 Suppliers:**
1. TechWorld Solutions (San Francisco)
2. Office Depot Pro (New York)
3. Global Electronics (Seattle)
4. Furniture Direct (Austin)
5. Supply Hub (Chicago)

**4 Locations:**
1. Main Warehouse (Los Angeles)
2. Downtown Office (New York)
3. Distribution Center (Dallas)
4. West Coast Hub (Seattle)

**21 Items** including:
- Electronics (Laptops, Monitors, Webcams)
- Peripherals (Mouse, Keyboard, Headphones)
- Furniture (Chairs, Desks, Whiteboards)
- Office Supplies (Paper, Pens, Binders)

**41 Supplier-Product Links**
- Each item has 1-3 suppliers offering it
- Different prices from each supplier
- Different minimum order quantities

**14 Supplier-Location Links**
- Each supplier delivers to 2-4 locations
- Different shipping costs based on distance
- Different delivery times

---

## 🚀 Ready to Test!

You now have everything you need to manually test the system.

**Start with Step 1** and work your way through each step.

Good luck! 🎉
