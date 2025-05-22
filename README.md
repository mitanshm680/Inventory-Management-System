# Inventory Management System

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

```
inventory-management-system/
├── models/             # Data models
│   ├── item.py         # Item model
│   ├── user.py         # User model
│   ├── history_entry.py # History entry model
│   └── price_entry.py  # Price entry model
├── services/           # Business logic
│   ├── inventory_service.py  # Inventory operations
│   ├── user_service.py       # User operations
│   ├── report_service.py     # Reporting and analytics
│   └── price_service.py      # Price management
├── database/           # Database interaction
│   ├── db_connection.py  # DB connection management
│   └── setup.py          # Database setup and initialization
├── utils/              # Utility functions
│   ├── logging_config.py  # Logging configuration
│   └── export.py          # Data export utilities
├── frontend/           # React frontend application
│   └── ...
├── api.py              # API endpoints
├── main.py             # CLI interface
└── run.py              # Application launcher
```

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
