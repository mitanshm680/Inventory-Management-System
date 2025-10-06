"""
Database Viewer - View all tables in the inventory database
Usage: python view_database.py
"""
import sqlite3
from tabulate import tabulate

DB_NAME = "inventory.db"

def view_database():
    """Display all tables and their contents from the database."""
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]

        if not tables:
            print("No tables found in the database.")
            return

        print(f"\n{'='*80}")
        print(f"DATABASE: {DB_NAME}")
        print(f"{'='*80}\n")

        for table in tables:
            print(f"\n{'─'*80}")
            print(f"TABLE: {table}")
            print(f"{'─'*80}")

            # Get table data
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()

            if rows:
                # Get column names
                columns = [description[0] for description in cursor.description]

                # Convert rows to list of lists
                data = [list(row) for row in rows]

                # Display table
                print(tabulate(data, headers=columns, tablefmt='grid'))
                print(f"\nTotal rows: {len(rows)}")
            else:
                print("(empty)")

        print(f"\n{'='*80}\n")

        conn.close()

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except ImportError:
        print("\nNote: 'tabulate' module not installed.")
        print("Install it with: pip install tabulate")
        print("\nShowing simplified view:\n")

        # Fallback simple viewer
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]

        for table in tables:
            print(f"\n=== {table} ===")
            cursor.execute(f"SELECT * FROM {table}")
            for row in cursor.fetchall():
                print(row)

        conn.close()

if __name__ == "__main__":
    view_database()
