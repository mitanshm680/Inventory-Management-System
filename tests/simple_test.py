#!/usr/bin/env python3
import unittest
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
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SimpleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Setup before all tests"""
        logger.info("Setting up test environment")
        
        # Initialize the database
        initialize_database()
        
        # Create test client
        cls.client = TestClient(app)
        
        logger.info("Test environment setup complete")
    
    def test_auth(self):
        """Test authentication endpoint"""
        response = self.client.post(
            "/token",
            data={"username": "user", "password": "1234"}
        )
        self.assertEqual(response.status_code, 200)
        token_data = response.json()
        self.assertIn("access_token", token_data)
        self.assertEqual(token_data["token_type"], "bearer")
        
        # Save the token for other tests
        self.token = token_data["access_token"]
        
        # Test invalid credentials
        response = self.client.post(
            "/token",
            data={"username": "user", "password": "wrong"}
        )
        self.assertEqual(response.status_code, 401)
    
    def test_current_user(self):
        """Test getting current user"""
        # First get a valid token
        response = self.client.post(
            "/token",
            data={"username": "user", "password": "1234"}
        )
        token = response.json()["access_token"]
        
        # Use the token to get current user
        response = self.client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        self.assertEqual(user_data["username"], "user")
        self.assertEqual(user_data["role"], "admin")
    
    def test_inventory_get(self):
        """Test getting inventory items"""
        # First get a valid token
        response = self.client.post(
            "/token",
            data={"username": "user", "password": "1234"}
        )
        token = response.json()["access_token"]
        
        # Use the token to get inventory items
        response = self.client.get(
            "/inventory",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 200)
        items = response.json()
        # Initially there should be no items
        self.assertIsInstance(items, list)

if __name__ == "__main__":
    unittest.main() 