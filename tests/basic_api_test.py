#!/usr/bin/env python3
import requests
import json
import logging
import random
import time
import subprocess
import os
import sys
import signal
import atexit
from datetime import datetime

# Add parent directory to path so we can import modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

class BasicApiTest:
    def __init__(self):
        self.api_url = "http://localhost:8001"
        self.admin_token = None
        self.api_process = None
        
        # Register cleanup handler
        atexit.register(self.cleanup)
    
    def cleanup(self):
        """Clean up resources"""
        if self.api_process:
            logger.info("Stopping API server")
            try:
                self.api_process.terminate()
                self.api_process.wait(timeout=5)
            except:
                # If it doesn't terminate gracefully, force kill
                if sys.platform == 'win32':
                    import subprocess
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(self.api_process.pid)])
                else:
                    os.kill(self.api_process.pid, signal.SIGKILL)
    
    def start_server(self):
        """Start the API server"""
        logger.info("Starting API server")
        
        # Try running API directly with uvicorn
        try:
            self.api_process = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "api:app", "--port", "8001"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for server to start
            time.sleep(5)  # Give the server time to start
            
            # Check if server is running
            try:
                response = requests.get(f"{self.api_url}/docs")
                if response.status_code == 200:
                    logger.info("API server started successfully")
                    return True
            except Exception:
                pass
            
            # If we get here, server didn't start properly
            stdout, stderr = self.api_process.communicate(timeout=1)
            logger.error(f"API server failed to start. STDERR: {stderr.decode('utf-8')}")
            return False
            
        except Exception as e:
            logger.error(f"Error starting API server: {str(e)}")
            return False
    
    def authenticate(self):
        """Authenticate and get token"""
        response = requests.post(
            f"{self.api_url}/token",
            data={"username": "user", "password": "1234"}
        )
        
        if response.status_code == 200:
            self.admin_token = response.json()["access_token"]
            logger.info("Authentication successful")
            return True
        else:
            logger.error(f"Authentication failed: {response.text}")
            return False
    
    def test_auth(self):
        """Test authentication endpoint"""
        # Test valid auth
        response = requests.post(
            f"{self.api_url}/token",
            data={"username": "user", "password": "1234"}
        )
        assert response.status_code == 200, f"Auth failed: {response.text}"
        assert "access_token" in response.json(), "No token in response"
        
        # Test invalid auth
        response = requests.post(
            f"{self.api_url}/token",
            data={"username": "user", "password": "wrong"}
        )
        assert response.status_code == 401, "Invalid auth should be rejected"
        
        logger.info("✅ AUTH TESTS PASSED")
    
    def test_user_management(self):
        """Test user management"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test getting current user
        response = requests.get(f"{self.api_url}/users/me", headers=headers)
        assert response.status_code == 200, f"Failed to get current user: {response.text}"
        user_data = response.json()
        assert user_data["username"] == "user", "Wrong username"
        assert user_data["role"] == "admin", "Wrong role"
        
        # Create a test user
        test_user = {
            "username": f"test_user_{int(time.time())}",
            "password": "password123",
            "role": "viewer"
        }
        response = requests.post(
            f"{self.api_url}/users", 
            json=test_user,
            headers=headers
        )
        assert response.status_code == 200, f"Failed to create user: {response.text}"
        
        # Get all users
        response = requests.get(f"{self.api_url}/users", headers=headers)
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        users = response.json()
        assert any(u["username"] == test_user["username"] for u in users), "Created user not found"
        
        # Update user
        response = requests.put(
            f"{self.api_url}/users/{test_user['username']}", 
            json={"role": "editor"},
            headers=headers
        )
        assert response.status_code == 200, f"Failed to update user: {response.text}"
        
        # Delete user
        response = requests.delete(
            f"{self.api_url}/users/{test_user['username']}", 
            headers=headers
        )
        assert response.status_code == 200, f"Failed to delete user: {response.text}"
        
        logger.info("✅ USER MANAGEMENT TESTS PASSED")
    
    def test_inventory(self):
        """Test inventory management"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create a test group
        group_name = f"test_group_{int(time.time())}"
        response = requests.post(
            f"{self.api_url}/groups", 
            json={"group_name": group_name, "description": "Test group"},
            headers=headers
        )
        assert response.status_code == 201, f"Failed to create group: {response.text}"
        
        # Add an item
        item_name = f"test_item_{int(time.time())}"
        item_data = {
            "item_name": item_name,
            "quantity": 10,
            "group": group_name,
            "custom_fields": {
                "test_field": "test_value"
            }
        }
        response = requests.post(
            f"{self.api_url}/inventory", 
            json=item_data,
            headers=headers
        )
        assert response.status_code == 201, f"Failed to add item: {response.text}"
        
        # Get all items
        response = requests.get(
            f"{self.api_url}/inventory", 
            headers=headers
        )
        assert response.status_code == 200, f"Failed to get inventory: {response.text}"
        items = response.json()
        assert any(i["item_name"] == item_name for i in items), "Added item not found"
        
        # Update an item
        update_data = {
            "quantity": 20,
            "custom_fields": {
                "updated_field": "updated_value"
            }
        }
        response = requests.put(
            f"{self.api_url}/inventory/{item_name}", 
            json=update_data,
            headers=headers
        )
        assert response.status_code == 200, f"Failed to update item: {response.text}"
        
        # Get item history
        response = requests.get(
            f"{self.api_url}/inventory/{item_name}/history", 
            headers=headers
        )
        assert response.status_code == 200, f"Failed to get item history: {response.text}"
        history = response.json()
        assert len(history) > 0, "No history entries found"
        
        # Remove quantity
        response = requests.post(
            f"{self.api_url}/inventory/{item_name}/remove", 
            json={"quantity": 5},
            headers=headers
        )
        assert response.status_code == 200, f"Failed to remove quantity: {response.text}"
        
        # Delete the item
        response = requests.delete(
            f"{self.api_url}/inventory/{item_name}", 
            headers=headers
        )
        assert response.status_code == 200, f"Failed to delete item: {response.text}"
        
        logger.info("✅ INVENTORY TESTS PASSED")
    
    def test_reports(self):
        """Test reporting functionality"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test low stock report
        response = requests.get(
            f"{self.api_url}/reports/low-stock", 
            headers=headers
        )
        assert response.status_code == 200, f"Failed to get low stock report: {response.text}"
        
        # Test activity report
        response = requests.get(
            f"{self.api_url}/reports/activity", 
            headers=headers
        )
        assert response.status_code == 200, f"Failed to get activity report: {response.text}"
        
        logger.info("✅ REPORTING TESTS PASSED")

    def run_all_tests(self):
        """Run all tests"""
        try:
            # Start server
            if not self.start_server():
                logger.error("Failed to start server, exiting tests")
                return False
            
            # Authenticate
            if not self.authenticate():
                logger.error("Failed to authenticate, exiting tests")
                return False
            
            # Run tests
            self.test_auth()
            self.test_user_management()
            self.test_inventory()
            self.test_reports()
            
            logger.info("✅✅✅ ALL TESTS PASSED! ✅✅✅")
            return True
            
        except AssertionError as e:
            logger.error(f"❌ TEST FAILED: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ ERROR DURING TESTS: {str(e)}")
            return False

if __name__ == "__main__":
    tester = BasicApiTest()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1) 