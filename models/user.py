# models/user.py

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class User(BaseModel):
    """Model for system users."""
    username: str = Field(..., description="User's username")
    password_hash: str = Field(..., description="Hash of the user's password")
    role: str = Field(default='viewer', description="User's role (admin, editor, or viewer)")
    created_at: datetime = Field(default_factory=datetime.now, description="When the user was created")

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        """Validate the user role."""
        valid_roles = ['admin', 'editor', 'viewer']
        if v not in valid_roles:
            raise ValueError(f"Invalid role: {v}. Must be one of {valid_roles}")
        return v
    
    @classmethod
    def create(cls, username: str, plaintext_password: str, role: str = 'viewer'):
        """Create a new user with a hashed password."""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash(plaintext_password)
        return cls(username=username, password_hash=password_hash, role=role)
    
    def check_password(self, plaintext_password: str) -> bool:
        """Check if the provided password matches the stored hash."""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plaintext_password, self.password_hash)
    
    def to_dict(self):
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
    def from_dict(cls, data: dict):
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