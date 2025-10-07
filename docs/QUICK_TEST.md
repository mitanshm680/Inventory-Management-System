# 🚀 Quick Test - 5 Minute Guide

**Fast way to test the new supplier-location features**

---

## Step 1: Generate Database (30 seconds)
```bash
python generate_sample_data.py
```
Wait for "SUCCESS!" message

---

## Step 2: Start Backend (10 seconds)
```bash
python api.py
```
Wait for "Uvicorn running on http://127.0.0.1:8001"

---

## Step 3: Open Browser
Go to: **http://127.0.0.1:8001/docs**

---

## Step 4: Login (1 minute)
1. Click **"Authorize"** button (top right)
2. Enter:
   - Username: `admin`
   - Password: `1234`
3. Click **Login**
4. Click **Close**

---

## Step 5: Test New Features (3 minutes)

### Test A: Get Supplier Products
1. Scroll to **"GET /supplier-products/{supplier_id}"**
2. Click **"Try it out"**
3. Enter supplier_id: `1`
4. Click **"Execute"**
5. ✅ Should see list of products with prices

### Test B: Compare Suppliers for an Item
1. Find **"GET /item-suppliers/{item_name}"**
2. Click **"Try it out"**
3. Enter item_name: `Laptop Dell XPS 15`
4. Click **"Execute"**
5. ✅ Should see 2-3 suppliers with different prices

### Test C: Find Best Price (NO location)
1. Find **"GET /best-price/{item_name}"**
2. Click **"Try it out"**
3. Enter item_name: `Laptop Dell XPS 15`
4. Leave location_id empty
5. Click **"Execute"**
6. ✅ Note the supplier and price

### Test D: Find Best Price (WITH location) - THE KEY TEST!
1. Same endpoint: **"GET /best-price/{item_name}"**
2. Click **"Try it out"**
3. Enter item_name: `Laptop Dell XPS 15`
4. Enter location_id: `1`
5. Click **"Execute"**
6. ✅ **Notice**:
   - Supplier may be different from Test C
   - Response includes `shipping_cost`
   - Response includes `total_cost`
   - System chose cheapest **total** (not just unit price)

### Test E: Get Supplier Locations
1. Find **"GET /supplier-locations/{supplier_id}"**
2. Click **"Try it out"**
3. Enter supplier_id: `1`
4. Click **"Execute"**
5. ✅ Should see locations with shipping costs

---

## ✅ Success Criteria

You've successfully tested if you see:

- [x] Multiple suppliers can offer the same product
- [x] Each supplier has different prices
- [x] System finds best price without location
- [x] System finds best **total** price with location (item + shipping)
- [x] Supplier locations tracked with distance and shipping costs

---

## 🎯 The Key Feature

**What makes this special:**

Without location: "Who has cheapest item price?"
With location: "Who has cheapest **delivered** price?"

**Example:**
- Supplier A: $1000 item + $100 shipping = $1100 total
- Supplier B: $1050 item + $20 shipping = $1070 total
- **System picks Supplier B** (cheaper total)

---

## 📖 Full Testing Guide

For detailed step-by-step instructions, see: **docs/TESTING_GUIDE.md**

---

## 🐛 Problems?

**Backend won't start:**
```bash
# Kill existing processes
taskkill /F /IM python.exe
python api.py
```

**No data:**
```bash
python generate_sample_data.py
```

**Need help:** Check `docs/TESTING_GUIDE.md` for detailed troubleshooting

---

**Ready in 5 minutes! Start testing! 🚀**
