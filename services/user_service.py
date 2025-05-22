# services/user_service.py

import json
import logging
from typing import Dict, List, Optional

from models.user import User


class UserService:
    """Service class for user operations."""
    
    def __init__(self, userfile='users.json'):
        """
        Initialize the user service.
        
        Args:
            userfile: Path to the users JSON file
        """
        self.userfile = userfile
        self.users: Dict[str, User] = {}
        self._load_users()
    
    def _load_users(self) -> None:
        """Load users from the JSON file."""
        try:
            with open(self.userfile, 'r') as f:
                user_data = json.load(f)
                
            self.users = {}
            for username, details in user_data.items():
                self.users[username] = User(
                    username=username,
                    password_hash=details['password'],
                    role=details.get('role', 'viewer')
                )
                
        except FileNotFoundError:
            # Create default admin user if file doesn't exist
            default_user = User.create('user', '1234', 'admin')
            self.users = {default_user.username: default_user}
            self._save_users()
            logging.info("Created default user with username 'user' and password '1234'")
    
    def _save_users(self) -> None:
        """Save users to the JSON file."""
        user_data = {}
        for username, user in self.users.items():
            user_data[username] = {
                'password': user.password_hash,
                'role': user.role
            }
            
        with open(self.userfile, 'w') as f:
            json.dump(user_data, f, indent=4)
    
    def add_user(self, username: str, password: str, role: str = 'viewer') -> bool:
        """
        Add a new user.
        
        Args:
            username: Username for the new user
            password: Password for the new user
            role: Role for the new user
        
        Returns:
            bool: True if successful, False if username already exists
        """
        if username in self.users:
            logging.warning(f"User already exists: {username}")
            return False
            
        self.users[username] = User.create(username, password, role)
        self._save_users()
        logging.info(f"User added successfully: {username}")
        return True
    
    def authenticate(self, username: str, password: str) -> Optional[str]:
        """
        Authenticate a user.
        
        Args:
            username: Username to authenticate
            password: Password to check
            
        Returns:
            Optional[str]: User's role if authentication successful, None otherwise
        """
        if username in self.users and self.users[username].check_password(password):
            logging.info(f"Authentication successful for user: {username}")
            return self.users[username].role
            
        logging.warning(f"Authentication failed for user: {username}")
        return None
    
    def change_password(self, username: str, new_password: str) -> bool:
        """
        Change a user's password.
        
        Args:
            username: Username whose password to change
            new_password: New password to set
            
        Returns:
            bool: True if successful, False if user not found
        """
        if username not in self.users:
            logging.warning(f"User not found: {username}")
            return False
            
        self.users[username] = User.create(
            username, 
            new_password, 
            self.users[username].role
        )
        self._save_users()
        logging.info(f"Password changed successfully for user: {username}")
        return True
    
    def delete_user(self, username: str) -> bool:
        """
        Delete a user.
        
        Args:
            username: Username to delete
            
        Returns:
            bool: True if successful, False if user not found
        """
        if username not in self.users:
            logging.warning(f"User not found: {username}")
            return False
            
        del self.users[username]
        self._save_users()
        logging.info(f"User deleted successfully: {username}")
        return True
    
    def get_users(self) -> List[Dict[str, str]]:
        """
        Get all users.
        
        Returns:
            List[Dict[str, str]]: List of users as dictionaries with username and role
        """
        return [
            {'username': username, 'role': user.role}
            for username, user in self.users.items()
        ]
    
    def change_role(self, username: str, new_role: str) -> bool:
        """
        Change a user's role.
        
        Args:
            username: Username whose role to change
            new_role: New role to set
            
        Returns:
            bool: True if successful, False if user not found or role invalid
        """
        if username not in self.users:
            logging.warning(f"User not found: {username}")
            return False
            
        if new_role not in User.ROLES:
            logging.warning(f"Invalid role: {new_role}")
            return False
            
        self.users[username].role = new_role
        self._save_users()
        logging.info(f"Role changed successfully for user {username} to {new_role}")
        return True
    
    def get_user(self, username: str) -> Optional[Dict[str, str]]:
        """
        Get a specific user.
        
        Args:
            username: Username to get
            
        Returns:
            Optional[Dict[str, str]]: User as dictionary with username and role if found, None otherwise
        """
        if username in self.users:
            return {'username': username, 'role': self.users[username].role}
        return None 