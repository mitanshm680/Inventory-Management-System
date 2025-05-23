# database/db_connection.py

import sqlite3
import logging
from contextlib import contextmanager
from threading import Lock
from typing import Optional


class DBConnection:
    """Database connection class that manages the connection to the SQLite database."""
    
    _instance = None
    _lock = Lock()
    
    def __new__(cls, *args, **kwargs):
        """Singleton pattern to ensure only one DB connection instance exists."""
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DBConnection, cls).__new__(cls)
                cls._instance.initialized = False
            return cls._instance
    
    def __init__(self, db_name="inventory.db"):
        """Initialize database connection if not already initialized."""
        if not self.initialized:
            self.db_name = db_name
            self.conn: Optional[sqlite3.Connection] = None
            self._lock = Lock()
            self.initialized = True
            logging.info(f"Initialized database connection to {db_name}")
    
    def connect(self):
        """Connect to the database with retry mechanism."""
        if self.conn is None:
            max_retries = 3
            retry_count = 0
            
            while retry_count < max_retries:
                try:
                    with self._lock:
                        if self.conn is None:  # Double-check under lock
                            self.conn = sqlite3.connect(
                                self.db_name,
                                check_same_thread=False,
                                timeout=30.0  # Increase timeout for busy database
                            )
                            self.conn.row_factory = sqlite3.Row
                            # Enable foreign key support
                            self.conn.execute("PRAGMA foreign_keys = ON")
                            # Set journal mode to WAL for better concurrency
                            self.conn.execute("PRAGMA journal_mode = WAL")
                            return self.conn
                except sqlite3.Error as e:
                    retry_count += 1
                    if retry_count == max_retries:
                        logging.error(f"Failed to connect to database after {max_retries} attempts: {e}")
                        raise
                    logging.warning(f"Database connection attempt {retry_count} failed: {e}")
                    import time
                    time.sleep(1)  # Wait before retrying
        return self.conn
    
    def close(self):
        """Close the database connection safely."""
        with self._lock:
            if self.conn:
                try:
                    if self.conn.in_transaction:
                        self.conn.rollback()
                    self.conn.close()
                except sqlite3.Error as e:
                    logging.error(f"Error closing database connection: {e}")
                finally:
                    self.conn = None
                    logging.info("Database connection closed")
    
    @contextmanager
    def get_cursor(self):
        """Context manager to get a cursor and handle commits/rollbacks with proper locking."""
        conn = self.connect()
        cursor = None
        try:
            with self._lock:
                cursor = conn.cursor()
            yield cursor
            with self._lock:
                conn.commit()
        except Exception as e:
            with self._lock:
                if conn.in_transaction:
                    conn.rollback()
            logging.error(f"Database error: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
    
    def __del__(self):
        """Ensure the database connection is closed when the object is deleted."""
        self.close()

    def check_connection(self) -> bool:
        """Check if the database connection is valid."""
        try:
            with self.get_cursor() as cursor:
                cursor.execute("SELECT 1")
                return True
        except sqlite3.Error:
            return False

    def reconnect(self):
        """Force a reconnection to the database."""
        self.close()
        return self.connect() 