# services/user_service.py

import logging
import hashlib
from typing import Dict, List, Optional
from database.db_connection import DBConnection

class UserService:
    def __init__(self):
        self.db = DBConnection()
        self._ensure_users_table()
        self._ensure_admin_user()
    
    def _ensure_users_table(self):
        """Ensure the users table exists."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        username TEXT PRIMARY KEY,
                        password TEXT NOT NULL,
                        role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
        except Exception as e:
            logging.error(f"Error creating users table: {e}")
            raise
    
    def _ensure_admin_user(self):
        """Ensure default admin user exists with username: admin, password: 1234."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("SELECT 1 FROM users WHERE username = 'admin' LIMIT 1")
                if not cursor.fetchone():
                    # Create default admin user with SHA-256 hashed password
                    hashed_password = hashlib.sha256("1234".encode()).hexdigest()
                    cursor.execute(
                        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                        ("admin", hashed_password, "admin")
                    )
                    logging.info("Created default admin user (username: admin, password: 1234)")
        except Exception as e:
            logging.error(f"Error ensuring admin user: {e}")
            raise
    
    def authenticate(self, username: str, password: str) -> Optional[str]:
        """Authenticate a user using SHA-256 password hashing."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute(
                    "SELECT password, role FROM users WHERE username = ?",
                    (username,)
                )
                user = cursor.fetchone()

                if user:
                    stored_password = user['password']
                    hashed_input = hashlib.sha256(password.encode()).hexdigest()

                    if stored_password == hashed_input:
                        logging.info(f"User '{username}' authenticated successfully")
                        return user['role']
                    else:
                        logging.warning(f"Failed authentication attempt for user '{username}'")

                return None
        except Exception as e:
            logging.error(f"Error authenticating user: {e}")
            raise
    
    def add_user(self, username: str, password: str, role: str = "viewer") -> bool:
        """Add a new user (legacy method name)."""
        try:
            self.create_user(username, password, role)
            return True
        except:
            return False

    def create_user(self, username: str, password: str, role: str = "viewer") -> Dict[str, str]:
        """Create a new user with SHA-256 password hashing."""
        try:
            with self.db.get_cursor() as cursor:
                # Check if user exists
                cursor.execute("SELECT 1 FROM users WHERE username = ?", (username,))
                if cursor.fetchone():
                    raise ValueError(f"User '{username}' already exists")

                # Validate role
                if role not in ["admin", "editor", "viewer"]:
                    raise ValueError("Invalid role")

                # Hash password with SHA-256 and create user
                hashed_password = hashlib.sha256(password.encode()).hexdigest()
                cursor.execute(
                    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                    (username, hashed_password, role)
                )

                logging.info(f"User '{username}' created with role '{role}'")
                return {"username": username, "role": role}
        except Exception as e:
            logging.error(f"Error creating user: {e}")
            raise
    
    def change_role(self, username: str, new_role: str) -> bool:
        """Change a user's role (legacy method name)."""
        try:
            self.update_user(username, role=new_role)
            return True
        except:
            return False

    def update_user(self, username: str, role: Optional[str] = None) -> Dict[str, str]:
        """Update a user's role."""
        try:
            with self.db.get_cursor() as cursor:
                # Check if user exists
                cursor.execute("SELECT role FROM users WHERE username = ?", (username,))
                user = cursor.fetchone()
                if not user:
                    raise ValueError(f"User '{username}' not found")
                
                if role:
                    # Validate role
                    if role not in ["admin", "editor", "viewer"]:
                        raise ValueError("Invalid role")
                    
                    # Ensure at least one admin remains
                    if user['role'] == 'admin' and role != 'admin':
                        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
                        if cursor.fetchone()['count'] <= 1:
                            raise ValueError("Cannot remove the last admin user")
                    
                    # Update role
                    cursor.execute(
                        "UPDATE users SET role = ? WHERE username = ?",
                        (role, username)
                    )
                
                return {"username": username, "role": role or user['role']}
        except Exception as e:
            logging.error(f"Error updating user: {e}")
            raise
    
    def delete_user(self, username: str) -> bool:
        """Delete a user."""
        try:
            with self.db.get_cursor() as cursor:
                # Check if user exists and is admin
                cursor.execute("SELECT role FROM users WHERE username = ?", (username,))
                user = cursor.fetchone()
                if not user:
                    raise ValueError(f"User '{username}' not found")
                
                # Prevent deleting the last admin
                if user['role'] == 'admin':
                    cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
                    if cursor.fetchone()['count'] <= 1:
                        raise ValueError("Cannot delete the last admin user")
                
                # Delete user
                cursor.execute("DELETE FROM users WHERE username = ?", (username,))
                return True
        except Exception as e:
            logging.error(f"Error deleting user: {e}")
            return False
    
    def get_user(self, username: str) -> Optional[Dict[str, str]]:
        """Get user information."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute(
                    "SELECT username, role FROM users WHERE username = ?",
                    (username,)
                )
                user = cursor.fetchone()
                return dict(user) if user else None
        except Exception as e:
            logging.error(f"Error getting user: {e}")
            raise
    
    def get_users(self) -> List[Dict[str, str]]:
        """Get all users (legacy method name)."""
        return self.get_all_users()

    def get_all_users(self) -> List[Dict[str, str]]:
        """Get all users."""
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("SELECT username, role FROM users")
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logging.error(f"Error getting all users: {e}")
            raise
    
    def update_password(self, username: str, new_password: str) -> None:
        """Update a user's password using SHA-256 hashing."""
        try:
            with self.db.get_cursor() as cursor:
                # Check if user exists
                cursor.execute("SELECT 1 FROM users WHERE username = ?", (username,))
                if not cursor.fetchone():
                    raise ValueError(f"User '{username}' not found")

                # Hash password with SHA-256 and update
                hashed_password = hashlib.sha256(new_password.encode()).hexdigest()
                cursor.execute(
                    "UPDATE users SET password = ? WHERE username = ?",
                    (hashed_password, username)
                )

                logging.info(f"Password updated for user '{username}'")
        except Exception as e:
            logging.error(f"Error updating password: {e}")
            raise

    def change_password(self, username: str, old_password: str, new_password: str) -> bool:
        """Change password with old password verification."""
        try:
            # Verify old password first
            if not self.authenticate(username, old_password):
                logging.warning(f"Failed password change attempt for '{username}': invalid old password")
                raise ValueError("Current password is incorrect")

            # Update to new password
            self.update_password(username, new_password)
            logging.info(f"Password changed successfully for user '{username}'")
            return True
        except Exception as e:
            logging.error(f"Error changing password: {e}")
            raise 