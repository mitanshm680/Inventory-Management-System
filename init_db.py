import sqlite3
import logging

def init_db():
    """Initialize the database with required tables."""
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()

        # Create items table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            item_name TEXT PRIMARY KEY,
            quantity INTEGER NOT NULL,
            group_name TEXT,
            custom_fields TEXT
        )
        ''')

        # Create groups table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS groups (
            group_name TEXT PRIMARY KEY,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Create prices table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS prices (
            item_name TEXT PRIMARY KEY,
            price REAL NOT NULL,
            supplier TEXT,
            date_updated TIMESTAMP,
            is_unit_price BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (item_name) REFERENCES items (item_name)
        )
        ''')

        # Create price history table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            price REAL NOT NULL,
            supplier TEXT,
            timestamp TIMESTAMP,
            is_unit_price BOOLEAN DEFAULT TRUE,
            quantity_at_time INTEGER,
            FOREIGN KEY (item_name) REFERENCES items (item_name)
        )
        ''')

        # Create inventory history table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            action TEXT NOT NULL,
            quantity INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            group_name TEXT,
            FOREIGN KEY (item_name) REFERENCES items (item_name)
        )
        ''')

        conn.commit()
        logging.info("Database initialized successfully")
    except sqlite3.Error as e:
        logging.error(f"Error initializing database: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    init_db() 