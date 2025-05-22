# Comprehensive Test Suite for Inventory Management System

This test suite provides comprehensive testing for all components of the Inventory Management System, including:

- Backend API endpoints
- User authentication and authorization
- Database integrity
- Frontend functionality
- IoT simulation for inventory updates
- Load testing
- Group management
- Price management
- Reporting functionality

## Prerequisites

Before running the tests, ensure you have all required dependencies:

```bash
pip install -r requirements.txt
```

For frontend tests, you'll need Chrome browser and ChromeDriver (automatically handled by webdriver-manager).

## Running the Tests

### Basic Usage

To run all tests:

```bash
python test_comprehensive.py
```

### Command Line Options

The test script supports several command line options:

- `--backend-only`: Only run backend tests, skip frontend tests
- `--skip-frontend`: Skip frontend tests (useful in environments without GUI)
- `--skip-load`: Skip load testing (useful for slower systems)

Example:

```bash
python test_comprehensive.py --backend-only
```

### Environment Variables

You can customize test behavior using environment variables:

- `RUN_FRONTEND_TESTS`: Set to "false" to skip frontend tests
- `FRONTEND_PORT`: Specify the port for frontend server (default: 3000)
- `API_PORT`: Specify the port for API server (if not using automatic port detection)

Example:

```bash
RUN_FRONTEND_TESTS=false python test_comprehensive.py
```

## Test Categories

The test suite is organized into the following categories:

1. **Authentication Tests**: Verify user login and token generation
2. **User Management Tests**: Test user creation, updates, and permissions
3. **Inventory Management Tests**: Test item creation, updates, and deletions
4. **Price Management Tests**: Test price tracking and supplier management
5. **Group Management Tests**: Test inventory grouping functionality
6. **Reporting Tests**: Test report generation and low stock alerts
7. **Backup Tests**: Test system backup functionality
8. **Frontend Tests**: Test UI functionality using Selenium
9. **Database Integrity Tests**: Verify database structure and constraints
10. **Load Testing**: Test system performance under load
11. **IoT Simulation Tests**: Test integration with simulated IoT devices
12. **Authorization Tests**: Test role-based access control

## Test Database

The test suite automatically reinitializes the database before running tests, so it's safe to run against your development environment. However, it's recommended to run tests in a separate environment if you have valuable data in your development database.

## Test Logs

All test activities are logged to both console and a file named `test_comprehensive.log`.

## Adding New Tests

To add new tests, follow the pattern used in the existing test methods. The test order is important as some tests depend on the state created by earlier tests.

## Troubleshooting

Common issues:

1. **Port conflicts**: If you see port-in-use errors, either close applications using the ports or specify different ports.

2. **Frontend tests failing**: Ensure your frontend server is running, or use the `--skip-frontend` option.

3. **WebDriver issues**: Ensure you have Chrome installed. The test will automatically download the appropriate ChromeDriver version.

4. **Database errors**: If you see database-related errors, ensure SQLite is working correctly and the application has write permissions to the directory. 