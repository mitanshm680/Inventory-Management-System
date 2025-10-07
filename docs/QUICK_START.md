# 🚀 Quick Start Guide - Inventory Management System

## Fresh Start (Complete Reset)

### One-Line Fresh Start
```bash
python reset_database.py --force && python api.py
```

### With Sample Data
```bash
python reset_database.py --force && python generate_sample_data.py
```

---

## 📋 Common Commands

### Reset Everything
```bash
python reset_database.py
```
- Deletes ALL data (requires confirmation)
- Shows what will be deleted
- Safe mode with double confirmation

### Force Reset (No Confirmation)
```bash
python reset_database.py --force
```
⚠️ Use with caution!

### Start API Server
```bash
python api.py
```
- Runs on `http://127.0.0.1:8001`
- Auto-creates database if missing
- Creates default admin user

### Generate Sample Data
```bash
python generate_sample_data.py
```
Creates:
- 71 items (fruits & vegetables)
- 6 suppliers
- 15+ groups
- 40+ prices
- 4 test users

### Start Frontend
```bash
cd frontend
npm start
```
- Runs on `http://localhost:3000`

---

## 🔑 Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | 1234 | Admin |

### Test Users (after running sample data)
| Username | Password | Role |
|----------|----------|------|
| john_editor | editor123 | Editor |
| jane_viewer | viewer123 | Viewer |
| bob_admin | admin456 | Admin |

---

## 🎯 Testing Workflow

### Scenario 1: Quick Test
```bash
# 1. Reset
python reset_database.py --force

# 2. Start server
python api.py &

# 3. Load sample data
python generate_sample_data.py

# 4. Start frontend
cd frontend && npm start
```

### Scenario 2: Manual Testing (Empty Database)
```bash
# 1. Reset
python reset_database.py

# 2. Start server (creates empty DB)
python api.py

# 3. Login with admin/1234
# 4. Add data manually via UI
```

### Scenario 3: Fresh Start Daily
```bash
# Add to your daily routine
python reset_database.py --force
python api.py &
python generate_sample_data.py
cd frontend && npm start
```

---

## 📊 What Gets Tested

When you run `generate_sample_data.py`:

✅ User Management (CRUD)
✅ Supplier Management (CRUD + Search)
✅ Group Management (CRUD)
✅ Inventory (CRUD + Search)
✅ Price Management (Multi-Supplier)
✅ Price Comparison (Cheapest, History)
✅ Item History
✅ Reports (Low Stock, Inventory, Activity)
✅ Backup & Export
✅ Delete Operations

---

## 🗂️ Project Structure

```
Inventory-Management-System/
├── api.py                      # Main API server
├── generate_sample_data.py     # Sample data generator
├── reset_database.py           # Database reset script ⭐
├── database/
│   ├── setup.py               # Database schema
│   └── db_connection.py       # DB connection handler
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Inventory.tsx
│       │   ├── Prices.tsx     # Enhanced with comparisons
│       │   └── Suppliers.tsx  # NEW supplier management
│       └── services/
│           └── api.ts         # API client
└── docs/
    ├── FEATURES_ADDED.md           # Feature documentation
    ├── PRICE_COMPARISON_UPDATE.md  # Price enhancement docs
    ├── RESET_DATABASE_README.md    # Reset script docs
    └── QUICK_START.md             # This file
```

---

## 🛠️ Troubleshooting

### Database Locked
```bash
# Kill all Python processes
taskkill /F /IM python.exe  # Windows
pkill python               # Linux/Mac

# Reset database
python reset_database.py --force
```

### Port Already in Use
```bash
# Find process on port 8001
netstat -ano | findstr :8001  # Windows
lsof -i :8001                 # Linux/Mac

# Kill the process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Linux/Mac
```

### Groups Already Exist Error
```bash
# Fixed! Script now handles this gracefully
# Just shows: ○ Group already exists: [name]
```

### Module Not Found
```bash
# Install dependencies
pip install fastapi uvicorn python-jose python-multipart requests

# Frontend
cd frontend
npm install
```

---

## 📈 Feature Overview

### Price Management Enhancements
- **Summary Dashboard**: Stats cards showing totals
- **Supplier Comparison**: Dollar and % differences
- **Best Price Highlighting**: Green rows for cheapest
- **Visual Indicators**: Chips, badges, color coding

### Supplier Management
- **Full CRUD**: Create, Read, Update, Delete
- **Contact Info**: Email, phone, address, website
- **Rating System**: 5-star ratings
- **Active/Inactive**: Filter suppliers
- **Search**: Find suppliers by name

### Sample Data
- **Realistic**: Real fruit/vegetable names
- **Multi-supplier**: Items have 1-3 supplier prices
- **Varied prices**: Price differences of 5-30%
- **Complete data**: SKUs, units, storage, organic status

---

## 🎨 UI Features

### Price Comparison Table
```
Item: Apple

Supplier       | Price  | Difference      | Actions
Fresh Farm Co  | $2.50  | —              | [Delete] ← GREEN ROW
Green Valley   | $2.75  | +$0.25 (+10%)  | [Delete]
Organic Harv.  | $3.00  | +$0.50 (+20%)  | [Delete]
```

### Supplier Cards
```
┌─────────────────────────────┐
│ 🚚 Fresh Farm Co    [Active]│
│ Contact: John Smith         │
├─────────────────────────────┤
│ ✉ john@freshfarm.com        │
│ ☎ (555) 123-4567           │
│ 📍 Sacramento, CA          │
│ 🌐 freshfarm.com           │
│ ⭐⭐⭐⭐⭐                    │
├─────────────────────────────┤
│ [Edit] [Delete]            │
└─────────────────────────────┘
```

---

## 📝 Quick Checks

### Is Everything Working?
```bash
# 1. Check API
curl http://127.0.0.1:8001/health
# Should return: {"status":"healthy"}

# 2. Check database exists
ls *.db
# Should see: inventory.db

# 3. Check frontend
open http://localhost:3000
# Should load login page
```

### Sample Data Loaded?
```bash
# Check logs from generate_sample_data.py
# Should see:
# ✅ Total Inventory Items: 71
# ✅ Total Suppliers: 6
# ✅ Total Groups: 15+
```

---

## 💡 Pro Tips

### Speed Up Testing
```bash
# Create a test script
echo "python reset_database.py --force && python generate_sample_data.py" > test.sh
chmod +x test.sh
./test.sh
```

### Auto-Start Servers
```bash
# In separate terminals:
Terminal 1: python api.py
Terminal 2: cd frontend && npm start
Terminal 3: # Keep free for testing
```

### Quick Data Check
```bash
# Check item count
sqlite3 inventory.db "SELECT COUNT(*) FROM items;"

# Check suppliers
sqlite3 inventory.db "SELECT * FROM suppliers;"

# Check prices
sqlite3 inventory.db "SELECT COUNT(*) FROM prices;"
```

---

## 🎯 Testing Checklist

- [ ] Reset database
- [ ] Start API server
- [ ] Generate sample data
- [ ] Start frontend
- [ ] Login as admin
- [ ] View inventory (71 items)
- [ ] View suppliers (6 suppliers)
- [ ] View prices (multi-supplier comparison)
- [ ] Check best price highlighting
- [ ] View price differences
- [ ] Test search functionality
- [ ] Test CRUD operations
- [ ] Check reports
- [ ] Test different user roles

---

## 🔗 Quick Links

### Documentation
- [Feature Documentation](FEATURES_ADDED.md)
- [Price Comparison Update](PRICE_COMPARISON_UPDATE.md)
- [Reset Script Guide](RESET_DATABASE_README.md)
- [Sample Data README](README_SAMPLE_DATA.md)

### Endpoints
- **API Health**: http://127.0.0.1:8001/health
- **API Docs**: http://127.0.0.1:8001/docs
- **Frontend**: http://localhost:3000

---

## 🚨 Emergency Commands

### Complete Reset
```bash
python reset_database.py --force
```

### Kill Everything
```bash
# Windows
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# Linux/Mac
pkill python
pkill node
```

### Start Fresh
```bash
python reset_database.py --force && python api.py
```

---

## 📞 Need Help?

1. Check [RESET_DATABASE_README.md](RESET_DATABASE_README.md)
2. Check [FEATURES_ADDED.md](FEATURES_ADDED.md)
3. Check API logs
4. Check browser console
5. Try complete reset

---

**Happy Testing! 🎉**
