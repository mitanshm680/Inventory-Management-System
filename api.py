from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import hashlib
import logging
import sqlite3
import sys

# Debug output
print("Starting API server with args:", sys.argv)
print("Current working directory:", os.getcwd())

# Set default port for uvicorn when run directly
import uvicorn

# Import our services
from services.inventory_service import InventoryService
from services.user_service import UserService
from services.report_service import ReportService
from services.price_service import PriceService
from models.price_entry import PriceEntry
from utils.logging_config import setup_logging
from database.setup import initialize_database
from database.db_connection import DBConnection

# Setup logging
setup_logging()

# Initialize database
initialize_database()

# Access the database connection
db_connection = DBConnection()

# Security settings
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# FastAPI app
app = FastAPI(title="Inventory Management System API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize our services
inventory_service = InventoryService()
user_service = UserService()
report_service = ReportService()
price_service = PriceService()

# Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class User(BaseModel):
    username: str
    role: str
    
    @property
    def can_edit(self):
        return self.role in ["admin", "editor"]

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "viewer"

class UserUpdate(BaseModel):
    role: Optional[str] = None

class Item(BaseModel):
    item_name: str
    quantity: int
    group: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ItemUpdate(BaseModel):
    quantity: Optional[int] = None
    group: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ItemRemove(BaseModel):
    quantity: int

class ItemCustomFieldsUpdate(BaseModel):
    custom_fields: Dict[str, Any]
    merge: bool = False

class PriceUpdate(BaseModel):
    price: float
    supplier: Optional[str] = None
    is_unit_price: bool = True

class GroupCreate(BaseModel):
    group_name: str
    description: Optional[str] = None

# JWT token functionality
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    # Legacy system used SHA256, adapt for compatibility
    if len(hashed_password) == 64:  # SHA256 hash length
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
    # New passwords will use bcrypt
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def authenticate_user(username: str, password: str):
    role = user_service.authenticate(username, password)
    if role:
        return User(username=username, role=role)
    return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Add custom exception handlers
@app.exception_handler(sqlite3.Error)
async def sqlite_exception_handler(request: Request, exc: sqlite3.Error):
    """Handle SQLite database errors."""
    error_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logging.error(f"Database error {error_id}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Database error occurred",
            "error_id": error_id,
            "detail": "A database error occurred. Please try again later."
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    error_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logging.error(f"Unhandled error {error_id}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "error_id": error_id,
            "detail": "An unexpected error occurred. Please try again later."
        }
    )

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and their processing time."""
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds() * 1000
    logging.info(
        f"Path: {request.url.path} "
        f"Method: {request.method} "
        f"Status: {response.status_code} "
        f"Processing Time: {process_time:.2f}ms"
    )
    return response

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from JWT token with improved error handling."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=role)
    except JWTError as e:
        logging.error(f"JWT validation error: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logging.error(f"Unexpected error in token validation: {str(e)}")
        raise credentials_exception
    
    try:
        user = user_service.get_user(token_data.username)
        if user is None:
            raise credentials_exception
        return User(username=token_data.username, role=user['role'])
    except Exception as e:
        logging.error(f"Error fetching user data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error accessing user data"
        )

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires admin privileges"
        )
    return current_user

async def get_editor_user(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires editor privileges"
        )
    return current_user

# Authentication endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/users", response_model=List[User])
async def read_users(current_user: User = Depends(get_admin_user)):
    return [User(username=u['username'], role=u['role']) for u in user_service.get_users()]

@app.post("/users", response_model=User)
async def create_user(user: UserCreate, current_user: User = Depends(get_admin_user)):
    if user_service.get_user(user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    # Use bcrypt for new passwords
    success = user_service.add_user(user.username, user.password, user.role)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user"
        )
    return User(username=user.username, role=user.role)

@app.put("/users/{username}", response_model=User)
async def update_user(username: str, user_update: UserUpdate, current_user: User = Depends(get_admin_user)):
    user = user_service.get_user(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if user_update.role:
        success = user_service.change_role(username, user_update.role)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update user role"
            )
    return User(username=username, role=user_service.get_user(username)['role'])

@app.delete("/users/{username}")
async def delete_user(username: str, current_user: User = Depends(get_admin_user)):
    if not user_service.get_user(username):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if username == current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    success = user_service.delete_user(username)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete user"
        )
    return {"message": "User deleted successfully"}

# Inventory endpoints
@app.get("/inventory")
async def get_inventory(groups: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get the inventory, optionally filtered by groups."""
    group_list = None
    if groups:
        group_list = [g.strip() for g in groups.split(',')]
        
    items = inventory_service.get_inventory(group_list)
    
    return [item.to_dict() for item in items]

@app.post("/inventory", status_code=status.HTTP_201_CREATED)
async def add_item(item: Item, current_user: User = Depends(get_editor_user)):
    """Add an item to inventory."""
    inventory_service.add_item(item.item_name, item.quantity, item.group, item.custom_fields)
    return {"message": f"Added {item.quantity} of {item.item_name}"}

@app.put("/inventory/{item_name}")
async def update_item(item_name: str, item_update: ItemUpdate, current_user: User = Depends(get_editor_user)):
    """Update an existing item."""
    item = inventory_service.get_item(item_name)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    if item_update.quantity is not None:
        # Calculate quantity difference
        diff = item_update.quantity - item.quantity
        if diff > 0:
            # Adding items
            inventory_service.add_item(item_name, diff, item.group_name, item.custom_fields)
        elif diff < 0:
            # Removing items
            success = inventory_service.remove_item(item_name, abs(diff))
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Not enough quantity in inventory"
                )
    
    # Update group or custom fields if provided
    # This is a simplification; in a real system you might want to 
    # handle these updates directly in the service
    updated_item = inventory_service.get_item(item_name)
    if updated_item:
        return updated_item.to_dict()
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item was removed due to zero quantity"
        )

@app.delete("/inventory/{item_name}")
async def delete_item(item_name: str, current_user: User = Depends(get_admin_user)):
    """Delete an item completely."""
    success = inventory_service.delete_item(item_name)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return {"message": f"Item {item_name} deleted"}

@app.post("/inventory/{item_name}/remove")
async def remove_item_quantity(item_name: str, item_remove: ItemRemove, current_user: User = Depends(get_editor_user)):
    """Remove a quantity of an item."""
    success = inventory_service.remove_item(item_name, item_remove.quantity)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to remove item quantity"
        )
    return {"message": f"Removed {item_remove.quantity} of {item_name}"}

@app.get("/inventory/{item_name}/history")
async def get_item_history(item_name: str, current_user: User = Depends(get_current_user)):
    """Get the history of an item."""
    # Check if item exists
    if not inventory_service.get_item(item_name):
        # It's possible the item has been removed but still has history
        history = inventory_service.get_item_history(item_name)
        if not history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item not found"
            )
    
    history = inventory_service.get_item_history(item_name)
    return [entry.to_dict() for entry in history]

@app.get("/groups")
async def get_groups(current_user: User = Depends(get_current_user)):
    """Get all groups."""
    try:
        with DBConnection().get_cursor() as cursor:
            cursor.execute("SELECT group_name, description, created_at FROM groups ORDER BY group_name")
            groups = []
            for row in cursor.fetchall():
                groups.append({
                    "group_name": row["group_name"],
                    "description": row["description"],
                    "created_at": row["created_at"]
                })
            return {"groups": groups}
            
    except sqlite3.Error as e:
        logging.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching groups")

@app.post("/groups", status_code=201)
async def create_group(group: GroupCreate, current_user: User = Depends(get_editor_user)):
    """Create a new group."""
    try:
        with DBConnection().get_cursor() as cursor:
            # Check if group already exists
            cursor.execute("SELECT 1 FROM groups WHERE group_name = ?", (group.group_name,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Group already exists")
            
            # Create new group
            cursor.execute(
                "INSERT INTO groups (group_name, description) VALUES (?, ?)",
                (group.group_name, group.description)
            )
            
            logging.info(f"Group created: {group.group_name}")
            return {"message": "Group created successfully"}
            
    except sqlite3.Error as e:
        logging.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating group")

@app.put("/groups/{old_name}")
async def rename_group(old_name: str, new_name: str, current_user: User = Depends(get_admin_user)):
    """Rename a group with improved error handling."""
    if not old_name or not new_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both old and new group names must be provided"
        )
    
    try:
        with DBConnection().get_cursor() as cursor:
            # Check if the old group exists
            cursor.execute("SELECT 1 FROM groups WHERE group_name = ?", (old_name,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Group '{old_name}' not found"
                )
            
            # Check if the new name already exists
            if old_name != new_name:  # Only check if actually renaming
                cursor.execute("SELECT 1 FROM groups WHERE group_name = ?", (new_name,))
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"A group named '{new_name}' already exists"
                    )
            
            # Update the group name
            cursor.execute("UPDATE groups SET group_name = ? WHERE group_name = ?", (new_name, old_name))
            
            # Update any items that use this group
            cursor.execute("UPDATE inventory SET group_name = ? WHERE group_name = ?", (new_name, old_name))
            
            logging.info(f"Group renamed from '{old_name}' to '{new_name}' by user '{current_user.username}'")
            return {
                "message": f"Group renamed from '{old_name}' to '{new_name}'",
                "affected_items": cursor.rowcount
            }
            
    except sqlite3.Error as e:
        logging.error(f"Database error while renaming group: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while renaming group"
        )
    except Exception as e:
        logging.error(f"Unexpected error while renaming group: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while renaming group"
        )

@app.delete("/groups/{group_name}")
async def delete_group(group_name: str, current_user: User = Depends(get_admin_user)):
    """Delete a group."""
    try:
        with DBConnection().get_cursor() as cursor:
            # Check if the group exists
            cursor.execute("SELECT 1 FROM groups WHERE group_name = ?", (group_name,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Group not found"
                )
            
            # Remove group from items first
            cursor.execute("UPDATE inventory SET group_name = NULL WHERE group_name = ?", (group_name,))
            
            # Then delete the group
            cursor.execute("DELETE FROM groups WHERE group_name = ?", (group_name,))
            
            logging.info(f"Group deleted: {group_name}")
            return {"message": f"Group {group_name} has been deleted"}
            
    except sqlite3.Error as e:
        logging.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting group")

@app.post("/backup")
async def create_backup(current_user: User = Depends(get_admin_user)):
    """Create a backup of the database."""
    backup_file = inventory_service.backup_data()
    return {"message": "Backup created successfully", "filename": backup_file}

@app.put("/inventory/{item_name}/group")
async def update_item_group(item_name: str, group: Optional[str] = None, current_user: User = Depends(get_editor_user)):
    """Update an item's group."""
    success = inventory_service.update_item_group(item_name, group)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return {"message": f"Updated group for {item_name}"}

@app.put("/inventory/{item_name}/custom-fields")
async def update_item_custom_fields(
    item_name: str, 
    update: ItemCustomFieldsUpdate, 
    current_user: User = Depends(get_editor_user)
):
    """Update an item's custom fields."""
    if update.merge:
        success = inventory_service.merge_item_custom_fields(item_name, update.custom_fields)
    else:
        success = inventory_service.update_item_custom_fields(item_name, update.custom_fields)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return {"message": f"Updated custom fields for {item_name}"}

@app.get("/reports/low-stock")
async def get_low_stock_report(threshold: int = 10, current_user: User = Depends(get_current_user)):
    """Get a report of items with low stock."""
    items = report_service.get_low_stock_items(threshold)
    return [item.to_dict() for item in items]

@app.post("/reports/inventory")
async def generate_inventory_report(
    filename: str,
    format_type: str = "csv",
    groups: Optional[str] = None,
    current_user: User = Depends(get_admin_user)
):
    """Generate an inventory report file."""
    group_list = None
    if groups:
        group_list = [g.strip() for g in groups.split(',')]
    
    output_file = report_service.generate_inventory_report(filename, group_list, format_type)
    return {"message": f"Report generated: {output_file}"}

@app.get("/reports/activity")
async def get_activity_report(days: int = 30, current_user: User = Depends(get_admin_user)):
    """Get a report of inventory activity for the last N days."""
    report = report_service.get_activity_report(days)
    return report

@app.get("/prices")
async def get_all_prices(current_user: User = Depends(get_current_user)):
    """Get all current prices."""
    prices = price_service.get_all_prices()
    result = {}
    
    for item_name, price_entries in prices.items():
        result[item_name] = [entry.to_dict() for entry in price_entries]
    
    return result

@app.get("/prices/{item_name}")
async def get_item_price(item_name: str, supplier: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get the current price for an item."""
    price = price_service.get_price(item_name, supplier)
    if not price:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Price not found"
        )
    return price.to_dict()

@app.put("/prices/{item_name}")
async def set_item_price(
    item_name: str, 
    price_update: PriceUpdate, 
    current_user: User = Depends(get_editor_user)
):
    """Set or update the price for an item. Only admins and editors can update prices."""
    try:
        success = price_service.set_price(
            item_name=item_name,
            price=price_update.price,
            supplier=price_update.supplier,
            is_unit_price=price_update.is_unit_price
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Item not found")
            
        return {"message": "Price updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Error updating price: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating price")

@app.get("/prices/{item_name}/history")
async def get_price_history(item_name: str, supplier: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get price history for an item."""
    history = price_service.get_price_history(item_name, supplier)
    return history

@app.get("/prices/{item_name}/cheapest")
async def get_cheapest_supplier(item_name: str, current_user: User = Depends(get_current_user)):
    """Get the cheapest supplier for an item."""
    supplier, price = price_service.get_cheapest_supplier(item_name)
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No suppliers found for this item"
        )
    
    return {"item_name": item_name, "supplier": supplier, "price": price}

@app.delete("/prices/{item_name}")
async def delete_item_price(item_name: str, supplier: Optional[str] = None, current_user: User = Depends(get_admin_user)):
    """Delete price entries for an item."""
    success = price_service.delete_price(item_name, supplier)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Price not found"
        )
    
    if supplier:
        return {"message": f"Price for {item_name} from supplier {supplier} deleted"}
    else:
        return {"message": f"All price entries for {item_name} deleted"}

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("API_PORT", 8005))
    uvicorn.run(app, host="0.0.0.0", port=port) 