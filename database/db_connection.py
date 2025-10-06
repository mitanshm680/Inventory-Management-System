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
        """Connect to the database with optimized settings."""
        if self.conn is None:
            try:
                with self._lock:
                    if self.conn is None:  # Double-check under lock
                        self.conn = sqlite3.connect(
                            self.db_name,
                            check_same_thread=False,
                            timeout=10.0
                        )
                        self.conn.row_factory = sqlite3.Row

                        # Performance optimizations
                        self.conn.execute("PRAGMA journal_mode = WAL")
                        self.conn.execute("PRAGMA synchronous = NORMAL")
                        self.conn.execute("PRAGMA cache_size = 10000")
                        self.conn.execute("PRAGMA temp_store = MEMORY")
                        self.conn.execute("PRAGMA mmap_size = 30000000000")
                        self.conn.execute("PRAGMA page_size = 4096")

                        logging.info("Successfully connected to database")
                        return self.conn
            except sqlite3.Error as e:
                logging.error(f"Failed to connect to database: {e}")
                raise
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
        """Context manager to get a cursor and handle commits/rollbacks."""
        conn = None
        cursor = None
        try:
            conn = self.connect()
            cursor = conn.cursor()
            yield cursor
            conn.commit()
        except sqlite3.Error as e:
            if conn:
                conn.rollback()
            logging.error(f"Database error: {e}")
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            logging.error(f"Unexpected error: {e}")
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