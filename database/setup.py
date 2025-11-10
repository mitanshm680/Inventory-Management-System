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

            # Create suppliers table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS suppliers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    contact_person TEXT,
                    email TEXT,
                    phone TEXT,
                    address TEXT,
                    city TEXT,
                    state TEXT,
                    zip_code TEXT,
                    country TEXT DEFAULT 'USA',
                    website TEXT,
                    notes TEXT,
                    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
                    is_active INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create index on suppliers
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_suppliers_name
                ON suppliers(name)
            """)

            # Create index on suppliers active status
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_suppliers_active
                ON suppliers(is_active)
            """)

            # Create locations table (warehouses/storage locations)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    address TEXT,
                    city TEXT,
                    state TEXT,
                    zip_code TEXT,
                    country TEXT DEFAULT 'USA',
                    location_type TEXT CHECK(location_type IN ('warehouse', 'store', 'storage', 'distribution', 'other')) DEFAULT 'warehouse',
                    capacity INTEGER,
                    current_utilization INTEGER DEFAULT 0,
                    manager_name TEXT,
                    contact_phone TEXT,
                    contact_email TEXT,
                    is_active INTEGER DEFAULT 1,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create item_locations junction table (track items across locations)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS item_locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_name TEXT NOT NULL,
                    location_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
                    aisle TEXT,
                    shelf TEXT,
                    bin TEXT,
                    notes TEXT,
                    last_counted DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (item_name) REFERENCES items(item_name) ON DELETE CASCADE,
                    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
                    UNIQUE(item_name, location_id)
                )
            """)

            # Create batches table (for batch/lot tracking and expiry)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS batches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    batch_number TEXT UNIQUE NOT NULL,
                    item_name TEXT NOT NULL,
                    location_id INTEGER,
                    quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
                    manufacturing_date DATE,
                    expiry_date DATE,
                    received_date DATE DEFAULT CURRENT_DATE,
                    supplier_id INTEGER,
                    cost_per_unit REAL,
                    status TEXT CHECK(status IN ('active', 'expired', 'recalled', 'quarantined', 'sold_out')) DEFAULT 'active',
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (item_name) REFERENCES items(item_name) ON DELETE CASCADE,
                    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
                )
            """)

            # Create stock_adjustments table (manual inventory changes with reasons)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS stock_adjustments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_name TEXT NOT NULL,
                    location_id INTEGER,
                    batch_id INTEGER,
                    adjustment_type TEXT CHECK(adjustment_type IN ('increase', 'decrease')) NOT NULL,
                    quantity INTEGER NOT NULL CHECK(quantity > 0),
                    reason TEXT CHECK(reason IN (
                        'damaged', 'stolen', 'lost', 'expired', 'returned',
                        'found', 'correction', 'transfer', 'donation', 'sample', 'other'
                    )) NOT NULL,
                    reason_notes TEXT,
                    adjusted_by TEXT NOT NULL,
                    approved_by TEXT,
                    reference_number TEXT,
                    adjustment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (item_name) REFERENCES items(item_name) ON DELETE CASCADE,
                    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
                    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
                )
            """)

            # Create alerts table (for reorder and expiry notifications)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_type TEXT CHECK(alert_type IN (
                        'low_stock', 'reorder', 'expiring_soon', 'expired',
                        'overstock', 'location_full', 'batch_recall'
                    )) NOT NULL,
                    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
                    item_name TEXT,
                    location_id INTEGER,
                    batch_id INTEGER,
                    message TEXT NOT NULL,
                    is_read INTEGER DEFAULT 0,
                    is_resolved INTEGER DEFAULT 0,
                    resolved_by TEXT,
                    resolved_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (item_name) REFERENCES items(item_name) ON DELETE CASCADE,
                    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
                    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
                )
            """)

            # Add reorder_level and reorder_quantity to items table if not exists
            cursor.execute("""
                SELECT COUNT(*) FROM pragma_table_info('items')
                WHERE name='reorder_level'
            """)
            if cursor.fetchone()[0] == 0:
                cursor.execute("ALTER TABLE items ADD COLUMN reorder_level INTEGER DEFAULT 10")
                cursor.execute("ALTER TABLE items ADD COLUMN reorder_quantity INTEGER DEFAULT 50")
                logging.info("Added reorder_level and reorder_quantity columns to items table")

            # Create indexes for better performance
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_item_locations_item
                ON item_locations(item_name)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_item_locations_location
                ON item_locations(location_id)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_batches_item
                ON batches(item_name)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_batches_expiry
                ON batches(expiry_date)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_batches_status
                ON batches(status)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_stock_adjustments_item
                ON stock_adjustments(item_name)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_stock_adjustments_date
                ON stock_adjustments(adjustment_date DESC)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_alerts_unread
                ON alerts(is_read, is_resolved)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_alerts_type
                ON alerts(alert_type)
            """)

            # Create notes/comments table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_name TEXT NOT NULL,
                    note_text TEXT NOT NULL,
                    created_by TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_pinned INTEGER DEFAULT 0,
                    FOREIGN KEY (item_name) REFERENCES items(item_name) ON DELETE CASCADE
                )
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_notes_item
                ON notes(item_name, created_at DESC)
            """)

            # Create supplier_locations table (supplier proximity to locations)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS supplier_locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    supplier_id INTEGER NOT NULL,
                    location_id INTEGER NOT NULL,
                    distance_km REAL,
                    estimated_delivery_days INTEGER,
                    shipping_cost REAL DEFAULT 0,
                    is_preferred INTEGER DEFAULT 0,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
                    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
                    UNIQUE(supplier_id, location_id)
                )
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_supplier_locations_supplier
                ON supplier_locations(supplier_id)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_supplier_locations_location
                ON supplier_locations(location_id)
            """)

            # Create supplier_products table (products each supplier can supply with their prices)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS supplier_products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    supplier_id INTEGER NOT NULL,
                    item_name TEXT NOT NULL,
                    supplier_sku TEXT,
                    unit_price REAL NOT NULL CHECK(unit_price >= 0),
                    minimum_order_quantity INTEGER DEFAULT 1,
                    lead_time_days INTEGER,
                    is_available INTEGER DEFAULT 1,
                    last_price_update DATETIME DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
                    FOREIGN KEY (item_name) REFERENCES items(item_name) ON DELETE CASCADE,
                    UNIQUE(supplier_id, item_name)
                )
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier
                ON supplier_products(supplier_id)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_supplier_products_item
                ON supplier_products(item_name)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_supplier_products_price
                ON supplier_products(unit_price)
            """)

            # Create purchase_orders table (for managing purchase orders)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS purchase_orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_number TEXT UNIQUE NOT NULL,
                    supplier_id INTEGER NOT NULL,
                    location_id INTEGER,
                    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    expected_delivery_date DATE,
                    actual_delivery_date DATE,
                    status TEXT CHECK(status IN ('pending', 'confirmed', 'shipped', 'received', 'cancelled')) DEFAULT 'pending',
                    total_amount REAL NOT NULL CHECK(total_amount >= 0),
                    shipping_cost REAL DEFAULT 0,
                    tax_amount REAL DEFAULT 0,
                    notes TEXT,
                    created_by TEXT NOT NULL,
                    approved_by TEXT,
                    received_by TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
                    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
                )
            """)

            # Create purchase_order_items table (line items for each purchase order)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS purchase_order_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    po_id INTEGER NOT NULL,
                    item_name TEXT NOT NULL,
                    quantity INTEGER NOT NULL CHECK(quantity > 0),
                    unit_price REAL NOT NULL CHECK(unit_price >= 0),
                    total_price REAL NOT NULL CHECK(total_price >= 0),
                    received_quantity INTEGER DEFAULT 0 CHECK(received_quantity >= 0),
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (item_name) REFERENCES items(item_name) ON DELETE RESTRICT
                )
            """)

            # Create indexes for purchase orders
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier
                ON purchase_orders(supplier_id)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
                ON purchase_orders(status)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_purchase_orders_date
                ON purchase_orders(order_date DESC)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po
                ON purchase_order_items(po_id)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_purchase_order_items_item
                ON purchase_order_items(item_name)
            """)

            # Create audit_log table (for tracking all important actions)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action_type TEXT NOT NULL CHECK(action_type IN (
                        'create', 'update', 'delete', 'login', 'logout',
                        'export', 'import', 'approve', 'reject', 'transfer', 'adjust'
                    )),
                    entity_type TEXT NOT NULL,
                    entity_id TEXT,
                    entity_name TEXT,
                    user_name TEXT NOT NULL,
                    user_role TEXT,
                    description TEXT,
                    old_values TEXT,
                    new_values TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    success INTEGER DEFAULT 1,
                    error_message TEXT
                )
            """)

            # Create indexes for audit_log
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_log_user
                ON audit_log(user_name)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
                ON audit_log(timestamp DESC)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_log_entity
                ON audit_log(entity_type, entity_id)
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_log_action
                ON audit_log(action_type)
            """)

            # Add coordinates to locations for distance calculations
            cursor.execute("""
                SELECT COUNT(*) FROM pragma_table_info('locations')
                WHERE name='latitude'
            """)
            if cursor.fetchone()[0] == 0:
                cursor.execute("ALTER TABLE locations ADD COLUMN latitude REAL")
                cursor.execute("ALTER TABLE locations ADD COLUMN longitude REAL")
                logging.info("Added latitude/longitude columns to locations table")

            # Add coordinates to suppliers for distance calculations
            cursor.execute("""
                SELECT COUNT(*) FROM pragma_table_info('suppliers')
                WHERE name='latitude'
            """)
            if cursor.fetchone()[0] == 0:
                cursor.execute("ALTER TABLE suppliers ADD COLUMN latitude REAL")
                cursor.execute("ALTER TABLE suppliers ADD COLUMN longitude REAL")
                cursor.execute("ALTER TABLE suppliers ADD COLUMN lead_time_days INTEGER DEFAULT 7")
                cursor.execute("ALTER TABLE suppliers ADD COLUMN minimum_order_value REAL DEFAULT 0")
                cursor.execute("ALTER TABLE suppliers ADD COLUMN payment_terms TEXT")
                logging.info("Added coordinates and additional fields to suppliers table")

            logging.info("Database tables and indexes created successfully")
    except Exception as e:
        logging.error(f"Error setting up database: {e}")
        raise


def initialize_database():
    """Initialize the database with required tables."""
    setup_database() 