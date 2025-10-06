"""Quick test script to verify login works."""
import sys
from services.user_service import UserService
from database.setup import initialize_database

# Initialize database
print("Initializing database...")
initialize_database()

# Create user service
print("Creating user service...")
user_service = UserService()

# Test authentication
print("\nTesting authentication...")
print("Username: admin")
print("Password: 1234")

role = user_service.authenticate("admin", "1234")
if role:
    print(f"✓ Authentication successful! Role: {role}")
else:
    print("✗ Authentication failed!")
    sys.exit(1)

print("\n✓ All tests passed!")
