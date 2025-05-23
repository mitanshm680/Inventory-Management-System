#!/usr/bin/env python3
import unittest
import sqlite3
import os
import sys

# Add parent directory to path so we can import modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

# Connect to the database
conn = sqlite3.connect('inventory.db')
cursor = conn.cursor()

# Get a list of tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("Tables in database:")
for table in tables:
    print(f"- {table[0]}")

# Check the structure of each table
for table_name in [table[0] for table in tables]:
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    print(f"\nStructure of {table_name} table:")
    for col in columns:
        print(f"  {col[1]} ({col[2]}){' PRIMARY KEY' if col[5] else ''}")

# Close connection
conn.close() 