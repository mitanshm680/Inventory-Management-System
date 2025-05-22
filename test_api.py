import requests
import time
import os

# Get API port from environment or use default
API_PORT = os.environ.get("API_PORT", "8001")
BASE_URL = f"http://localhost:{API_PORT}"

print("Waiting for server to start...")
time.sleep(5)

try:
    print(f"Testing API connection on port {API_PORT}...")
    response = requests.get(f'{BASE_URL}/docs')
    print(f'API is accessible: Status code {response.status_code}')
    if response.status_code == 200:
        print("API documentation is available")
except Exception as e:
    print(f'Error accessing API: {e}') 