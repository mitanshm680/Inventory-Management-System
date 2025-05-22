# Testing Suite for Inventory Management System

This directory contains all test files for the Inventory Management System.

## Test Files

- `test_api.py`: Basic API connectivity test
- `test_api_endpoints.py`: Tests all API endpoints
- `test_db.py`: Tests database connectivity and structure
- `test_comprehensive.py`: Comprehensive test suite that tests all aspects of the system
- `basic_api_test.py`: Simple API test using direct requests
- `pytest_api.py`: Test suite using pytest
- `simple_test.py`: Simple test suite using unittest

## Running Tests

### Simple API Test
```bash
python tests/basic_api_test.py
```

### Comprehensive Tests
```bash
python tests/test_comprehensive.py --backend-only
```

### Pytest-based API Test
```bash
pytest tests/pytest_api.py -v
```

### Basic API Connectivity Test
```bash
python tests/test_api.py
```

### Database Tests
```bash
python tests/test_db.py
```

## Test Categories

See `TEST_README.md` for more details on the comprehensive test suite. 