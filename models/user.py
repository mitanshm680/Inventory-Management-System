# models/user.py

import hashlib
from typing import Dict, Optional


class User:
    """Represents a system user."""
    
    ROLES = ['admin', 'editor', 'viewer']  # Available user roles
    
    def __init__(self, username: str, password_hash: str, role: str = 'viewer'):
        """
        Initialize a User.
        
        Args:
            username: User's username
            password_hash: Hash of the user's password
            role: User's role (admin, editor, or viewer)
        """
        self.username = username
        self.password_hash = password_hash
        
        if role not in self.ROLES:
            raise ValueError(f"Invalid role: {role}. Must be one of {self.ROLES}")
        self.role = role
    
    @classmethod
    def create(cls, username: str, plaintext_password: str, role: str = 'viewer'):
        """
        Create a new user with a hashed password.
        
        Args:
            username: User's username
            plaintext_password: User's password (will be hashed)
            role: User's role
        
        Returns:
            User: A new User instance
        """
        password_hash = hashlib.sha256(plaintext_password.encode()).hexdigest()
        return cls(username, password_hash, role)
    
    def check_password(self, plaintext_password: str) -> bool:
        """
        Check if the provided password matches the stored hash.
        
        Args:
            plaintext_password: Password to check
        
        Returns:
            bool: True if password matches, False otherwise
        """
        password_hash = hashlib.sha256(plaintext_password.encode()).hexdigest()
        return self.password_hash == password_hash
    
    def to_dict(self) -> Dict[str, str]:
        """
        Convert the user to a dictionary.
        
        Returns:
            dict: Dictionary representation of the user
        """
        return {
            'username': self.username,
            'password': self.password_hash,
            'role': self.role
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, str]):
        """
        Create a User from a dictionary.
        
        Args:
            data: Dictionary containing user data
        
        Returns:
            User: A User instance
        """
        return cls(
            username=data['username'],
            password_hash=data['password'],
            role=data.get('role', 'viewer')
        ) 