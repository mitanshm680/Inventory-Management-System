# 🧪 Test Suite Guide

## Main Test File

### **test_new_features.py** - Complete Feature Test Suite ✅

This is the primary test file for all new features.

**Run:**
```bash
python tests/test_new_features.py
```

**Tests Covered**:
1. SHA-256 Password Hashing
2. Custom Fields
3. Advanced Search
4. Low Stock Alerts
5. CSV Export
6. Enhanced Reporting
7. Backup System

**Expected**: 7/7 tests passing

---

## Other Test Files

### **test_db.py** - Database Operations
Basic database CRUD tests.

```bash
python tests/test_db.py
```

### **test_login.py** - Authentication Tests
Tests login and authentication flow.

```bash
python tests/test_login.py
```

### **view_database.py** - Database Viewer
View all tables and data in database.

```bash
python tests/view_database.py
```

---

## Quick Test

```bash
# Run main test suite
cd C:\Users\mitan\Inventory-Management-System
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

## Legacy Test Files

The following files are older tests (kept for reference):
- `test_all_features.py` - Legacy comprehensive test
- `test_api.py` - Old API tests
- `simple_test.py` - Basic API test
- `basic_api_test.py` - Simple endpoint test

**Recommendation**: Use `test_new_features.py` as it's the most complete and current.
