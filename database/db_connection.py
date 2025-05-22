# database/db_connection.py

import sqlite3
import logging
from contextlib import contextmanager


class DBConnection:
    """Database connection class that manages the connection to the SQLite database."""
    
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        """Singleton pattern to ensure only one DB connection instance exists."""
        if cls._instance is None:
            cls._instance = super(DBConnection, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance
    
    def __init__(self, db_name="inventory.db"):
        """Initialize database connection if not already initialized."""
        if not self.initialized:
            self.db_name = db_name
            self.conn = None
            self.initialized = True
            logging.info(f"Initialized database connection to {db_name}")
    
    def connect(self):
        """Connect to the database."""
        if self.conn is None:
            try:
                # Use check_same_thread=False to allow SQLite to be used across different threads
                self.conn = sqlite3.connect(self.db_name, check_same_thread=False)
                self.conn.row_factory = sqlite3.Row  # Return rows as dictionaries
                return self.conn
            except sqlite3.Error as e:
                logging.error(f"Error connecting to database: {e}")
                raise
        return self.conn
    
    def close(self):
        """Close the database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
            logging.info("Database connection closed")
    
    @contextmanager
    def get_cursor(self):
        """Context manager to get a cursor and handle commits/rollbacks."""
        conn = self.connect()
        cursor = conn.cursor()
        try:
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            logging.error(f"Database error: {e}")
            raise
    
    def __del__(self):
        """Ensure the database connection is closed when the object is deleted."""
        self.close() 