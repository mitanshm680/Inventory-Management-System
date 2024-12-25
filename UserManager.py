# UserManager.py
import json
import logging
import csv
import shutil
from datetime import datetime
import hashlib

#user management class
class UserManager:
    def __init__(self, userfile='users.json'):
        self.userfile = userfile
        try:
            with open(self.userfile, 'r') as f:
                self.users = json.load(f)
        except FileNotFoundError:
            self.users = {
                'user': {
                    'password': hashlib.sha256('1234'.encode()).hexdigest(),
                    'role': 'admin'
                }
            }
            self.save_users()

    def save_users(self):
        with open(self.userfile, 'w') as f:
            json.dump(self.users, f, indent=4)

    def add_user(self, username, password, role='viewer'):
        if username in self.users:
            print("User already exists.")
            return False
        hashed_pw = hashlib.sha256(password.encode()).hexdigest()
        self.users[username] = {'password': hashed_pw, 'role': role}
        self.save_users()
        print("User added successfully.")
        return True

    def authenticate(self, username, password):
        if username in self.users:
            hashed_pw = hashlib.sha256(password.encode()).hexdigest()
            if self.users[username]['password'] == hashed_pw:
                print("Authentication successful.")
                return self.users[username]['role']
        print("Authentication failed.")
        return None

    def change_password(self, username, new_password):
        if username in self.users:
            hashed_pw = hashlib.sha256(new_password.encode()).hexdigest()
            self.users[username]['password'] = hashed_pw
            self.save_users()
            print("Password changed successfully.")
            return True
        print("User not found.")
        return False

    def delete_user(self, username):
        if username in self.users:
            del self.users[username]
            self.save_users()
            print("User deleted successfully.")
            return True
        print("User not found.")
        return False

    def list_users(self):
        for username, details in self.users.items():
            print(f"Username: {username}, Role: {details['role']}")

    def change_role(self, username, new_role):
        if username in self.users:
            self.users[username]['role'] = new_role
            self.save_users()
            print("Role changed successfully.")
            return True
        print("User not found.")
        return False
