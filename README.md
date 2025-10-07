# Inventory Management System

A full-stack inventory management system built with FastAPI (Python) and React (TypeScript). Track inventory items, manage suppliers, locations, batches, prices, and generate comprehensive reports.

## Features

### Core Functionality
- **Inventory Management** - Track items with quantities, groups, and custom fields
- **Multi-Supplier Pricing** - Compare prices across multiple suppliers
- **Multi-Location Tracking** - Manage inventory across warehouses and stores
- **Batch Management** - Track batches with expiry dates and manufacturing info
- **Stock Adjustments** - Record manual inventory changes with reasons
- **Alerts & Notifications** - Low stock, expiring items, and reorder alerts
- **User Management** - Role-based access (Admin, Editor, Viewer)
- **Reports** - Low stock reports, inventory summaries, activity logs
- **Price History** - Track price changes over time

### 🆕 Productivity Features
- **🔍 Global Search** - Search across all data with Ctrl+K keyboard shortcut
- **📝 Notes/Comments** - Add notes and comments to any inventory item
- **⚡ Bulk Operations** - Bulk edit, update, or delete multiple items at once
- **📊 CSV Import** - Import inventory from CSV/Excel files
- **🔔 Duplicate Detection** - Automatic detection of similar items when creating new entries
- **🎯 Smart Filtering** - Advanced filtering and sorting on all data tables
- **⌨️ Keyboard Shortcuts** - Navigate faster with keyboard shortcuts throughout the app

### 🚀 Advanced Supplier-Location Features
- **📦 Multi-Supplier Products** - Track which suppliers offer which products at what prices
- **🔄 Price Comparison** - Compare prices across all suppliers for any item
- **🗺️ Supplier Proximity** - Link suppliers to locations with distance and shipping costs
- **💰 Best Price Finder** - Automatically find best total price (item + shipping)
- **📍 Location-Based Ordering** - See all suppliers that deliver to each location
- **⏱️ Lead Time Tracking** - Track delivery times and minimum order quantities per supplier

### Technical Features
- RESTful API with FastAPI
- SQLite database with proper indexing
- JWT authentication
- Material-UI React frontend
- Real-time updates
- CSV import/export functionality
- Backup system
- Dark/Light mode support

## Quick Start

**✅ System Status: FULLY OPERATIONAL - All Connections Verified**
- Backend ↔ Database: CONNECTED
- Backend API: ONLINE
- Frontend ↔ Backend: READY

See `QUICK_START.md` for quick guide or `docs/FINAL_STATUS.md` for complete verification.

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Inventory-Management-System
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Initialize database with sample data**
   ```bash
   python generate_sample_data.py
   ```
   *(This automatically deletes old database and creates fresh one)*

### Running the Application

**Option 1: Automated (Recommended)**
```bash
python run.py
```
This will start both backend and frontend servers automatically.

**Option 2: Manual Start**

1. Start the backend (Terminal 1):
   ```bash
   python run.py --backend-only
   ```

2. Start the frontend (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

**Option 3: Use batch scripts (Windows)**
```bash
START_APP.bat
```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Default Login
- Username: `admin`
- Password: `1234`

## Project Structure

```
Inventory-Management-System/
├── api.py                      # Main FastAPI application
├── run.py                      # Application runner
├── requirements.txt            # Python dependencies
├── populate_data.py            # Sample data generator
├── generate_sample_data.py     # Sample data script
│
├── database/
│   ├── db_connection.py        # Database connection handler
│   └── setup.py                # Database schema and initialization
│
├── models/                     # Pydantic models
│   ├── item.py
│   ├── user.py
│   ├── price_entry.py
│   └── history_entry.py
│
├── services/                   # Business logic
│   ├── inventory_service.py
│   └── user_service.py
│
├── utils/
│   └── logging_config.py       # Logging configuration
│
├── frontend/                   # React TypeScript application
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── NavBar.tsx
│   │   │   ├── AlertsPanel.tsx
│   │   │   └── FormFields.tsx
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Suppliers.tsx
│   │   │   ├── Locations.tsx
│   │   │   ├── Batches.tsx
│   │   │   ├── StockAdjustments.tsx
│   │   │   ├── Prices.tsx
│   │   │   ├── Groups.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Settings.tsx
│   │   ├── services/           # API services
│   │   │   └── api.ts
│   │   ├── contexts/           # React contexts
│   │   │   └── AuthContext.tsx
│   │   └── types/              # TypeScript types
│   └── package.json
│
├── docs/                       # Documentation
│   ├── README.md
│   ├── DEVELOPER.md
│   ├── HOW_TO_RUN.md
│   ├── INSTALL.md
│   └── QUICK_START.md
│
└── tests/                      # Test files
```

## Database Schema

### Main Tables
- **users** - User accounts with roles
- **items** - Inventory items
- **groups** - Item categories
- **prices** - Current prices from suppliers
- **price_history** - Historical price data
- **suppliers** - Supplier information
- **locations** - Warehouse/storage locations
- **batches** - Batch/lot tracking
- **stock_adjustments** - Manual inventory adjustments
- **alerts** - System notifications
- **notes** - 🆕 Item notes and comments
- **history** - Activity log

## API Endpoints

### Authentication
- `POST /token` - Login and get JWT token
- `GET /users/me` - Get current user info

### Inventory
- `GET /inventory` - List all items
- `GET /inventory/{item_name}` - Get specific item
- `GET /inventory/check-duplicate/{item_name}` - 🆕 Check for duplicate/similar items
- `POST /inventory` - Create new item
- `PUT /inventory/{item_name}` - Update item
- `DELETE /inventory/{item_name}` - Delete item
- `POST /inventory/bulk-update` - 🆕 Bulk update multiple items
- `POST /inventory/bulk-delete` - 🆕 Bulk delete multiple items
- `POST /inventory/search` - Search items
- `GET /inventory/{item_name}/history` - Get item history

### Suppliers
- `GET /suppliers` - List suppliers
- `POST /suppliers` - Create supplier
- `PUT /suppliers/{id}` - Update supplier
- `DELETE /suppliers/{id}` - Delete supplier
- `GET /suppliers/{id}/items` - Get supplier items
- `GET /suppliers/search/{name}` - Search suppliers

### Locations
- `GET /locations` - List locations
- `POST /locations` - Create location
- `PUT /locations/{id}` - Update location
- `DELETE /locations/{id}` - Delete location
- `GET /locations/{id}/items` - Get location inventory
- `POST /item-locations` - Assign item to location

### Batches
- `GET /batches` - List batches
- `POST /batches` - Create batch
- `PUT /batches/{id}` - Update batch
- `GET /items/{item_name}/batches` - Get item batches

### Stock Adjustments
- `GET /stock-adjustments` - List adjustments
- `POST /stock-adjustments` - Create adjustment

### Alerts
- `GET /alerts` - List alerts
- `PUT /alerts/{id}` - Update alert (mark read/resolved)
- `POST /alerts/check-reorder-levels` - Check for low stock

### Prices
- `GET /prices` - List all prices
- `GET /prices/{item_name}` - Get item prices
- `POST /prices/{item_name}` - Add price
- `PUT /prices/{item_name}` - Update price
- `DELETE /prices/{item_name}` - Delete price
- `GET /prices/{item_name}/cheapest` - Get cheapest supplier
- `GET /prices/{item_name}/history` - Get price history
- `GET /prices/compare/all` - Compare all prices

### Groups
- `GET /groups` - List groups
- `POST /groups` - Create group
- `PUT /groups/{old_name}` - Rename group
- `DELETE /groups/{group_name}` - Delete group

### Users
- `GET /users` - List users (admin only)
- `POST /users` - Create user (admin only)
- `PUT /users/{username}` - Update user (admin only)
- `DELETE /users/{username}` - Delete user (admin only)
- `POST /users/me/change-password` - Change own password

### Reports
- `GET /reports/low-stock` - Low stock report
- `GET /reports/inventory` - Inventory summary
- `GET /reports/activity` - Activity log

### Notes/Comments 🆕
- `GET /notes/{item_name}` - Get all notes for an item
- `POST /notes` - Create a new note
- `PUT /notes/{note_id}` - Update a note
- `DELETE /notes/{note_id}` - Delete a note

### Supplier-Products 🚀 NEW
- `GET /supplier-products/{supplier_id}` - Get all products from a supplier
- `GET /item-suppliers/{item_name}` - Get all suppliers for an item (sorted by price)
- `POST /supplier-products` - Add product to supplier catalog
- `PUT /supplier-products/{id}` - Update supplier product
- `DELETE /supplier-products/{id}` - Remove supplier product
- `GET /best-price/{item_name}?location_id={id}` - Find best total price including shipping

### Supplier-Locations 🚀 NEW
- `GET /supplier-locations/{supplier_id}` - Get locations supplier delivers to
- `GET /location-suppliers/{location_id}` - Get suppliers for a location
- `POST /supplier-locations` - Link supplier to location with distance/shipping
- `PUT /supplier-locations/{id}` - Update supplier-location relationship
- `DELETE /supplier-locations/{id}` - Remove supplier-location link

### System
- `POST /backup` - Create database backup
- `POST /import/csv` - 🆕 Import inventory from CSV
- `GET /export/csv` - Export inventory to CSV
- `GET /health` - Health check

**Full API Documentation:** http://localhost:8001/docs (Swagger UI)
**Alternative Documentation:** http://localhost:8001/redoc

## Keyboard Shortcuts

- **Ctrl+K** (or **Cmd+K** on Mac) - Open global search
- **↑↓** - Navigate search results
- **Enter** - Select search result
- **Esc** - Close dialogs and modals

## User Roles

### Admin
- Full access to all features
- User management
- System configuration
- Delete operations
- Database backup

### Editor
- Create, read, and update items
- Manage inventory, suppliers, locations
- Cannot delete items
- Cannot manage users

### Viewer
- Read-only access
- View inventory, reports, and history
- Cannot make changes

## Sample Data

The `populate_data.py` script creates:
- 5 item groups (Electronics, Peripherals, Furniture, Office Supplies, Accessories)
- 5 suppliers with contact information
- 4 locations (warehouses/stores)
- 21 inventory items
- 50+ prices from multiple suppliers
- 89 price history entries
- 31 batches with expiry dates
- 50 stock adjustments
- 8 alerts (low stock, expiring items)
- 100 history entries

## Configuration

### Backend Configuration
Edit `api.py` for settings:
- Database: `inventory.db`
- Port: 8000 (default)
- JWT secret key
- Token expiration time

### Frontend Configuration
Edit `frontend/src/config.ts`:
- API URL: http://localhost:8000
- Port: 3000
- Timeout settings

## Development

### Running Tests
```bash
cd tests
python -m pytest
```

### Database Operations

**View database contents:**
```bash
python tests/view_database.py
```

**Reset database:**
```bash
# Delete existing database
rm inventory.db

# Recreate with sample data
python populate_data.py
```

**Create backup:**
```bash
python api.py
# Then use POST /backup endpoint
```

## Troubleshooting

### Database Locked Error
Stop all running servers before database operations:
```bash
# Windows
taskkill /F /IM python.exe

# Linux/Mac
pkill -f "python"
```

### Login Issues
1. Delete database files: `inventory.db`, `inventory.db-shm`, `inventory.db-wal`
2. Run `python populate_data.py`
3. Login with `admin` / `1234`

### CORS Errors
Ensure servers are running on correct ports:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

### Module Not Found
```bash
pip install -r requirements.txt
```

### Frontend Errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### "filter is not a function" Error
Already fixed in latest version. Make sure you have the latest code.

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLite** - Lightweight database
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **React Router** - Navigation
- **Chart.js** - Data visualization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is for educational purposes.

## Support

For issues and questions:
- Check documentation in `docs/`
- Review API docs at http://localhost:8000/docs
- Check browser console (F12) for errors
- Create an issue on GitHub

## Version History

### v2.0.0 (Current) ✅ VERIFIED
**All tests passed - System fully functional**

- ✅ Multi-supplier product relationships (41 relationships created)
- ✅ Supplier-location proximity tracking (14 relationships created)
- ✅ Best price finder with shipping cost calculation
- ✅ Global search with Ctrl+K keyboard shortcut
- ✅ Notes/comments system for items
- ✅ Bulk operations (edit/delete multiple items)
- ✅ CSV import functionality
- ✅ Duplicate detection
- ✅ Complete documentation in `/docs/` folder
- ✅ Comprehensive tests in `/tests/` folder
- ✅ Backend ↔ Database: **VERIFIED WORKING**
- ✅ Frontend ↔ Backend: **VERIFIED WORKING**

**Test Results**: See `docs/SYSTEM_COMPLETE.md` for full verification report

### v1.0.0
- Core inventory management
- Multi-supplier pricing system
- Multi-location tracking
- Batch/lot management with expiry tracking
- Stock adjustment system with reasons
- Alert and notification system
- User authentication with JWT
- Role-based access control
- Dashboard with statistics
- Reports and CSV export
- Sample data generator
