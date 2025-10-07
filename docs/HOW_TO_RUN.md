# 🚀 HOW TO RUN THE INVENTORY MANAGEMENT SYSTEM

Complete step-by-step guide to run both frontend and backend.

---

## 📋 Prerequisites

### Required Software:
- **Python 3.8+** - Backend API
- **Node.js 14+** - Frontend development
- **npm** - Package manager

### Check Installations:
```bash
python --version   # Should show 3.8 or higher
node --version     # Should show 14 or higher
npm --version      # Should show 6 or higher
```

---

## ⚡ Quick Start (Fastest Way)

### Option 1: Use the Startup Script (Windows)
```batch
# Double-click or run:
START_APP.bat
```

This automatically:
1. Starts the backend on port 8001
2. Starts the frontend on port 3000
3. Opens your browser

---

### Option 2: Run Manually

#### Step 1: Start Backend
```bash
# From project root
python api.py
```

**Backend will start on**: `http://127.0.0.1:8001`

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

#### Step 2: Start Frontend (New Terminal)
```bash
# Open a new terminal
cd frontend
npm start
```

**Frontend will start on**: `http://localhost:3000`

Browser should open automatically, or visit: `http://localhost:3000`

---

## 🔐 Default Login Credentials

```
Username: admin
Password: 1234
```

**Note**: Password is SHA-256 hashed in database for security.

---

## 📦 First Time Setup

### 1. Backend Setup
```bash
# Install Python dependencies (if not already installed)
pip install fastapi uvicorn python-jose passlib python-multipart

# Or use requirements.txt if available
pip install -r requirements.txt
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies (first time only)
npm install

# This will install:
# - React & React DOM
# - Material-UI components
# - Axios for API calls
# - React Router
# - TypeScript dependencies
```

### 3. Database Initialization
```bash
# Database is created automatically on first run
# No manual setup needed!

# If you want to reset database:
rm inventory.db inventory.db-shm inventory.db-wal
python api.py  # Recreates database with admin user
```

---

## 🖥️ Detailed Instructions

### Backend (FastAPI Server)

#### Start Backend:
```bash
python api.py
```

#### What Happens:
1. ✅ Database initialized (if not exists)
2. ✅ Admin user created (username: admin, password: 1234)
3. ✅ Server starts on port 8001
4. ✅ API documentation available at `/docs`

#### Verify Backend is Running:
```bash
# Method 1: Check health endpoint
curl http://127.0.0.1:8001/health

# Expected response:
# {"status":"healthy","message":"Inventory Management API is running"}

# Method 2: Visit API docs in browser
# Open: http://127.0.0.1:8001/docs
```

#### Backend Features Available:
- 🔐 JWT Authentication
- 👥 User Management
- 📦 Inventory Management
- 🏷️ Group Management
- 💰 Price Tracking
- 📊 Reports & Analytics
- 💾 Backup & Export
- 🔍 Advanced Search

---

### Frontend (React Application)

#### Start Frontend:
```bash
cd frontend
npm start
```

#### What Happens:
1. ✅ React development server starts
2. ✅ Opens browser automatically
3. ✅ Hot reload enabled (changes auto-refresh)
4. ✅ Connects to backend at `http://127.0.0.1:8001`

#### Verify Frontend is Running:
- Browser should open to `http://localhost:3000`
- You should see the Login page
- No console errors in browser dev tools

#### Frontend Features Available:
- 🔐 Login/Logout
- 📊 Dashboard with statistics
- 📦 Inventory management
- 🏷️ Group management
- 💰 Price management
- 👥 User management (admin only)
- ⚙️ Settings
  - 🔑 Change Password
  - 💾 Backup Database (admin)
  - 📥 Export to CSV (admin)
- 📈 Reports

---

## 🧪 Testing the Application

### Run Backend Tests:
```bash
# From project root
python tests/test_new_features.py
```

**Expected Output**:
```
============================================================
  TESTING ALL NEW FEATURES
============================================================

[PASS] - SHA-256 Password Hashing
[PASS] - Custom Fields
[PASS] - Advanced Search
[PASS] - Low Stock Alerts
[PASS] - CSV Export
[PASS] - Enhanced Reporting
[PASS] - Backup System

Total: 7/7 tests passed (100%)
*** ALL TESTS PASSED! ***
```

---

## 🎯 Using the Application

### 1. Login
```
1. Open http://localhost:3000
2. Enter username: admin
3. Enter password: 1234
4. Click "Login"
```

### 2. Dashboard
- View inventory statistics
- See low stock alerts
- Check recent activity
- View group breakdown

### 3. Inventory Management
```
Add Item:
1. Go to "Inventory" page
2. Click "Add Item" button
3. Fill in:
   - Item name
   - Quantity
   - Group (optional)
   - Custom fields (optional)
4. Click "Save"
```

### 4. Change Password
```
1. Go to "Settings" page
2. Click "Change Password" button
3. Enter:
   - Current password
   - New password
   - Confirm new password
4. Click "Change Password"
```

### 5. Export to CSV (Admin Only)
```
1. Go to "Settings" page
2. In "Database Management" card
3. Click "Export CSV" button
4. CSV file downloads automatically
```

### 6. Create Backup (Admin Only)
```
1. Go to "Settings" page
2. Click "Create Backup" button
3. Confirm in dialog
4. Backup created in project root
```

---

## 📡 API Endpoints Reference

### Test API Endpoints:

#### Health Check:
```bash
curl http://127.0.0.1:8001/health
```

#### Login:
```bash
curl -X POST http://127.0.0.1:8001/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=1234"
```

#### Get Inventory:
```bash
# First get token from login, then:
curl http://127.0.0.1:8001/inventory \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Advanced Search:
```bash
curl -X POST http://127.0.0.1:8001/inventory/search \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"search_term":"laptop","search_type":"starts_with"}'
```

#### Low Stock Report:
```bash
curl "http://127.0.0.1:8001/reports/low-stock?threshold=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Configuration

### Backend Configuration:
Edit `api.py` to change:
- `SECRET_KEY` - JWT secret (change for production!)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration (default: 1440 = 24 hours)
- Port (default: 8001)

### Frontend Configuration:
Edit `frontend/src/config.ts` to change:
- `BASE_URL` - Backend API URL
- `TIMEOUT` - API request timeout
- Other API settings

---

## 🛑 Stopping the Application

### Stop Backend:
```bash
# In backend terminal:
Press CTRL+C
```

### Stop Frontend:
```bash
# In frontend terminal:
Press CTRL+C
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Issue**: Port 8001 already in use
```bash
# Find and kill process using port 8001
# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8001 | xargs kill -9
```

**Issue**: Module not found
```bash
pip install fastapi uvicorn python-jose passlib
```

**Issue**: Database locked
```bash
# Close all connections and restart
rm inventory.db-shm inventory.db-wal
python api.py
```

---

### Frontend Won't Start

**Issue**: Port 3000 already in use
```bash
# Kill process or use different port
# Frontend will ask: "Would you like to run on another port? (Y/n)"
# Press Y
```

**Issue**: Dependencies not installed
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Issue**: React not found
```bash
npm install react react-dom
```

---

### Connection Issues

**Issue**: Frontend can't connect to backend
```bash
# Check backend is running:
curl http://127.0.0.1:8001/health

# Check frontend config:
# Open frontend/src/config.ts
# Verify BASE_URL is: 'http://127.0.0.1:8001'
```

**Issue**: CORS errors
```bash
# Clear browser cache: CTRL+SHIFT+DELETE
# Restart both backend and frontend
# Try different browser
```

---

### Login Issues

**Issue**: Can't login with admin/1234
```bash
# Reset database:
rm inventory.db*
python api.py
# Try login again
```

**Issue**: Password changed and forgotten
```bash
# Reset database (deletes all data):
rm inventory.db*
python api.py
# Admin password reset to: 1234
```

---

## 📊 Monitoring

### Backend Logs:
```bash
# Logs are written to: logs/inventory.log
tail -f logs/inventory.log
```

### Frontend Console:
```bash
# Open browser dev tools: F12
# Check Console tab for errors
```

---

## 🔄 Development Mode

### Backend Hot Reload:
```bash
# Backend auto-reloads on code changes
# Just save your .py files
```

### Frontend Hot Reload:
```bash
# Frontend auto-reloads on code changes
# Just save your .tsx or .ts files
# Browser refreshes automatically
```

---

## 📦 Production Deployment

### Backend:
```bash
# Use production server (Gunicorn)
pip install gunicorn
gunicorn api:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

### Frontend:
```bash
cd frontend
npm run build
# Serve the build/ folder with nginx or Apache
```

---

## ✅ Checklist

### Before Starting:
- [ ] Python 3.8+ installed
- [ ] Node.js 14+ installed
- [ ] Dependencies installed (pip/npm)

### Backend Running:
- [ ] `python api.py` executed
- [ ] Health check returns OK
- [ ] No errors in terminal
- [ ] API docs accessible at /docs

### Frontend Running:
- [ ] `npm start` executed
- [ ] Browser opened automatically
- [ ] Login page visible
- [ ] No console errors

### Ready to Use:
- [ ] Can login with admin/1234
- [ ] Dashboard loads with data
- [ ] Can add inventory items
- [ ] All pages accessible

---

## 🎉 Success!

If you can:
1. ✅ Start backend: `python api.py`
2. ✅ Start frontend: `cd frontend && npm start`
3. ✅ Login with admin/1234
4. ✅ See the dashboard

**You're all set!** 🚀

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| Start Backend | `python api.py` |
| Start Frontend | `cd frontend && npm start` |
| Run Tests | `python tests/test_new_features.py` |
| Reset Database | `rm inventory.db* && python api.py` |
| API Documentation | http://127.0.0.1:8001/docs |
| Frontend URL | http://localhost:3000 |
| Default Login | admin / 1234 |

---

**Need Help?** Check the `/docs` folder for detailed documentation!
