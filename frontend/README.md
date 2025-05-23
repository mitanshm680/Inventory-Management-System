# Inventory Management System Frontend

This is the frontend for the Inventory Management System, built with React, TypeScript, and Material UI.

## Technologies Used

- React 18
- TypeScript 5
- Material UI 5
- React Router 6
- Formik & Yup for form validation
- Chart.js for data visualization
- Axios for API requests

## Features

- **Dashboard**: Overview of inventory statistics
- **Inventory Management**: Add, edit, delete, and view inventory items
- **Price Management**: Track prices with supplier information
- **Reports**: Generate inventory reports, view activity, and monitor low stock
- **User Management**: Admin can manage users and roles
- **Role-based Access Control**: Different views for admin, editor, and viewer roles
- Modern, responsive UI with Material Design
- Dark mode support
- Form validation
- TypeScript for better code quality and developer experience

## Getting Started

### Prerequisites

- Node.js (version 16 or later)
- npm or yarn
- Backend API (FastAPI) running on port 8001

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   
   If you encounter dependency conflicts, use:
   ```
   npm install --legacy-peer-deps
   ```

### Running the Application

To start the development server:

```bash
npm run start
```

The application will be available at http://localhost:3000.

### Building for Production

To create a production build:

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## Project Structure

- `src/components/` - Reusable UI components
- `src/contexts/` - React context providers
- `src/pages/` - Page components
- `src/types/` - TypeScript interfaces
- `src/utils/` - Utility functions

## API Configuration

The frontend is configured to connect to the backend API running at `http://localhost:8001`. You can change this in the `package.json` file by updating the `"proxy"` field.

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