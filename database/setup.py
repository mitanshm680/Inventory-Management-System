# database/setup.py

import logging
from database.db_connection import DBConnection


def setup_database():
    """Create necessary database tables if they don't exist."""
    db = DBConnection()

    try:
        with db.get_cursor() as cursor:
            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create groups table (must be before items for foreign key)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS groups (
                    group_name TEXT PRIMARY KEY NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create items table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS items (
                    item_name TEXT PRIMARY KEY NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 0,
                    group_name TEXT,
                    custom_fields TEXT,
                    FOREIGN KEY (group_name) REFERENCES groups(group_name) ON DELETE SET NULL
                )
            """)

            # Create history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action TEXT NOT NULL,
                    item_name TEXT NOT NULL,
                    quantity INTEGER,
                    group_name TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    user_name TEXT
                )
            """)

            # Create index on history timestamp
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_history_timestamp
                ON history(timestamp DESC)
            """)

            # Create prices table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS prices (
                    item_name TEXT NOT NULL,
                    price REAL NOT NULL CHECK(price >= 0),
                    supplier TEXT NOT NULL DEFAULT 'default',
                    date_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_unit_price INTEGER DEFAULT 1,
                    PRIMARY KEY (item_name, supplier),
                    FOREIGN KEY (item_name) REFERENCES items(item_name) ON DELETE CASCADE
                )
            """)

            # Create price history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS price_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_name TEXT NOT NULL,
                    price REAL NOT NULL,
                    supplier TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_unit_price INTEGER DEFAULT 1,
                    quantity_at_time INTEGER
                )
            """)

            # Create index on price history
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_price_history_item
                ON price_history(item_name, timestamp DESC)
            """)

            logging.info("Database tables and indexes created successfully")
    except Exception as e:
        logging.error(f"Error setting up database: {e}")
        raise


def initialize_database():
    """Initialize the database with required tables."""
    setup_database() 