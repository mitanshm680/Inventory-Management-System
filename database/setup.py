# database/setup.py

import logging
from database.db_connection import DBConnection


def setup_database():
    """Create necessary database tables if they don't exist."""
    db = DBConnection()
    
    try:
        with db.get_cursor() as cursor:
            # Create items table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS items (
                    item_name TEXT PRIMARY KEY,
                    quantity INTEGER NOT NULL,
                    group_name TEXT,
                    custom_fields TEXT
                )
            """)
            
            # Create groups table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS groups (
                    group_name TEXT PRIMARY KEY,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action TEXT NOT NULL,
                    item_name TEXT,
                    quantity INTEGER,
                    group_name TEXT,
                    timestamp TEXT NOT NULL
                )
            """)
            
            # Create price table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS prices (
                    item_name TEXT,
                    price REAL NOT NULL,
                    supplier TEXT,
                    date_updated TEXT NOT NULL,
                    is_unit_price BOOLEAN DEFAULT TRUE,
                    PRIMARY KEY (item_name, supplier)
                )
            """)
            
            # Create price history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS price_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_name TEXT NOT NULL,
                    price REAL NOT NULL,
                    supplier TEXT,
                    timestamp TEXT NOT NULL,
                    is_unit_price BOOLEAN DEFAULT TRUE,
                    quantity_at_time INTEGER
                )
            """)
            
            logging.info("Database tables created successfully")
    except Exception as e:
        logging.error(f"Error setting up database: {e}")
        raise


def initialize_database():
    """Initialize the database with required tables."""
    setup_database() 