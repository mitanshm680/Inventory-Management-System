import unittest
import os
import sys
import requests
import time

# Add parent directory to path so we can import modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

# Get API port from environment or use default
API_PORT = os.environ.get("API_PORT", "8001")
BASE_URL = f"http://localhost:{API_PORT}"

print("Waiting for server to start...")
time.sleep(5)

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.base_url = "http://localhost:8001"

    def test_api_connection(self):
        try:
            print(f"Testing API connection on port {API_PORT}...")
            response = requests.get(f'{BASE_URL}/docs')
            print(f'API is accessible: Status code {response.status_code}')
            if response.status_code == 200:
                print("API documentation is available")
        except Exception as e:
            print(f'Error accessing API: {e}')

if __name__ == "__main__":
    unittest.main() 