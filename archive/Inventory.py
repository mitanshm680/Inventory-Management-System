# Inventory.py 

import json
import logging
import csv
import shutil
from datetime import datetime
import sqlite3

# Inventory class using SQLite
class Inventory:
    def __init__(self, db_name="inventory.db"):
        self.db_name = db_name
        self.conn = sqlite3.connect(self.db_name)
        self.cursor = self.conn.cursor()
        self.setup_database()

    def setup_database(self):
        """Create tables for items, groups, and history if not already existing."""
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS items (
                item_name TEXT PRIMARY KEY,
                quantity INTEGER NOT NULL,
                group_name TEXT,
                custom_fields TEXT
            )
        """)
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS groups (
                group_name TEXT PRIMARY KEY,
                items TEXT
            )
        """)
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                item_name TEXT,
                quantity INTEGER,
                group_name TEXT,
                timestamp TEXT NOT NULL
            )
        """)
        self.conn.commit()

    def log_action(self, action, item_name, quantity=None, group=None):
        """Log actions in the history table."""
        timestamp = datetime.now().isoformat()
        self.cursor.execute("""
            INSERT INTO history (action, item_name, quantity, group_name, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (action, item_name, quantity, group, timestamp))
        self.conn.commit()
        logging.info(f"{action} - Item: {item_name}, Quantity: {quantity}, Group: {group}")

    def add_item(self, item_name, quantity, group=None, custom_fields=None):
        """Add or update an item."""
        self.cursor.execute("""
            SELECT quantity FROM items WHERE item_name = ?
        """, (item_name,))
        result = self.cursor.fetchone()
        if result:
            new_quantity = result[0] + quantity
            self.cursor.execute("""
                UPDATE items SET quantity = ? WHERE item_name = ?
            """, (new_quantity, item_name))
        else:
            self.cursor.execute("""
                INSERT INTO items (item_name, quantity, group_name, custom_fields)
                VALUES (?, ?, ?, ?)
            """, (item_name, quantity, group, json.dumps(custom_fields) if custom_fields else None))
        self.log_action('ADD', item_name, quantity, group)
        self.conn.commit()
        self.check_low_stock(item_name)

    def remove_item(self, item_name, quantity):
        """Remove a quantity of an item or delete it if quantity reaches 0."""
        self.cursor.execute("""
            SELECT quantity FROM items WHERE item_name = ?
        """, (item_name,))
        result = self.cursor.fetchone()
        if result:
            current_quantity = result[0]
            if current_quantity >= quantity:
                new_quantity = current_quantity - quantity
                if new_quantity == 0:
                    self.cursor.execute("""
                        DELETE FROM items WHERE item_name = ?
                    """, (item_name,))
                else:
                    self.cursor.execute("""
                        UPDATE items SET quantity = ? WHERE item_name = ?
                    """, (new_quantity, item_name))
                self.log_action('REMOVE', item_name, quantity)
                self.conn.commit()
            else:
                print("Not enough quantity in inventory.")
        else:
            print("Item not found in inventory.")
        self.check_low_stock(item_name)

    def check_low_stock(self, item_name):
        """Warn if stock is low for an item."""
        self.cursor.execute("""
            SELECT quantity FROM items WHERE item_name = ?
        """, (item_name,))
        result = self.cursor.fetchone()
        if result and result[0] < 10:  # Set your own threshold
            print(f"Warning: Low stock for item '{item_name}'. Current quantity: {result[0]}")

    def check_inventory(self, groups=None):
        """View the inventory optionally filtered by groups."""
        if groups:
            query = "SELECT * FROM items WHERE group_name IN ({})".format(
                ",".join("?" for _ in groups))
            self.cursor.execute(query, groups)
        else:
            self.cursor.execute("SELECT * FROM items")
        for item in self.cursor.fetchall():
            custom_fields = json.loads(item[3]) if item[3] else {}
            custom_fields_str = ', '.join(f"{k}: {v}" for k, v in custom_fields.items())
            print(f"Item: {item[0]}, Quantity: {item[1]}, Group: {item[2]}, Custom Fields: {custom_fields_str}")

    def view_item_history(self, item_name):
        """View the history of a specific item."""
        self.cursor.execute("""
            SELECT action, quantity, group_name, timestamp FROM history
            WHERE item_name = ?
        """, (item_name,))
        for record in self.cursor.fetchall():
            print(f"{record[3]}: {record[0]} - Quantity: {record[1]}, Group: {record[2]}")

    def search_item(self, search_term):
        """Search for items by name."""
        self.cursor.execute("""
            SELECT * FROM items WHERE item_name LIKE ?
        """, (f"%{search_term}%",))
        results = self.cursor.fetchall()
        if results:
            for item in results:
                custom_fields = json.loads(item[3]) if item[3] else {}
                custom_fields_str = ', '.join(f"{k}: {v}" for k, v in custom_fields.items())
                print(f"Item: {item[0]}, Quantity: {item[1]}, Group: {item[2]}, Custom Fields: {custom_fields_str}")
        else:
            print("No items found with the search term.")

    def generate_report(self, filename, groups=None):
        """Generate a CSV report of inventory."""
        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Item Name', 'Quantity', 'Group', 'Custom Fields'])

            query = "SELECT * FROM items"
            if groups:
                query += " WHERE group_name IN ({})".format(",".join("?" for _ in groups))
                self.cursor.execute(query, groups)
            else:
                self.cursor.execute(query)

            for item in self.cursor.fetchall():
                custom_fields = json.loads(item[3]) if item[3] else {}
                custom_fields_str = ', '.join(f"{k}: {v}" for k, v in custom_fields.items())
                writer.writerow([item[0], item[1], item[2], custom_fields_str])

    def delete_item(self, item_name):
        """Delete an item completely."""
        self.cursor.execute("""
            DELETE FROM items WHERE item_name = ?
        """, (item_name,))
        self.log_action('DELETE', item_name)
        self.conn.commit()

    def rename_group(self, old_group_name, new_group_name):
        """Rename a group and update associated items."""
        self.cursor.execute("""
            UPDATE items SET group_name = ? WHERE group_name = ?
        """, (new_group_name, old_group_name))
        self.conn.commit()

    def backup_data(self):
        """Create a backup of the database."""
        backup_filename = f"backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.db"
        shutil.copy(self.db_name, backup_filename)
        print(f"Backup created: {backup_filename}")

    def __del__(self):
        """Close the database connection on destruction."""
        self.conn.close()

