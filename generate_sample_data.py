"""
Generate sample data for the Inventory Management System
This script creates realistic test data for all tables
"""
import sqlite3
import random
from datetime import datetime, timedelta
import sys

DB_FILE = 'inventory.db'

# Sample data pools
ITEM_NAMES = [
    'Laptop Dell XPS 15', 'Mouse Logitech MX', 'Keyboard Mechanical',
    'Monitor 27" 4K', 'Webcam HD', 'Headphones Sony WH',
    'USB-C Cable', 'Power Adapter', 'Desk Lamp LED',
    'Office Chair Ergonomic', 'Standing Desk', 'Whiteboard',
    'Printer HP LaserJet', 'Paper A4 Box', 'Stapler Heavy Duty',
    'Pen Box (50)', 'Notebook A5', 'Sticky Notes Pack',
    'File Folder Box', 'Binder 3-Ring', 'Calculator Scientific'
]

GROUPS = ['Electronics', 'Peripherals', 'Furniture', 'Office Supplies', 'Accessories']

SUPPLIER_DATA = [
    ('TechWorld Solutions', 'John Smith', 'john@techworld.com', '555-0101', '123 Tech St', 'San Francisco', 'CA', '94102', 'USA', 'https://techworld.com', 4),
    ('Office Depot Pro', 'Sarah Johnson', 'sarah@officedepot.com', '555-0102', '456 Office Ave', 'New York', 'NY', '10001', 'USA', 'https://officedepot.com', 5),
    ('Global Electronics', 'Mike Chen', 'mike@globalelec.com', '555-0103', '789 Global Blvd', 'Seattle', 'WA', '98101', 'USA', 'https://globalelec.com', 4),
    ('Furniture Direct', 'Emily Brown', 'emily@furnituredirect.com', '555-0104', '321 Furniture Ln', 'Austin', 'TX', '73301', 'USA', 'https://furnituredirect.com', 3),
    ('Supply Hub', 'David Wilson', 'david@supplyhub.com', '555-0105', '654 Supply Rd', 'Chicago', 'IL', '60601', 'USA', 'https://supplyhub.com', 4)
]

LOCATIONS_DATA = [
    # No hardcoded locations - users should create their own
]

ADJUSTMENT_REASONS = ['damaged', 'found', 'correction', 'expired', 'returned', 'stolen', 'lost']

def get_random_date(days_back=365):
    """Get a random date within the past X days"""
    return (datetime.now() - timedelta(days=random.randint(0, days_back))).strftime('%Y-%m-%d')

def get_future_date(days_ahead=180):
    """Get a random date in the future"""
    return (datetime.now() + timedelta(days=random.randint(30, days_ahead))).strftime('%Y-%m-%d')

def generate_sample_data():
    """Generate and insert sample data into the database"""
    try:
        # First, delete old database files
        import os
        db_files = ['inventory.db', 'inventory.db-shm', 'inventory.db-wal']
        for db_file in db_files:
            if os.path.exists(db_file):
                try:
                    os.remove(db_file)
                    print(f"Deleted old {db_file}")
                except Exception as e:
                    print(f"Warning: Could not delete {db_file}: {e}")

        # Initialize the database schema
        print("\nInitializing database schema...")
        from database.setup import initialize_database
        initialize_database()
        print("Database schema initialized\n")

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        print("Generating sample data...")
        print("=" * 60)

        # 1. Create groups
        print("\n[1/9] Creating groups...")
        for group in GROUPS:
            cursor.execute("""
                INSERT OR IGNORE INTO groups (group_name, description)
                VALUES (?, ?)
            """, (group, f'{group} category items'))
        print(f"   Created {len(GROUPS)} groups")

        # 2. Create suppliers
        print("\n[2/9] Creating suppliers...")
        # First, delete existing suppliers to avoid conflicts
        cursor.execute("DELETE FROM suppliers")
        supplier_ids = []
        for supplier in SUPPLIER_DATA:
            cursor.execute("""
                INSERT INTO suppliers (
                    name, contact_person, email, phone, address,
                    city, state, zip_code, country, website, rating, is_active
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, supplier)
            supplier_ids.append(cursor.lastrowid)
        print(f"   Created {len(SUPPLIER_DATA)} suppliers")

        # 3. Create locations
        print("\n[3/9] Creating locations...")
        # Delete existing locations
        cursor.execute("DELETE FROM locations")
        location_ids = []
        # No hardcoded locations - users should create their own
        if len(LOCATIONS_DATA) > 0:
            for loc in LOCATIONS_DATA:
                name, address, city, state, zip_code, loc_type, capacity = loc
                cursor.execute("""
                    INSERT INTO locations (
                        name, address, city, state, zip_code, country,
                        location_type, capacity, current_utilization,
                        manager_name, is_active
                    )
                    VALUES (?, ?, ?, ?, ?, 'USA', ?, ?, ?, ?, 1)
                """, (name, address, city, state, zip_code, loc_type, capacity, 0, f'Manager {name.split()[0]}'))
                location_ids.append(cursor.lastrowid)
        print(f"   Skipped creating hardcoded locations - users should create their own")

        # 4. Create items
        print("\n[4/9] Creating items...")
        # Delete existing items
        cursor.execute("DELETE FROM items")
        for item_name in ITEM_NAMES:
            group = random.choice(GROUPS)
            quantity = random.randint(10, 500)
            reorder_level = random.randint(5, 20)
            reorder_quantity = random.randint(50, 200)

            cursor.execute("""
                INSERT INTO items (item_name, quantity, group_name, reorder_level, reorder_quantity)
                VALUES (?, ?, ?, ?, ?)
            """, (item_name, quantity, group, reorder_level, reorder_quantity))
        print(f"   Created {len(ITEM_NAMES)} items")

        # 5. Create prices
        print("\n[5/9] Creating prices...")
        # Delete existing data from related tables
        cursor.execute("DELETE FROM prices")
        cursor.execute("DELETE FROM price_history")
        cursor.execute("DELETE FROM batches")
        cursor.execute("DELETE FROM stock_adjustments")
        cursor.execute("DELETE FROM alerts")
        cursor.execute("DELETE FROM supplier_products")
        cursor.execute("DELETE FROM supplier_locations")
        cursor.execute("DELETE FROM history")
        price_count = 0
        for item_name in ITEM_NAMES:
            # Each item has 1-3 supplier prices
            num_suppliers = random.randint(1, 3)
            selected_suppliers = random.sample(SUPPLIER_DATA, num_suppliers)

            for supplier in selected_suppliers:
                supplier_name = supplier[0]
                base_price = random.uniform(10, 1000)

                cursor.execute("""
                    INSERT INTO prices (item_name, price, supplier, is_unit_price)
                    VALUES (?, ?, ?, 1)
                """, (item_name, round(base_price, 2), supplier_name))
                price_count += 1
        print(f"   Created {price_count} prices")

        # 6. Create price history
        print("\n[6/9] Creating price history...")
        history_count = 0
        for item_name in ITEM_NAMES:
            # Add 3-5 historical price entries per item
            for _ in range(random.randint(3, 5)):
                supplier_name = random.choice(SUPPLIER_DATA)[0]
                price = random.uniform(10, 1000)
                timestamp = get_random_date(180)

                cursor.execute("""
                    INSERT INTO price_history (item_name, price, supplier, timestamp, is_unit_price)
                    VALUES (?, ?, ?, ?, 1)
                """, (item_name, round(price, 2), supplier_name, timestamp))
                history_count += 1
        print(f"   Created {history_count} price history entries")

        # 7. Create batches
        print("\n[7/9] Creating batches...")
        batch_count = 0
        # Skip batches if no locations exist
        if len(location_ids) > 0:
            for item_name in ITEM_NAMES[:15]:  # Create batches for half the items
                # 1-3 batches per item
                for i in range(random.randint(1, 3)):
                    batch_number = f"BATCH-{item_name[:10].upper()}-{random.randint(1000, 9999)}"
                    quantity = random.randint(50, 200)
                    location_id = random.choice(location_ids)
                    supplier_id = random.choice(supplier_ids)

                    mfg_date = get_random_date(90)
                    exp_date = get_future_date(180)
                    received_date = get_random_date(60)
                    cost = random.uniform(5, 500)

                    cursor.execute("""
                        INSERT INTO batches (
                            batch_number, item_name, location_id, quantity,
                            manufacturing_date, expiry_date, received_date,
                            supplier_id, cost_per_unit, status
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
                    """, (batch_number, item_name, location_id, quantity, mfg_date, exp_date, received_date, supplier_id, round(cost, 2)))
                    batch_count += 1
        print(f"   Skipped batches - no locations available (users should create locations first)")

        # 8. Create stock adjustments
        print("\n[8/9] Creating stock adjustments...")
        adjustment_count = 0
        # Only create adjustments without location requirements
        for _ in range(50):  # Create 50 adjustments
            item_name = random.choice(ITEM_NAMES)
            adj_type = random.choice(['increase', 'decrease'])
            quantity = random.randint(1, 50)
            reason = random.choice(ADJUSTMENT_REASONS)
            location_id = random.choice(location_ids) if len(location_ids) > 0 and random.random() > 0.5 else None

            cursor.execute("""
                INSERT INTO stock_adjustments (
                    item_name, location_id, adjustment_type, quantity,
                    reason, reason_notes, adjusted_by, adjustment_date
                )
                VALUES (?, ?, ?, ?, ?, ?, 'admin', ?)
            """, (item_name, location_id, adj_type, quantity, reason, f'Sample adjustment for {reason}', get_random_date(30)))
            adjustment_count += 1
        print(f"   Created {adjustment_count} stock adjustments")

        # 9. Create alerts
        print("\n[9/9] Creating alerts...")
        alert_count = 0

        # Low stock alerts
        for _ in range(5):
            item_name = random.choice(ITEM_NAMES)
            cursor.execute("""
                INSERT INTO alerts (
                    alert_type, severity, item_name, message, is_read, is_resolved
                )
                VALUES ('low_stock', 'high', ?, ?, 0, 0)
            """, (item_name, f'Low stock alert: {item_name} is running low'))
            alert_count += 1

        # Expiring soon alerts
        for _ in range(3):
            item_name = random.choice(ITEM_NAMES)
            cursor.execute("""
                INSERT INTO alerts (
                    alert_type, severity, item_name, message, is_read, is_resolved
                )
                VALUES ('expiring_soon', 'medium', ?, ?, 0, 0)
            """, (item_name, f'Expiry warning: Batch for {item_name} expiring soon'))
            alert_count += 1

        print(f"   Created {alert_count} alerts")

        # 10. Create supplier-product relationships (NEW)
        print("\n[10/12] Creating supplier-product relationships...")
        sp_count = 0
        # Each item will have 1-3 suppliers offering it at different prices
        for item_name in ITEM_NAMES:
            num_suppliers = random.randint(1, 3)
            selected_suppliers = random.sample(supplier_ids, num_suppliers)

            for supplier_id in selected_suppliers:
                base_price = random.uniform(50, 2000)
                cursor.execute("""
                    INSERT OR IGNORE INTO supplier_products (
                        supplier_id, item_name, supplier_sku, unit_price,
                        minimum_order_quantity, lead_time_days, is_available, notes
                    )
                    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
                """, (
                    supplier_id,
                    item_name,
                    f"SKU-{supplier_id}-{item_name[:5].upper()}",
                    round(base_price, 2),
                    random.choice([1, 5, 10, 25, 50]),
                    random.randint(1, 14),
                    f"Best price for orders over {random.choice([10, 50, 100])} units"
                ))
                sp_count += 1
        print(f"   Created {sp_count} supplier-product relationships")

        # 11. Create supplier-location relationships (NEW)
        print("\n[11/12] Creating supplier-location relationships...")
        sl_count = 0
        # Skip supplier-location relationships if no locations exist
        if len(location_ids) > 0:
            # Each supplier can deliver to 2-4 locations with different costs
            for supplier_id in supplier_ids:
                num_locations = random.randint(2, len(location_ids))
                selected_locations = random.sample(location_ids, num_locations)

                for location_id in selected_locations:
                    distance = random.uniform(10, 800)
                    # Shipping cost increases with distance
                    shipping_cost = round(5 + (distance * 0.05), 2)
                    # Delivery days based on distance
                    delivery_days = 1 if distance < 100 else (2 if distance < 300 else random.randint(3, 7))

                    cursor.execute("""
                        INSERT OR IGNORE INTO supplier_locations (
                            supplier_id, location_id, distance_km, estimated_delivery_days,
                            shipping_cost, is_preferred, notes
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        supplier_id,
                        location_id,
                        round(distance, 1),
                        delivery_days,
                        shipping_cost,
                        1 if distance < 150 else 0,  # Prefer closer suppliers
                        f"Free shipping for orders over $500" if distance < 150 else None
                    ))
                    sl_count += 1
        print(f"   Skipped supplier-location relationships - no locations available (users should create locations first)")

        # 12. Create activity history
        print("\n[12/12] Creating activity history...")
        history_entries = 0
        actions = ['added', 'updated', 'deleted', 'quantity_changed']
        for _ in range(100):
            item_name = random.choice(ITEM_NAMES)
            action = random.choice(actions)
            quantity = random.randint(-50, 50) if action == 'quantity_changed' else None

            cursor.execute("""
                INSERT INTO history (action, item_name, quantity, timestamp, user_name)
                VALUES (?, ?, ?, ?, 'admin')
            """, (action, item_name, quantity, get_random_date(60)))
            history_entries += 1
        print(f"   Created {history_entries} history entries")

        conn.commit()
        conn.close()

        print("\n" + "=" * 60)
        print("SUCCESS! Sample data generated successfully")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  - Groups: {len(GROUPS)}")
        print(f"  - Suppliers: {len(SUPPLIER_DATA)}")
        print(f"  - Locations: {len(LOCATIONS_DATA)}")
        print(f"  - Items: {len(ITEM_NAMES)}")
        print(f"  - Supplier-Products: {sp_count}")
        print(f"  - Supplier-Locations: {sl_count}")
        print(f"  - Prices: {price_count}")
        print(f"  - Price History: {history_count}")
        print(f"  - Batches: {batch_count}")
        print(f"  - Stock Adjustments: {adjustment_count}")
        print(f"  - Alerts: {alert_count}")
        print(f"  - History: {history_entries}")
        print(f"\nYou can now start the application with sample data!")

    except Exception as e:
        print(f"\nERROR: Failed to generate sample data: {e}")
        sys.exit(1)

if __name__ == '__main__':
    generate_sample_data()
