# Inventory Management System

A full-stack inventory management system with user authentication, role-based access control, and real-time data management.

## Features

- 📦 **Inventory Management** - Add, edit, delete, and track inventory items
- 👥 **User Management** - Role-based access (Admin, Editor, Viewer)
- 🏷️ **Groups/Categories** - Organize items by groups
- 💰 **Price Tracking** - Track prices from multiple suppliers
- 📊 **Dashboard** - View statistics and low stock alerts
- 📈 **Reports** - Generate inventory reports
- 🔐 **Authentication** - Secure JWT-based authentication

## Tech Stack

### Backend
- **Python 3.x** with FastAPI
- **SQLite** database
- **JWT** authentication
- **Uvicorn** ASGI server

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** components
- **Axios** for API calls
- **React Router** for navigation

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Installation & Running

**Option 1: Automated (Recommended)**
```bash
python run.py
```

**Option 2: Manual**

1. **Backend:**
```bash
# Install dependencies
pip install -r requirements.txt

# Run backend server
python api.py
```

2. **Frontend:**
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Default Login
- **Username:** `admin`
- **Password:** `1234`

## Database Viewer

To view the database contents:
```bash
python view_database.py
```

Install tabulate for better formatting:
```bash
pip install tabulate
```

## Troubleshooting

### Login Issues
1. Delete old database: Delete `inventory.db`, `inventory.db-shm`, `inventory.db-wal`
2. Restart: `python run.py`
3. Use default credentials: `admin` / `1234`

### Frontend Errors
- Refresh the page (Ctrl+F5)
- Clear browser cache
- Check browser console (F12) for errors

## License

This project is for educational purposes.

# Inventory Management System (old content below)

A full-stack inventory management system with a React frontend and FastAPI backend.

## Features

- User authentication and role-based access control (Admin, Editor, Viewer)
- Inventory management with custom fields
- Group-based organization of inventory items
- History tracking for inventory items
- User management
- Price tracking with supplier management
- Reporting and analytics
- Low stock notifications
- Dashboard with stats and visualizations
- Database backup and restore functionality

## Tech Stack

### Backend
- FastAPI
- SQLite
- JWT Authentication
- Modular architecture with services pattern

### Frontend
- React
- Material UI
- Chart.js for data visualization
- React Router for navigation

## Project Structure

The Inventory Management System is a full-stack application consisting of:

- **Backend API**: Built with FastAPI (Python), handling data operations and business logic
- **Frontend**: Built with React and TypeScript, providing a modern and responsive user interface
- **Database**: SQLite for development, can be configured for other databases in production

### Key Directories

- `/frontend`: React TypeScript frontend application
- `/models`: SQLAlchemy database models
- `/services`: Business logic services
- `/utils`: Utility functions
- `/database`: Database connection and repository implementations

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Environment Variables

The application supports the following environment variables:

- `API_PORT`: Port for the backend API server (default: 8001)
- `FRONTEND_PORT`: Port for the frontend development server (default: 3000)

You can set these variables before running, or use the `--port` option with `run.py`.

### Easy Setup using run.py

You can use the provided run.py script to set up everything automatically:

```
python run.py
```

This will:
1. Create a Python virtual environment
2. Install all required Python packages
3. Start the backend server
4. Install frontend dependencies (first run only)
5. Start the React development server
6. Open your browser to the application

Additional options:
- `python run.py --backend-only` - Run only the backend
- `python run.py --frontend-only` - Run only the frontend
- `python run.py --cli` - Run the command-line interface
- `python run.py --port 8080` - Specify a custom port for the API

### Manual Setup

#### Backend Setup

1. Create and activate a virtual environment:

```
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:

```
pip install -r requirements.txt
```

3. Start the backend server:

```
uvicorn api:app --reload --port 8001
```

The backend API will be available at http://localhost:8001. You can access the Swagger UI documentation at http://localhost:8001/docs.

#### Frontend Setup

1. Navigate to the frontend directory:

```
cd frontend
```

2. Install dependencies:

```
npm install
```

3. Start the development server:

```
npm start
```

The frontend application will be available at http://localhost:3000.

## Default Login

- Username: user
- Password: 1234
- Role: admin

## API Endpoints

### Authentication
- POST /token - Get authentication token

### Users
- GET /users/me - Get current user
- GET /users - Get all users (admin only)
- POST /users - Create a user (admin only)
- PUT /users/{username} - Update a user (admin only)
- DELETE /users/{username} - Delete a user (admin only)

### Inventory
- GET /inventory - Get all inventory items
- POST /inventory - Add inventory item (admin/editor)
- PUT /inventory/{item_name} - Update inventory item (admin/editor)
- DELETE /inventory/{item_name} - Delete inventory item (admin)
- GET /inventory/{item_name}/history - Get item history
- PUT /inventory/{item_name}/group - Update item's group (admin/editor)
- PUT /inventory/{item_name}/custom-fields - Update item's custom fields (admin/editor)

### Groups
- GET /groups - Get all groups
- PUT /groups/{old_name} - Rename a group (admin)

### Price Management
- GET /prices - Get all prices
- GET /prices/{item_name} - Get price for an item
- PUT /prices/{item_name} - Set/update price
- GET /prices/{item_name}/history - View price history
- GET /prices/{item_name}/cheapest - Get cheapest supplier
- DELETE /prices/{item_name} - Delete price entries

### Reports
- GET /reports/low-stock - Get low stock report
- POST /reports/inventory - Generate inventory report
- GET /reports/activity - Get activity report

### System
- POST /backup - Create a backup (admin)

## License

This project is licensed under the MIT License.

## TypeScript Frontend

The frontend has been fully converted to TypeScript for better code quality and developer experience. Features include:

- Type-safe API interactions
- Improved component props validation
- Better code organization with clear interfaces
- Dark mode support
- Modern UI with Material Design
- Role-based access control

For more details about the frontend, see [frontend/README.md](frontend/README.md).
