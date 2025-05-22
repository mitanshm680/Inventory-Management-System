# Developer Guide

## Project Architecture

The Inventory Management System is built using a modular architecture:

1. **Models Layer**: Data models that represent business objects
   - `models/item.py` - Inventory item representation
   - `models/user.py` - User representation
   - `models/history_entry.py` - Item history representation
   - `models/price_entry.py` - Price tracking representation

2. **Services Layer**: Business logic and operations
   - `services/inventory_service.py` - Inventory management logic
   - `services/user_service.py` - User management logic
   - `services/report_service.py` - Reporting and analytics
   - `services/price_service.py` - Price management

3. **Database Layer**: Database connectivity and operations
   - `database/db_connection.py` - DB connection handling (singleton)
   - `database/setup.py` - Database initialization

4. **API Layer**: API endpoints using FastAPI
   - `api.py` - All API endpoints and authentication

5. **CLI Layer**: Command-line interface
   - `main.py` - CLI for inventory management

6. **Utilities**: Helper functions and utilities
   - `utils/logging_config.py` - Centralized logging
   - `utils/export.py` - Data export functions

## Configuration

The application uses environment variables for configuration:

- `API_PORT` - Backend API server port (default: 8001)
- `FRONTEND_PORT` - Frontend development server port (default: 3000)

You can set these variables in your environment or pass them directly when running:

```bash
# Set environment variables
export API_PORT=8002
python run.py

# Or directly in the command
API_PORT=8002 python run.py
```

Alternatively, use the command-line arguments:

```bash
python run.py --port 8002
```

## Running Tests

### API Tests

Two test scripts are available for testing the API:

1. Basic API connectivity test:
```bash
python test_api.py
```

2. Comprehensive endpoint test:
```bash
python test_api_endpoints.py
```

### Database Tests

To test database connectivity and structure:
```bash
python test_db.py
```

### Database Initialization

To initialize or reset the database:
```bash
python init_db.py
```

## Development Workflow

1. Make changes to the codebase
2. Run `python init_db.py` if you changed database schema
3. Start the API server (`python api.py`)
4. Run tests to verify functionality
5. Start the frontend for UI testing

## Common Issues

1. **Port conflicts**: If you see an error like "only one usage of each socket address is permitted", change the port using the `API_PORT` environment variable or `--port` option.

2. **Database locking**: SQLite doesn't handle concurrent writes well. If you see database locking errors, ensure only one process is writing to the database at a time.

3. **Authentication issues**: If authentication fails, check that the `users.json` file exists and has proper permissions. Default user is "user" with password "1234". 