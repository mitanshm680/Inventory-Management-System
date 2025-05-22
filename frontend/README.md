# Inventory Management System Frontend

This is the React frontend for the Inventory Management System. It provides a modern, user-friendly interface for interacting with the inventory management API.

## Features

- **Dashboard**: Overview of inventory statistics
- **Inventory Management**: Add, edit, delete, and view inventory items
- **Price Management**: Track prices with supplier information
- **Reports**: Generate inventory reports, view activity, and monitor low stock
- **User Management**: Admin can manage users and roles
- **Role-based Access Control**: Different views for admin, editor, and viewer roles

## Getting Started

### Prerequisites

- Node.js 14+
- npm or yarn
- Backend API (FastAPI) running on port 8001

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Environment Variables

The following environment variables can be used to configure the frontend:

| Variable | Description | Default |
|----------|------------|---------|
| `REACT_APP_API_PORT` | Backend API port | 8001 |
| `REACT_APP_API_URL` | Custom backend API URL | `http://localhost:8001` |
| `PORT` | Frontend development server port | 3000 |

## Pages

- **Login**: Authentication page
- **Dashboard**: Main dashboard with statistics
- **Inventory**: View and manage inventory items
- **Price Management**: Track item prices and suppliers
- **Reports**: Generate reports and view analytics
- **User Management**: Manage users (admin only)
- **Settings**: System settings (admin only)

## Usage

1. Log in using your credentials
2. Navigate through the sidebar to different sections
3. Add, edit, and manage items based on your role permissions

## Default Login

- Username: user
- Password: 1234
- Role: admin 