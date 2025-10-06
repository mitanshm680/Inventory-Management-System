"""
Inventory Management System - Backend API
Complete FastAPI backend with all endpoints
"""
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
from datetime import datetime, timedelta
from jose import JWTError, jwt
import hashlib
import logging
import sqlite3
import sys
import os

# Import our services
from services.inventory_service import InventoryService
from services.user_service import UserService
from utils.logging_config import setup_logging
from database.setup import initialize_database
from database.db_connection import DBConnection

# Setup logging
setup_logging()
logging.info("Starting Inventory Management API")

# Initialize database
initialize_database()

# Access the database connection
db_connection = DBConnection()

# Initialize default admin user with SHA-256 hashed password
try:
    with db_connection.get_cursor() as cursor:
        cursor.execute("SELECT 1")
        # Check if admin exists
        cursor.execute("SELECT password FROM users WHERE username = 'admin'")
        admin = cursor.fetchone()

        if admin:
            # Update existing admin password to SHA-256 if it's plaintext
            if admin['password'] == '1234':
                hashed_password = hashlib.sha256('1234'.encode()).hexdigest()
                cursor.execute("UPDATE users SET password = ? WHERE username = 'admin'", (hashed_password,))
                logging.info("Updated admin password to SHA-256 hash")
        else:
            # Create new admin with hashed password
            hashed_password = hashlib.sha256('1234'.encode()).hexdigest()
            cursor.execute("""
                INSERT INTO users (username, password, role)
                VALUES ('admin', ?, 'admin')
            """, (hashed_password,))
            logging.info("Created admin user with SHA-256 hashed password")
except Exception as e:
    logging.error(f"Database initialization error: {e}")
    sys.exit(1)

# Security settings
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# FastAPI app
app = FastAPI(
    title="Inventory Management System API",
    description="Complete inventory management with user authentication",
    version="1.0.0"
)

# CORS - Allow both localhost and 127.0.0.1
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Initialize services
inventory_service = InventoryService()
user_service = UserService()

# ============================================================================
# Pydantic Models
# ============================================================================

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class User(BaseModel):
    username: str
    role: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "viewer"

class UserUpdate(BaseModel):
    role: Optional[str] = None
    password: Optional[str] = None

class InventoryItem(BaseModel):
    item_name: str
    quantity: int
    group_name: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = {}

class InventoryItemUpdate(BaseModel):
    item_name: Optional[str] = None
    quantity: Optional[int] = None
    group_name: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

class GroupCreate(BaseModel):
    group_name: str
    description: Optional[str] = None

class GroupRename(BaseModel):
    new_name: str

class PriceUpdate(BaseModel):
    price: float
    supplier: Optional[str] = "default"

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class SearchQuery(BaseModel):
    search_term: str
    search_type: Optional[str] = "contains"  # starts_with, contains, exact

# ============================================================================
# Authentication
# ============================================================================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
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
    except JWTError:
        raise credentials_exception

    user = User(username=token_data.username, role=token_data.role)
    if user is None:
        raise credentials_exception
    return user

def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def get_editor_user(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Editor or admin access required")
    return current_user

# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint - returns JWT token"""
    logging.info(f"Login attempt for user: {form_data.username}")

    role = user_service.authenticate(form_data.username, form_data.password)
    if not role:
        logging.warning(f"Failed login attempt for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": form_data.username, "role": role})
    logging.info(f"User {form_data.username} logged in successfully with role: {role}")

    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

# ============================================================================
# User Management Endpoints
# ============================================================================

@app.get("/users")
async def get_users(current_user: User = Depends(get_admin_user)):
    """Get all users (admin only)"""
    users = user_service.get_all_users()
    return {"users": users}

@app.post("/users")
async def create_user(user: UserCreate, current_user: User = Depends(get_admin_user)):
    """Create new user (admin only)"""
    try:
        result = user_service.create_user(user.username, user.password, user.role)
        return {"message": "User created successfully", "user": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/users/{username}")
async def update_user(username: str, user_update: UserUpdate, current_user: User = Depends(get_admin_user)):
    """Update user (admin only)"""
    try:
        if user_update.password:
            user_service.update_password(username, user_update.password)
        if user_update.role:
            result = user_service.update_user(username, role=user_update.role)
            return {"message": "User updated successfully", "user": result}
        return {"message": "No updates provided"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/users/{username}")
async def delete_user(username: str, current_user: User = Depends(get_admin_user)):
    """Delete user (admin only)"""
    try:
        success = user_service.delete_user(username)
        if success:
            return {"message": f"User '{username}' deleted successfully"}
        raise HTTPException(status_code=404, detail="User not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/users/me/change-password")
async def change_my_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user)
):
    """Change current user's password"""
    try:
        user_service.change_password(
            current_user.username,
            password_change.old_password,
            password_change.new_password
        )
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ============================================================================
# Inventory Endpoints
# ============================================================================

@app.get("/inventory")
async def get_inventory(current_user: User = Depends(get_current_user)):
    """Get all inventory items"""
    items = inventory_service.get_inventory()
    # Convert Item objects to dictionaries
    items_dict = []
    for item in items:
        items_dict.append({
            "item_name": item.item_name,
            "quantity": item.quantity,
            "group_name": item.group_name,
            "custom_fields": item.custom_fields or {}
        })
    return items_dict

@app.get("/inventory/{item_name}")
async def get_item(item_name: str, current_user: User = Depends(get_current_user)):
    """Get specific item"""
    item = inventory_service.get_item(item_name)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "item_name": item.item_name,
        "quantity": item.quantity,
        "group_name": item.group_name,
        "custom_fields": item.custom_fields or {}
    }

@app.post("/inventory")
async def add_inventory_item(item: InventoryItem, current_user: User = Depends(get_editor_user)):
    """Add new inventory item"""
    success = inventory_service.add_item(
        item.item_name,
        item.quantity,
        item.group_name,
        item.custom_fields
    )
    if success:
        return {"message": "Item added successfully", "item_name": item.item_name}
    raise HTTPException(status_code=400, detail="Failed to add item")

@app.put("/inventory/{item_name}")
async def update_inventory_item(
    item_name: str,
    item_update: InventoryItemUpdate,
    current_user: User = Depends(get_editor_user)
):
    """Update inventory item"""
    # Get existing item
    existing_item = inventory_service.get_item(item_name)
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Delete and recreate if name changed
    if item_update.item_name and item_update.item_name != item_name:
        inventory_service.delete_item(item_name)
        success = inventory_service.add_item(
            item_update.item_name,
            item_update.quantity if item_update.quantity is not None else existing_item.quantity,
            item_update.group_name if item_update.group_name is not None else existing_item.group_name,
            item_update.custom_fields if item_update.custom_fields is not None else existing_item.custom_fields
        )
    else:
        # Update existing
        inventory_service.delete_item(item_name)
        success = inventory_service.add_item(
            item_name,
            item_update.quantity if item_update.quantity is not None else existing_item.quantity,
            item_update.group_name if item_update.group_name is not None else existing_item.group_name,
            item_update.custom_fields if item_update.custom_fields is not None else existing_item.custom_fields
        )

    if success:
        return {"message": "Item updated successfully"}
    raise HTTPException(status_code=400, detail="Failed to update item")

@app.delete("/inventory/{item_name}")
async def delete_inventory_item(item_name: str, current_user: User = Depends(get_admin_user)):
    """Delete inventory item"""
    success = inventory_service.delete_item(item_name)
    if success:
        return {"message": f"Item '{item_name}' deleted successfully"}
    raise HTTPException(status_code=404, detail="Item not found")

@app.get("/inventory/{item_name}/history")
async def get_item_history(item_name: str, current_user: User = Depends(get_current_user)):
    """Get item history"""
    history = inventory_service.get_item_history(item_name)
    history_list = []
    for entry in history:
        history_list.append({
            "action": entry.action,
            "item_name": entry.item_name,
            "quantity": entry.quantity,
            "group_name": entry.group_name,
            "timestamp": entry.timestamp
        })
    return {"history": history_list}

@app.post("/inventory/search")
async def search_inventory(
    search_query: SearchQuery,
    current_user: User = Depends(get_current_user)
):
    """Advanced search for inventory items"""
    items = inventory_service.search_items(
        search_query.search_term,
        search_query.search_type
    )
    items_dict = []
    for item in items:
        items_dict.append({
            "item_name": item.item_name,
            "quantity": item.quantity,
            "group_name": item.group_name,
            "custom_fields": item.custom_fields or {}
        })
    return {"items": items_dict, "count": len(items_dict)}

# ============================================================================
# Groups Endpoints
# ============================================================================

@app.get("/groups")
async def get_groups(current_user: User = Depends(get_current_user)):
    """Get all groups"""
    try:
        with db_connection.get_cursor() as cursor:
            cursor.execute("SELECT group_name, description, created_at FROM groups ORDER BY group_name")
            groups = []
            for row in cursor.fetchall():
                groups.append({
                    "group_name": row['group_name'],
                    "description": row['description'],
                    "created_at": row['created_at']
                })
            return {"groups": groups}
    except Exception as e:
        logging.error(f"Error fetching groups: {e}")
        raise HTTPException(status_code=500, detail="Error fetching groups")

@app.post("/groups")
async def create_group(group: GroupCreate, current_user: User = Depends(get_editor_user)):
    """Create new group"""
    try:
        with db_connection.get_cursor() as cursor:
            cursor.execute(
                "INSERT INTO groups (group_name, description) VALUES (?, ?)",
                (group.group_name, group.description)
            )
            return {"message": "Group created successfully", "group_name": group.group_name}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Group already exists")
    except Exception as e:
        logging.error(f"Error creating group: {e}")
        raise HTTPException(status_code=500, detail="Error creating group")

@app.put("/groups/{old_name}")
async def rename_group(old_name: str, group_rename: GroupRename, current_user: User = Depends(get_editor_user)):
    """Rename a group"""
    new_name = group_rename.new_name
    try:
        with db_connection.get_cursor() as cursor:
            # Check if old group exists
            cursor.execute("SELECT 1 FROM groups WHERE group_name = ?", (old_name,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail=f"Group '{old_name}' not found")

            # Check if new name already exists
            if old_name != new_name:
                cursor.execute("SELECT 1 FROM groups WHERE group_name = ?", (new_name,))
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail=f"Group '{new_name}' already exists")

            # Update group name
            cursor.execute("UPDATE groups SET group_name = ? WHERE group_name = ?", (new_name, old_name))

            # Update items with this group
            cursor.execute("UPDATE items SET group_name = ? WHERE group_name = ?", (new_name, old_name))

            return {"message": f"Group renamed from '{old_name}' to '{new_name}'"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error renaming group: {e}")
        raise HTTPException(status_code=500, detail="Error renaming group")

@app.delete("/groups/{group_name}")
async def delete_group(group_name: str, current_user: User = Depends(get_admin_user)):
    """Delete a group"""
    try:
        with db_connection.get_cursor() as cursor:
            cursor.execute("DELETE FROM groups WHERE group_name = ?", (group_name,))
            if cursor.rowcount > 0:
                # Set group_name to NULL for items in this group
                cursor.execute("UPDATE items SET group_name = NULL WHERE group_name = ?", (group_name,))
                return {"message": f"Group '{group_name}' deleted successfully"}
            raise HTTPException(status_code=404, detail="Group not found")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting group: {e}")
        raise HTTPException(status_code=500, detail="Error deleting group")

# ============================================================================
# Prices Endpoints
# ============================================================================

@app.get("/prices")
async def get_all_prices(current_user: User = Depends(get_current_user)):
    """Get all prices"""
    try:
        with db_connection.get_cursor() as cursor:
            cursor.execute("""
                SELECT item_name, price, supplier, date_updated, is_unit_price
                FROM prices
                ORDER BY item_name, supplier
            """)
            prices = []
            for row in cursor.fetchall():
                prices.append({
                    "item_name": row['item_name'],
                    "price": row['price'],
                    "supplier": row['supplier'],
                    "date_updated": row['date_updated'],
                    "is_unit_price": bool(row['is_unit_price'])
                })
            return {"prices": prices}
    except Exception as e:
        logging.error(f"Error fetching prices: {e}")
        raise HTTPException(status_code=500, detail="Error fetching prices")

@app.get("/prices/{item_name}")
async def get_item_price(item_name: str, current_user: User = Depends(get_current_user)):
    """Get price for specific item"""
    try:
        with db_connection.get_cursor() as cursor:
            cursor.execute("""
                SELECT item_name, price, supplier, date_updated, is_unit_price
                FROM prices
                WHERE item_name = ?
                ORDER BY price ASC
            """, (item_name,))
            prices = []
            for row in cursor.fetchall():
                prices.append({
                    "item_name": row['item_name'],
                    "price": row['price'],
                    "supplier": row['supplier'],
                    "date_updated": row['date_updated'],
                    "is_unit_price": bool(row['is_unit_price'])
                })
            return {"prices": prices}
    except Exception as e:
        logging.error(f"Error fetching price: {e}")
        raise HTTPException(status_code=500, detail="Error fetching price")

@app.put("/prices/{item_name}")
async def update_price(
    item_name: str,
    price_update: PriceUpdate,
    current_user: User = Depends(get_editor_user)
):
    """Update item price"""
    try:
        with db_connection.get_cursor() as cursor:
            # Check if item exists
            cursor.execute("SELECT 1 FROM items WHERE item_name = ?", (item_name,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Item not found")

            # Insert or update price
            cursor.execute("SELECT 1 FROM prices WHERE item_name = ? AND supplier = ?", (item_name, price_update.supplier))
            if cursor.fetchone():
                # Update existing
                cursor.execute("""
                    UPDATE prices
                    SET price = ?, date_updated = datetime('now'), is_unit_price = 1
                    WHERE item_name = ? AND supplier = ?
                """, (price_update.price, item_name, price_update.supplier))
            else:
                # Insert new
                cursor.execute("""
                    INSERT INTO prices (item_name, price, supplier, date_updated, is_unit_price)
                    VALUES (?, ?, ?, datetime('now'), 1)
                """, (item_name, price_update.price, price_update.supplier))

            return {"message": "Price updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating price: {e}")
        raise HTTPException(status_code=500, detail="Error updating price")

@app.delete("/prices/{item_name}")
async def delete_price(item_name: str, supplier: str = "default", current_user: User = Depends(get_admin_user)):
    """Delete price entry"""
    try:
        with db_connection.get_cursor() as cursor:
            cursor.execute("DELETE FROM prices WHERE item_name = ? AND supplier = ?", (item_name, supplier))
            if cursor.rowcount > 0:
                return {"message": "Price deleted successfully"}
            raise HTTPException(status_code=404, detail="Price not found")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting price: {e}")
        raise HTTPException(status_code=500, detail="Error deleting price")

# ============================================================================
# Reports Endpoints
# ============================================================================

@app.get("/reports/low-stock")
async def get_low_stock_report(threshold: int = 10, current_user: User = Depends(get_current_user)):
    """Get low stock report with configurable threshold"""
    try:
        low_stock_items = inventory_service.check_low_stock(threshold)
        return {
            "low_stock_items": low_stock_items,
            "threshold": threshold,
            "count": len(low_stock_items)
        }
    except Exception as e:
        logging.error(f"Error fetching low stock report: {e}")
        raise HTTPException(status_code=500, detail="Error generating report")

@app.get("/reports/inventory")
async def get_inventory_report(groups: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get complete inventory report with optional group filtering"""
    group_list = groups.split(',') if groups else None
    report = inventory_service.generate_report(group_list)
    return report

@app.get("/reports/activity")
async def get_activity_report(limit: int = 100, current_user: User = Depends(get_current_user)):
    """Get recent activity"""
    try:
        with db_connection.get_cursor() as cursor:
            cursor.execute("""
                SELECT action, item_name, quantity, group_name, timestamp
                FROM history
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
            activities = []
            for row in cursor.fetchall():
                activities.append({
                    "action": row['action'],
                    "item_name": row['item_name'],
                    "quantity": row['quantity'],
                    "group_name": row['group_name'],
                    "timestamp": row['timestamp']
                })
            return {"activities": activities}
    except Exception as e:
        logging.error(f"Error fetching activity report: {e}")
        raise HTTPException(status_code=500, detail="Error generating report")

# ============================================================================
# Backup and Export Endpoints
# ============================================================================

@app.post("/backup")
async def create_backup(current_user: User = Depends(get_admin_user)):
    """Create database backup (admin only)"""
    try:
        backup_file = inventory_service.backup_data()
        return {"message": "Backup created successfully", "filename": backup_file}
    except Exception as e:
        logging.error(f"Error creating backup: {e}")
        raise HTTPException(status_code=500, detail="Error creating backup")

@app.get("/export/csv")
async def export_inventory_csv(
    groups: Optional[str] = None,
    current_user: User = Depends(get_admin_user)
):
    """Export inventory to CSV file (admin only)"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"inventory_export_{timestamp}.csv"
        group_list = groups.split(',') if groups else None

        success = inventory_service.export_to_csv(filename, group_list)
        if success:
            return FileResponse(
                filename,
                media_type='text/csv',
                filename=filename
            )
        raise HTTPException(status_code=500, detail="Failed to export data")
    except Exception as e:
        logging.error(f"Error exporting CSV: {e}")
        raise HTTPException(status_code=500, detail="Error exporting data")

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """API health check"""
    return {"status": "healthy", "message": "Inventory Management API is running"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Inventory Management System API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    logging.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
