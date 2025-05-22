#!/usr/bin/env python3
import pytest
import json
import logging
import os
import sys
from fastapi.testclient import TestClient

# Add parent directory to path so we can import modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

# Import the API
from api import app
from database.setup import initialize_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# Setup fixtures
@pytest.fixture(scope="module")
def client():
    # Initialize the database
    initialize_database()
    
    # Create and return a TestClient
    return TestClient(app)

@pytest.fixture(scope="module")
def auth_token(client):
    # Get authentication token
    response = client.post(
        "/token",
        data={"username": "user", "password": "1234"}
    )
    return response.json()["access_token"]

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}

# Tests
def test_auth_valid(client):
    """Test valid authentication"""
    response = client.post(
        "/token",
        data={"username": "user", "password": "1234"}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

def test_auth_invalid(client):
    """Test invalid authentication"""
    response = client.post(
        "/token",
        data={"username": "user", "password": "wrong"}
    )
    assert response.status_code == 401

def test_get_current_user(client, auth_headers):
    """Test getting current user"""
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["username"] == "user"
    assert user_data["role"] == "admin"

def test_get_inventory(client, auth_headers):
    """Test getting inventory items"""
    response = client.get("/inventory", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)

def test_add_inventory_item(client, auth_headers):
    """Test adding an inventory item"""
    item_data = {
        "item_name": "Test Item",
        "quantity": 10,
        "group": "test_group",
        "custom_fields": {
            "test_field": "test_value"
        }
    }
    response = client.post("/inventory", json=item_data, headers=auth_headers)
    assert response.status_code == 201
    
    # Verify item was added
    response = client.get("/inventory", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()
    assert any(item["item_name"] == "Test Item" for item in items)

def test_update_inventory_item(client, auth_headers):
    """Test updating an inventory item"""
    update_data = {
        "quantity": 20,
        "custom_fields": {
            "updated_field": "updated_value"
        }
    }
    response = client.put("/inventory/Test Item", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    
    # Verify item was updated
    response = client.get("/inventory", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()
    test_item = next((item for item in items if item["item_name"] == "Test Item"), None)
    assert test_item is not None
    assert test_item["quantity"] == 20

def test_delete_inventory_item(client, auth_headers):
    """Test deleting an inventory item"""
    response = client.delete("/inventory/Test Item", headers=auth_headers)
    assert response.status_code == 200
    
    # Verify item was deleted
    response = client.get("/inventory", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()
    assert not any(item["item_name"] == "Test Item" for item in items)

if __name__ == "__main__":
    # Run pytest programmatically
    import pytest
    sys.exit(pytest.main(["-v", __file__])) 