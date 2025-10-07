# How to Start the Complete System

## ✅ System Status: FULLY WORKING

All components have been verified:
- ✅ Database schema with all 12 tables including new `notes` table
- ✅ Backend API running on port 8001
- ✅ Frontend builds successfully with no errors
- ✅ All new features integrated (Search, Notes, Bulk Ops, CSV Import, Duplicate Detection)

## Quick Start (Automated)

```bash
python run.py
```

This will start both backend and frontend automatically.

## Manual Start (Step by Step)

### Step 1: Start the Backend

Open a terminal and run:

```bash
python api.py
```

You should see:
```
INFO - Starting Inventory Management API
INFO - Database tables and indexes created successfully
INFO - Uvicorn running on http://0.0.0.0:8001
```

### Step 2: Start the Frontend

Open a NEW terminal and run:

```bash
cd frontend
npm start
```

The browser will automatically open to http://localhost:3000

### Step 3: Login

- Username: `admin`
- Password: `1234`

## Verify Everything Works

### Test the Backend

```bash
# In a new terminal
python test_integration.py
```

Expected output:
```
✓ All 12 database tables exist
✓ Health check passed
✓ Authentication works
✓ Get inventory works
✓ Duplicate detection endpoint works
✓ Bulk update endpoint works
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8001/redoc

## New Features to Try

### 1. Global Search (Ctrl+K)
- Press `Ctrl+K` anywhere in the app
- Type to search across all data
- Use arrow keys to navigate
- Press Enter to jump to result

### 2. Duplicate Detection
- Go to Inventory page
- Click "Add Item"
- Start typing a name similar to existing items
- System will warn you if similar items exist

### 3. Bulk Operations
- Select multiple items in inventory
- Use bulk update or bulk delete
- Changes apply to all selected items at once

### 4. CSV Import
- Prepare a CSV file with columns: `name, quantity, group, reorder_level, reorder_quantity`
- Use the import feature to upload
- System creates or updates items automatically

### 5. Notes/Comments
- View any inventory item
- Add notes with timestamps
- Pin important notes to the top
- Edit or delete your own notes

## Troubleshooting

### Port Already in Use

If port 8001 is already in use:

```bash
# Windows
netstat -ano | findstr :8001
taskkill /PID <process_id> /F

# Linux/Mac
lsof -ti:8001 | xargs kill -9
```

### Database Locked

If you get database locked errors:

```bash
# Stop all running servers first
# Then restart

# Windows
taskkill /F /IM python.exe

# Linux/Mac
pkill -f python
```

### Frontend Won't Build

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Backend Won't Start

```bash
# Check Python dependencies
pip install -r requirements.txt

# Verify database
python -c "from database.setup import initialize_database; initialize_database(); print('OK')"

# Test backend syntax
python -m py_compile api.py
```

## Development Mode

### Backend with Auto-Reload

```bash
uvicorn api:app --reload --port 8001
```

### Frontend with Hot-Reload

Frontend already has hot-reload enabled with `npm start`

## Production Build

### Build Frontend for Production

```bash
cd frontend
npm run build
```

Output will be in `frontend/build/`

### Run Production Server

```bash
# Serve the production build
npm install -g serve
serve -s frontend/build -p 3000
```

## Database Management

### View Database

```bash
python tests/view_database.py
```

### Reset Database

```bash
# Delete database
rm inventory.db

# Recreate with sample data
python populate_data.py
```

### Backup Database

Use the `/backup` API endpoint or:

```bash
# Manual backup
cp inventory.db inventory_backup_$(date +%Y%m%d).db
```

## Environment Variables

Optional environment variables:

```bash
# Backend port (default: 8001)
export PORT=8001

# Frontend API URL (default: http://localhost:8001)
export REACT_APP_API_PORT=8001

# JWT secret (default: auto-generated)
export JWT_SECRET_KEY=your-secret-key
```

## Next Steps

1. **Try the new features** listed above
2. **Import your own data** using CSV import
3. **Customize** the system for your needs
4. **Add more features** from the NEW_FEATURES.md wishlist

## Support

- View API documentation: http://localhost:8001/docs
- Check logs in `logs/` directory
- Run integration tests: `python test_integration.py`
- Read full documentation in `docs/` directory

---

**Last Updated**: 2025-10-07
**System Version**: 1.1.0 with Productivity Features
