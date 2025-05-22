#!/usr/bin/env python3
import unittest
import subprocess
import os
import sys
import json
import time
import random
import string
import sqlite3
import requests
import threading
import socket
import logging
from datetime import datetime
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Import the API for testing
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api import app
from database.db_connection import DBConnection
from database.setup import initialize_database
from services.inventory_service import InventoryService
from services.user_service import UserService
from services.price_service import PriceService
from services.report_service import ReportService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("test_comprehensive.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ComprehensiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test environment once before all tests"""
        logger.info("Setting up test environment")
        
        # Clean database by reinitializing it
        cls.clean_database()
        
        # Start backend server in a separate process
        cls.start_backend_server()
        
        # Setup test clients
        cls.client = TestClient(app)
        
        # Setup admin credentials
        cls.admin_token = cls.get_auth_token("user", "1234")
        
        # Setup test IoT simulation data
        cls.setup_iot_simulation_data()
        
        # Setup webdriver for frontend tests
        if os.environ.get("RUN_FRONTEND_TESTS", "true").lower() == "true":
            cls.setup_webdriver()
        
        logger.info("Test environment setup completed")

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests"""
        logger.info("Tearing down test environment")
        
        # Stop the backend server
        cls.stop_backend_server()
        
        # Close webdriver if it was initialized
        if hasattr(cls, 'driver') and cls.driver:
            cls.driver.quit()
        
        logger.info("Test environment teardown completed")

    @classmethod
    def clean_database(cls):
        """Clean database by reinitializing it without deletion"""
        logger.info("Cleaning database")
        
        # Initialize fresh database without attempting to delete the file
        initialize_database()
        
        # Log database initialization
        logger.info("Database reinitialized")

    @classmethod
    def start_backend_server(cls):
        """Start the backend server in a separate thread"""
        logger.info("Starting backend server")
        
        # Check if a port is available
        def is_port_available(port):
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            return result != 0
            
        # Find an available port
        cls.api_port = 8001
        while not is_port_available(cls.api_port) and cls.api_port < 8100:
            logger.info(f"Port {cls.api_port} is in use, trying next port")
            cls.api_port += 1
        
        if cls.api_port >= 8100:
            raise RuntimeError("Could not find an available port for the API server")
        
        logger.info(f"Using port {cls.api_port} for API server")
        
        # Try running API directly with uvicorn instead of using run.py
        try:
            # First attempt: try direct uvicorn approach
            logger.info("Starting API server directly with uvicorn")
            cls.api_process = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "api:app", "--port", str(cls.api_port)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait for server to start
            time.sleep(2)  # Give the server time to start
            
            # Check if process is still running
            if cls.api_process.poll() is not None:
                # Process has terminated
                stdout, stderr = cls.api_process.communicate()
                logger.error(f"API server failed to start with uvicorn. Return code: {cls.api_process.returncode}")
                logger.error(f"STDOUT: {stdout}")
                logger.error(f"STDERR: {stderr}")
                
                # Try the original run.py approach as fallback
                logger.info("Trying fallback with run.py")
                cls.api_process = subprocess.Popen(
                    [sys.executable, "run.py", "--port", str(cls.api_port)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
        
            # Check if server is running
            start_time = time.time()
            server_started = False
            while time.time() - start_time < 30:  # Wait up to 30 seconds
                try:
                    response = requests.get(f"http://localhost:{cls.api_port}/docs")
                    if response.status_code == 200:
                        server_started = True
                        break
                except requests.ConnectionError:
                    # Check if process has terminated
                    if cls.api_process.poll() is not None:
                        stdout, stderr = cls.api_process.communicate()
                        logger.error(f"API server process terminated. Return code: {cls.api_process.returncode}")
                        logger.error(f"STDOUT: {stdout}")
                        logger.error(f"STDERR: {stderr}")
                        break
                    time.sleep(1)  # Wait a bit before retrying
            
            if not server_started:
                if cls.api_process.poll() is None:
                    # Process is still running, but not responding
                    stdout, stderr = cls.api_process.communicate(timeout=1)
                    logger.error(f"API server is running but not responding. STDOUT: {stdout}")
                    logger.error(f"STDERR: {stderr}")
                raise RuntimeError("Failed to start API server - server not responding to requests")
            
            logger.info(f"Backend server started on port {cls.api_port}")
            
            # Configure the base URL for API requests
            cls.base_url = f"http://localhost:{cls.api_port}"
            
        except Exception as e:
            logger.error(f"Error starting API server: {str(e)}")
            if hasattr(cls, 'api_process') and cls.api_process and cls.api_process.poll() is None:
                cls.api_process.terminate()
            raise RuntimeError(f"Failed to start API server: {str(e)}")

    @classmethod
    def stop_backend_server(cls):
        """Stop the backend server"""
        if hasattr(cls, 'api_process') and cls.api_process:
            cls.api_process.terminate()
            cls.api_process.wait(timeout=10)
            logger.info("Backend server stopped")

    @classmethod
    def setup_webdriver(cls):
        """Setup webdriver for frontend tests"""
        try:
            # Setup Chrome options
            chrome_options = Options()
            chrome_options.add_argument("--headless")  # Run in headless mode
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            
            # Set up service
            service = Service(ChromeDriverManager().install())
            
            # Initialize the driver
            cls.driver = webdriver.Chrome(service=service, options=chrome_options)
            logger.info("WebDriver setup successfully")
        except Exception as e:
            logger.warning(f"Failed to setup WebDriver: {e}")
            cls.driver = None

    @classmethod
    def get_auth_token(cls, username, password):
        """Get authentication token for a user"""
        response = requests.post(
            f"{cls.base_url}/token",
            data={"username": username, "password": password}
        )
        
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            raise Exception(f"Failed to get auth token: {response.text}")

    @classmethod
    def setup_iot_simulation_data(cls):
        """Setup test data for IoT simulation"""
        # Generate simulated grocery store items
        cls.grocery_categories = {
            "produce": ["Apple", "Banana", "Orange", "Strawberry", "Lettuce", "Tomato", "Cucumber", "Carrot"],
            "dairy": ["Milk", "Cheese", "Yogurt", "Butter", "Cream", "Sour Cream"],
            "meat": ["Chicken", "Beef", "Pork", "Turkey", "Lamb", "Fish"],
            "bakery": ["Bread", "Bagel", "Muffin", "Cake", "Cookie", "Donut"],
            "frozen": ["Ice Cream", "Frozen Pizza", "Frozen Vegetables", "Frozen Dinner"],
            "pantry": ["Rice", "Pasta", "Cereal", "Canned Soup", "Beans", "Flour", "Sugar"]
        }
        
        # Generate suppliers
        cls.suppliers = ["FreshFarms Inc.", "Quality Goods", "Local Producers", "Global Foods", "Budget Supplies"]
        
        # Generate sensor data
        cls.sensor_types = ["temperature", "humidity", "door_status", "motion", "weight"]
        
        logger.info("IoT simulation data prepared")

    def setUp(self):
        """Set up before each test"""
        pass
        
    def tearDown(self):
        """Clean up after each test"""
        pass
    
    # ======= BACKEND API TESTS =======
    
    def test_001_authentication(self):
        """Test user authentication"""
        logger.info("Testing authentication")
        
        # Test valid authentication
        response = requests.post(
            f"{self.base_url}/token",
            data={"username": "user", "password": "1234"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        
        # Test invalid authentication
        response = requests.post(
            f"{self.base_url}/token",
            data={"username": "user", "password": "wrong"}
        )
        self.assertEqual(response.status_code, 401)
        
        logger.info("Authentication tests passed")
    
    def test_002_user_management(self):
        """Test user management operations"""
        logger.info("Testing user management")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test getting current user
        response = requests.get(f"{self.base_url}/users/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "user")
        self.assertEqual(response.json()["role"], "admin")
        
        # Test creating a new user
        new_user = {
            "username": "test_editor",
            "password": "password123",
            "role": "editor"
        }
        response = requests.post(f"{self.base_url}/users", json=new_user, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Test getting all users
        response = requests.get(f"{self.base_url}/users", headers=headers)
        self.assertEqual(response.status_code, 200)
        users = response.json()
        self.assertTrue(any(user["username"] == "test_editor" for user in users))
        
        # Test updating a user's role
        response = requests.put(
            f"{self.base_url}/users/test_editor", 
            json={"role": "viewer"}, 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        
        # Verify update
        response = requests.get(f"{self.base_url}/users", headers=headers)
        self.assertEqual(response.status_code, 200)
        users = response.json()
        editor_user = next((user for user in users if user["username"] == "test_editor"), None)
        self.assertEqual(editor_user["role"], "viewer")
        
        # Test deleting a user
        response = requests.delete(f"{self.base_url}/users/test_editor", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Verify deletion
        response = requests.get(f"{self.base_url}/users", headers=headers)
        self.assertEqual(response.status_code, 200)
        users = response.json()
        self.assertFalse(any(user["username"] == "test_editor" for user in users))
        
        logger.info("User management tests passed")
    
    def test_003_inventory_management(self):
        """Test inventory management operations"""
        logger.info("Testing inventory management")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test creating groups first for organization
        groups_to_create = list(self.grocery_categories.keys())
        for group in groups_to_create:
            response = requests.post(
                f"{self.base_url}/groups", 
                json={"group_name": group, "description": f"{group} items"},
                headers=headers
            )
            self.assertEqual(response.status_code, 201)
        
        # Test getting all groups
        response = requests.get(f"{self.base_url}/groups", headers=headers)
        self.assertEqual(response.status_code, 200)
        groups = response.json()
        self.assertEqual(len(groups), len(groups_to_create))
        
        # Test adding inventory items from each category
        for group, items in self.grocery_categories.items():
            for item in items:
                # Create custom fields for each item
                custom_fields = {
                    "expiry_days": random.randint(1, 30),
                    "location": f"Aisle {random.randint(1, 20)}",
                    "organic": random.choice([True, False])
                }
                
                # Add the item to inventory
                response = requests.post(
                    f"{self.base_url}/inventory", 
                    json={
                        "item_name": item,
                        "quantity": random.randint(10, 100),
                        "group": group,
                        "custom_fields": custom_fields
                    },
                    headers=headers
                )
                self.assertEqual(response.status_code, 201)
        
        # Test getting all inventory items
        response = requests.get(f"{self.base_url}/inventory", headers=headers)
        self.assertEqual(response.status_code, 200)
        items = response.json()
        self.assertGreater(len(items), 0)
        
        # Test updating an item
        item_to_update = "Apple"
        response = requests.put(
            f"{self.base_url}/inventory/{item_to_update}", 
            json={"quantity": 50, "custom_fields": {"organic": True, "price_category": "premium"}},
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        
        # Test getting an item's history
        response = requests.get(
            f"{self.base_url}/inventory/{item_to_update}/history", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        history = response.json()
        self.assertGreater(len(history), 0)
        
        # Test removing quantity from an item
        response = requests.post(
            f"{self.base_url}/inventory/{item_to_update}/remove", 
            json={"quantity": 5},
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        
        # Test updating custom fields only
        response = requests.put(
            f"{self.base_url}/inventory/{item_to_update}/custom-fields", 
            json={"custom_fields": {"seasonal": True}, "merge": True},
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        
        # Test deleting an item
        item_to_delete = "Cookie"
        response = requests.delete(
            f"{self.base_url}/inventory/{item_to_delete}", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        
        logger.info("Inventory management tests passed")
    
    def test_004_price_management(self):
        """Test price management operations"""
        logger.info("Testing price management")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test setting prices for items with different suppliers
        items_with_price = []
        for group, items in self.grocery_categories.items():
            for item in items[:3]:  # First 3 items per category
                # Skip if item was deleted in previous tests
                if item == "Cookie":
                    continue
                    
                supplier = random.choice(self.suppliers)
                price = round(random.uniform(1.0, 50.0), 2)
                
                # Set price for the item
                response = requests.put(
                    f"{self.base_url}/prices/{item}", 
                    json={
                        "price": price, 
                        "supplier": supplier,
                        "is_unit_price": True
                    },
                    headers=headers
                )
                
                if response.status_code == 200:
                    items_with_price.append((item, supplier))
        
        # Test getting all prices
        response = requests.get(f"{self.base_url}/prices", headers=headers)
        self.assertEqual(response.status_code, 200)
        prices = response.json()
        self.assertGreater(len(prices), 0)
        
        # Test getting price for specific item
        if items_with_price:
            item_name, supplier = items_with_price[0]
            response = requests.get(
                f"{self.base_url}/prices/{item_name}?supplier={supplier}", 
                headers=headers
            )
            self.assertEqual(response.status_code, 200)
            
            # Test getting price history for an item
            response = requests.get(
                f"{self.base_url}/prices/{item_name}/history", 
                headers=headers
            )
            self.assertEqual(response.status_code, 200)
            
            # Test getting cheapest supplier
            response = requests.get(
                f"{self.base_url}/prices/{item_name}/cheapest", 
                headers=headers
            )
            self.assertEqual(response.status_code, 200)
            
        # Test updating price (for first item)
        if items_with_price:
            item_name, supplier = items_with_price[0]
            new_price = round(random.uniform(1.0, 50.0), 2)
            
            response = requests.put(
                f"{self.base_url}/prices/{item_name}", 
                json={
                    "price": new_price, 
                    "supplier": supplier,
                    "is_unit_price": True
                },
                headers=headers
            )
            self.assertEqual(response.status_code, 200)
            
            # Test deleting a price entry
            response = requests.delete(
                f"{self.base_url}/prices/{item_name}?supplier={supplier}", 
                headers=headers
            )
            self.assertEqual(response.status_code, 200)
        
        logger.info("Price management tests passed")
    
    def test_005_group_management(self):
        """Test group management operations"""
        logger.info("Testing group management")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test renaming a group
        old_group = "produce"
        new_group = "fresh_produce"
        
        response = requests.put(
            f"{self.base_url}/groups/{old_group}?new_name={new_group}", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        
        # Verify group was renamed
        response = requests.get(f"{self.base_url}/groups", headers=headers)
        self.assertEqual(response.status_code, 200)
        groups = response.json()
        self.assertTrue(any(group["group_name"] == new_group for group in groups))
        self.assertFalse(any(group["group_name"] == old_group for group in groups))
        
        logger.info("Group management tests passed")
    
    def test_006_reporting(self):
        """Test reporting features"""
        logger.info("Testing reporting features")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test low stock report
        response = requests.get(
            f"{self.base_url}/reports/low-stock?threshold=50", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        low_stock_items = response.json()
        # Note: We're not asserting anything specific about the results since it depends on the random data
        
        # Test generating inventory report
        response = requests.post(
            f"{self.base_url}/reports/inventory?filename=test_report&format_type=csv", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        
        # Test activity report
        response = requests.get(
            f"{self.base_url}/reports/activity?days=30", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        
        logger.info("Reporting tests passed")
    
    def test_007_backup_functionality(self):
        """Test backup functionality"""
        logger.info("Testing backup functionality")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test creating a backup
        response = requests.post(
            f"{self.base_url}/backup", 
            headers=headers
        )
        self.assertEqual(response.status_code, 200)
        
        # Check if backup file was mentioned in response
        backup_file = response.json().get("backup_file")
        self.assertIsNotNone(backup_file)
        
        # Check if backup file exists
        self.assertTrue(os.path.exists(backup_file))
        
        logger.info("Backup functionality tests passed")
    
    # ======= FRONTEND TESTS =======
    
    def test_008_frontend_login(self):
        """Test frontend login if webdriver is available"""
        if not hasattr(self, 'driver') or not self.driver:
            logger.warning("Skipping frontend tests as WebDriver is not available")
            return
            
        logger.info("Testing frontend login")
        
        try:
            # Start frontend server if not running
            frontend_port = int(os.environ.get("FRONTEND_PORT", 3000))
            frontend_url = f"http://localhost:{frontend_port}"
            
            # Navigate to login page
            self.driver.get(frontend_url)
            
            # Wait for login form to load
            username_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "username"))
            )
            password_input = self.driver.find_element(By.ID, "password")
            
            # Enter credentials
            username_input.send_keys("user")
            password_input.send_keys("1234")
            
            # Submit form
            self.driver.find_element(By.XPATH, "//button[@type='submit']").click()
            
            # Wait for dashboard to load (verify successful login)
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Dashboard')]"))
            )
            
            logger.info("Frontend login test passed")
            
        except Exception as e:
            logger.error(f"Frontend login test failed: {e}")
            self.fail(f"Frontend login test failed: {e}")
    
    def test_009_frontend_navigation(self):
        """Test frontend navigation if webdriver is available"""
        if not hasattr(self, 'driver') or not self.driver:
            logger.warning("Skipping frontend tests as WebDriver is not available")
            return
            
        logger.info("Testing frontend navigation")
        
        try:
            # Navigate to inventory page
            self.driver.find_element(By.XPATH, "//a[contains(text(), 'Inventory')]").click()
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Inventory')]"))
            )
            
            # Navigate to groups page
            self.driver.find_element(By.XPATH, "//a[contains(text(), 'Groups')]").click()
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Groups')]"))
            )
            
            # Navigate to prices page
            self.driver.find_element(By.XPATH, "//a[contains(text(), 'Prices')]").click()
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Prices')]"))
            )
            
            # Navigate to reports page
            self.driver.find_element(By.XPATH, "//a[contains(text(), 'Reports')]").click()
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Reports')]"))
            )
            
            # Navigate to users page
            self.driver.find_element(By.XPATH, "//a[contains(text(), 'Users')]").click()
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Users')]"))
            )
            
            # Navigate to settings page
            self.driver.find_element(By.XPATH, "//a[contains(text(), 'Settings')]").click()
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Settings')]"))
            )
            
            logger.info("Frontend navigation test passed")
            
        except Exception as e:
            logger.error(f"Frontend navigation test failed: {e}")
            self.fail(f"Frontend navigation test failed: {e}")
    
    # ======= DATABASE INTEGRITY TESTS =======
    
    def test_010_database_integrity(self):
        """Test database integrity"""
        logger.info("Testing database integrity")
        
        try:
            # Connect to the database directly
            conn = sqlite3.connect('inventory.db')
            cursor = conn.cursor()
            
            # Check if all tables exist
            tables = ["items", "groups", "prices", "price_history", "inventory_history"]
            for table in tables:
                cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
                result = cursor.fetchone()
                self.assertIsNotNone(result, f"Table {table} does not exist")
            
            # Check foreign key constraints
            cursor.execute("PRAGMA foreign_key_check")
            fk_violations = cursor.fetchall()
            self.assertEqual(len(fk_violations), 0, f"Foreign key violations found: {fk_violations}")
            
            # Check for orphaned records
            cursor.execute("""
                SELECT ph.item_name 
                FROM price_history ph
                LEFT JOIN items i ON ph.item_name = i.item_name
                WHERE i.item_name IS NULL
            """)
            orphaned_price_history = cursor.fetchall()
            self.assertEqual(len(orphaned_price_history), 0, f"Orphaned price history records found: {orphaned_price_history}")
            
            cursor.execute("""
                SELECT ih.item_name 
                FROM inventory_history ih
                LEFT JOIN items i ON ih.item_name = i.item_name
                WHERE i.item_name IS NULL
            """)
            orphaned_inv_history = cursor.fetchall()
            self.assertEqual(len(orphaned_inv_history), 0, f"Orphaned inventory history records found: {orphaned_inv_history}")
            
            conn.close()
            logger.info("Database integrity tests passed")
            
        except Exception as e:
            logger.error(f"Database integrity test failed: {e}")
            self.fail(f"Database integrity test failed: {e}")
    
    # ======= LOAD TESTING =======
    
    def test_011_load_testing(self):
        """Perform basic load testing"""
        logger.info("Performing load testing")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test with multiple concurrent inventory requests
        num_requests = 20
        success_count = 0
        
        def make_inventory_request():
            nonlocal success_count
            try:
                response = requests.get(f"{self.base_url}/inventory", headers=headers)
                if response.status_code == 200:
                    success_count += 1
            except Exception:
                pass
        
        threads = []
        for _ in range(num_requests):
            t = threading.Thread(target=make_inventory_request)
            threads.append(t)
            t.start()
        
        # Wait for all threads to complete
        for t in threads:
            t.join()
        
        self.assertEqual(success_count, num_requests, f"Only {success_count}/{num_requests} concurrent requests succeeded")
        
        logger.info("Load testing passed")
    
    # ======= SIMULATED IOT TESTS =======
    
    def test_012_iot_simulation(self):
        """Test IoT integration through simulation"""
        logger.info("Testing IoT simulation")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Simulate IoT weight sensors updating inventory
        for _ in range(5):
            # Select random item
            group = random.choice(list(self.grocery_categories.keys()))
            item = random.choice(self.grocery_categories[group])
            
            # Skip if item was deleted in previous tests
            if item == "Cookie":
                continue
                
            # Simulate weight sensor reading and calculate quantity change
            old_weight = random.uniform(10.0, 50.0)
            new_weight = random.uniform(5.0, 45.0)
            weight_diff = old_weight - new_weight
            quantity_change = int(weight_diff)
            
            if quantity_change > 0:
                # Simulate item removal based on "weight sensor"
                response = requests.post(
                    f"{self.base_url}/inventory/{item}/remove", 
                    json={"quantity": quantity_change},
                    headers=headers
                )
                self.assertEqual(response.status_code, 200)
            elif quantity_change < 0:
                # Simulate item addition based on "weight sensor"
                # First get current quantity
                response = requests.get(f"{self.base_url}/inventory", headers=headers)
                items = response.json()
                item_data = next((i for i in items if i["item_name"] == item), None)
                
                if item_data:
                    current_qty = item_data["quantity"]
                    new_qty = current_qty - quantity_change  # quantity_change is negative
                    
                    response = requests.put(
                        f"{self.base_url}/inventory/{item}", 
                        json={"quantity": new_qty},
                        headers=headers
                    )
                    self.assertEqual(response.status_code, 200)
        
        # Simulate temperature sensor alerts
        for _ in range(3):
            # Select random item from dairy or meat (items that need temperature control)
            group = random.choice(["dairy", "meat"])
            item = random.choice(self.grocery_categories[group])
            
            # Simulate temperature reading
            temperature = random.uniform(0.0, 10.0)
            
            # Update custom fields with the temperature reading
            response = requests.put(
                f"{self.base_url}/inventory/{item}/custom-fields", 
                json={
                    "custom_fields": {
                        "last_temperature_reading": temperature,
                        "temperature_check_time": datetime.now().isoformat()
                    }, 
                    "merge": True
                },
                headers=headers
            )
            self.assertEqual(response.status_code, 200)
        
        logger.info("IoT simulation tests passed")
    
    # ======= AUTHORIZATION TESTS =======
    
    def test_013_authorization_tests(self):
        """Test different authorization roles"""
        logger.info("Testing authorization roles")
        
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create users with different roles
        roles = ["editor", "viewer"]
        tokens = {}
        
        for role in roles:
            username = f"test_{role}"
            password = f"pass_{role}"
            
            # Create user
            response = requests.post(
                f"{self.base_url}/users", 
                json={"username": username, "password": password, "role": role},
                headers=admin_headers
            )
            self.assertEqual(response.status_code, 200)
            
            # Get token
            response = requests.post(
                f"{self.base_url}/token",
                data={"username": username, "password": password}
            )
            self.assertEqual(response.status_code, 200)
            tokens[role] = response.json()["access_token"]
        
        # Test permissions for each role
        
        # Editor should be able to add inventory but not delete users
        editor_headers = {"Authorization": f"Bearer {tokens['editor']}"}
        
        # Add inventory as editor (should work)
        response = requests.post(
            f"{self.base_url}/inventory", 
            json={
                "item_name": "Test Editor Item",
                "quantity": 10
            },
            headers=editor_headers
        )
        self.assertEqual(response.status_code, 201)
        
        # Try to delete user as editor (should fail)
        response = requests.delete(
            f"{self.base_url}/users/test_viewer", 
            headers=editor_headers
        )
        self.assertEqual(response.status_code, 403)
        
        # Viewer should be able to view inventory but not add items
        viewer_headers = {"Authorization": f"Bearer {tokens['viewer']}"}
        
        # View inventory as viewer (should work)
        response = requests.get(
            f"{self.base_url}/inventory", 
            headers=viewer_headers
        )
        self.assertEqual(response.status_code, 200)
        
        # Try to add inventory as viewer (should fail)
        response = requests.post(
            f"{self.base_url}/inventory", 
            json={
                "item_name": "Test Viewer Item",
                "quantity": 10
            },
            headers=viewer_headers
        )
        self.assertEqual(response.status_code, 403)
        
        # Clean up test users
        for role in roles:
            username = f"test_{role}"
            response = requests.delete(
                f"{self.base_url}/users/{username}", 
                headers=admin_headers
            )
            self.assertEqual(response.status_code, 200)
            
        logger.info("Authorization tests passed")


if __name__ == "__main__":
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Run comprehensive tests for Inventory Management System')
    parser.add_argument('--backend-only', action='store_true', help='Only run backend tests')
    parser.add_argument('--skip-frontend', action='store_true', help='Skip frontend tests')
    parser.add_argument('--skip-load', action='store_true', help='Skip load testing')
    args = parser.parse_args()
    
    # Set environment variables based on arguments
    if args.skip_frontend:
        os.environ["RUN_FRONTEND_TESTS"] = "false"
    
    # Run tests
    test_loader = unittest.TestLoader()
    test_suite = test_loader.loadTestsFromTestCase(ComprehensiveTests)
    
    # Filter tests based on arguments
    if args.backend_only:
        # Only run backend tests (1-7, 10-13)
        backend_tests = [t for t in test_suite if any(str(i).zfill(3) in t.id() for i in range(1, 8)) or
                          any(str(i).zfill(3) in t.id() for i in range(10, 14))]
        test_suite = unittest.TestSuite(backend_tests)
    
    if args.skip_load:
        # Remove load tests
        filtered_tests = [t for t in test_suite if "test_011_load_testing" not in t.id()]
        test_suite = unittest.TestSuite(filtered_tests)
    
    # Run the tests
    unittest.TextTestRunner(verbosity=2).run(test_suite) 