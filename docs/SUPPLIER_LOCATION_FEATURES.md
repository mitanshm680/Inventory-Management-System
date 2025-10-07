# Supplier-Location Advanced Features

## Overview

The system now supports advanced supplier-product and supplier-location relationships to help you:
- Track which suppliers can provide which products at what prices
- See all suppliers for a product and compare prices
- Manage supplier proximity to your locations
- Calculate shipping costs and delivery times
- Find the best price considering location and shipping

---

## 📦 Supplier-Product Relationships

### What It Does
- A **product can be supplied by multiple suppliers** at different prices
- Each **supplier can supply multiple products**
- Track supplier-specific SKUs, minimum order quantities, and lead times
- Compare prices across suppliers for the same item

### Database Schema

**Table: `supplier_products`**
- Links suppliers to products they can supply
- Stores pricing, availability, and lead times
- Tracks last price update timestamps

### API Endpoints

#### Get All Products from a Supplier
```
GET /supplier-products/{supplier_id}
```
Returns all products this supplier offers with their prices.

**Response:**
```json
[
  {
    "id": 1,
    "item_name": "Laptop Dell XPS",
    "supplier_sku": "DELL-XPS-13-001",
    "unit_price": 1299.99,
    "minimum_order_quantity": 5,
    "lead_time_days": 7,
    "is_available": true,
    "current_stock": 50,
    "group_name": "Electronics",
    "last_price_update": "2025-10-07T10:00:00",
    "notes": "Bulk discount available"
  }
]
```

#### Get All Suppliers for an Item
```
GET /item-suppliers/{item_name}
```
Returns all suppliers who can supply this item, sorted by price (cheapest first).

**Response:**
```json
[
  {
    "id": 1,
    "supplier_id": 3,
    "supplier_name": "Tech Distributors Inc",
    "supplier_sku": "DELL-XPS-13-001",
    "unit_price": 1299.99,
    "minimum_order_quantity": 5,
    "lead_time_days": 7,
    "is_available": true,
    "rating": 5,
    "email": "sales@techdist.com",
    "phone": "555-1234",
    "supplier_active": true,
    "last_price_update": "2025-10-07T10:00:00",
    "notes": null
  },
  {
    "supplier_id": 5,
    "supplier_name": "Global Electronics Supply",
    "unit_price": 1350.00,
    ...
  }
]
```

#### Add Product to Supplier Catalog
```
POST /supplier-products
```

**Request Body:**
```json
{
  "supplier_id": 3,
  "item_name": "Laptop Dell XPS",
  "supplier_sku": "DELL-XPS-13-001",
  "unit_price": 1299.99,
  "minimum_order_quantity": 5,
  "lead_time_days": 7,
  "is_available": true,
  "notes": "Bulk discount available for 50+ units"
}
```

#### Update Supplier Product
```
PUT /supplier-products/{id}
```

#### Delete Supplier Product
```
DELETE /supplier-products/{id}
```

### Use Cases

**1. Price Comparison**
- View all suppliers for "Office Chair" sorted by price
- Choose the cheapest or best-rated supplier
- Consider minimum order quantities

**2. Supplier Catalog Management**
- Add new products to a supplier's catalog
- Update prices when suppliers send new price lists
- Mark products as unavailable when out of stock

**3. Bulk Ordering**
- Check minimum order quantities across suppliers
- Calculate total cost for bulk orders
- Find suppliers with better pricing for larger quantities

---

## 🗺️ Supplier-Location Relationships

### What It Does
- Track **which suppliers can deliver to which locations**
- Store **distance** between supplier and location
- Track **shipping costs** and **estimated delivery days**
- Mark **preferred suppliers** for each location
- Find the best supplier considering both price AND shipping

### Database Schema

**Table: `supplier_locations`**
- Links suppliers to locations they can deliver to
- Stores distance, delivery time, and shipping costs
- Allows marking preferred supplier-location combinations

### API Endpoints

#### Get Locations a Supplier Delivers To
```
GET /supplier-locations/{supplier_id}
```
Returns all locations this supplier can deliver to.

**Response:**
```json
[
  {
    "id": 1,
    "location_id": 2,
    "location_name": "Main Warehouse",
    "city": "New York",
    "state": "NY",
    "location_type": "warehouse",
    "distance_km": 50.5,
    "estimated_delivery_days": 2,
    "shipping_cost": 25.00,
    "is_preferred": true,
    "notes": "Next-day delivery available for orders > $500"
  }
]
```

#### Get Suppliers for a Location
```
GET /location-suppliers/{location_id}
```
Returns all suppliers that deliver to this location, sorted by distance.

**Response:**
```json
[
  {
    "id": 1,
    "supplier_id": 3,
    "supplier_name": "Local Office Supply",
    "rating": 5,
    "email": "sales@localoffice.com",
    "phone": "555-1234",
    "is_active": true,
    "distance_km": 15.2,
    "estimated_delivery_days": 1,
    "shipping_cost": 10.00,
    "is_preferred": true,
    "payment_terms": "Net 30",
    "notes": "Free delivery for orders > $100"
  }
]
```

#### Create Supplier-Location Link
```
POST /supplier-locations
```

**Request Body:**
```json
{
  "supplier_id": 3,
  "location_id": 2,
  "distance_km": 50.5,
  "estimated_delivery_days": 2,
  "shipping_cost": 25.00,
  "is_preferred": false,
  "notes": "Next-day delivery available"
}
```

#### Update Supplier-Location
```
PUT /supplier-locations/{id}
```

#### Delete Supplier-Location
```
DELETE /supplier-locations/{id}
```

### Use Cases

**1. Proximity-Based Ordering**
- Find nearest suppliers to a warehouse
- Reduce shipping costs by choosing local suppliers
- Faster delivery times from nearby suppliers

**2. Shipping Cost Optimization**
- Compare total cost (item price + shipping)
- Choose between cheap item with high shipping vs expensive item with low shipping
- Track shipping costs for budgeting

**3. Multi-Location Management**
- Different suppliers for different warehouses
- Mark preferred suppliers for each location
- Optimize delivery routes

---

## 🏆 Best Price Finder

### The Smart Feature

```
GET /best-price/{item_name}?location_id={location_id}
```

Finds the best price for an item, considering:
- Item price from each supplier
- Shipping cost to the location (if location_id provided)
- Supplier availability and rating
- **Total cost** = unit_price + shipping_cost

**Without Location:**
```json
GET /best-price/Office%20Chair

{
  "item_name": "Office Chair",
  "supplier_id": 3,
  "supplier_name": "Furniture Wholesalers",
  "unit_price": 149.99,
  "rating": 4,
  "lead_time_days": 5,
  "minimum_order_quantity": 1
}
```

**With Location:**
```json
GET /best-price/Office%20Chair?location_id=2

{
  "item_name": "Office Chair",
  "supplier_id": 5,
  "supplier_name": "Local Furniture Co",
  "unit_price": 159.99,
  "shipping_cost": 5.00,
  "total_cost": 164.99,
  "distance_km": 12.5,
  "estimated_delivery_days": 1,
  "rating": 5,
  "lead_time_days": 3,
  "minimum_order_quantity": 1
}
```

### Why It's Powerful

**Scenario:** You need to order "Office Chair" to "Main Warehouse"

**Option 1:**
- Supplier A: $149.99 + $50 shipping = **$199.99**
- Distance: 500 km
- Delivery: 7 days

**Option 2:**
- Supplier B: $159.99 + $5 shipping = **$164.99** ✓ BEST
- Distance: 12 km
- Delivery: 1 day

The API automatically finds **Option 2** because it considers total cost!

---

## 💡 Practical Examples

### Example 1: Multi-Supplier Price Comparison

```python
# Get all suppliers for "Laptop Dell XPS"
GET /item-suppliers/Laptop%20Dell%20XPS

# Response shows 3 suppliers:
# 1. TechDist: $1299.99 (Min order: 5)
# 2. GlobalElec: $1350.00 (Min order: 1)
# 3. BulkTech: $1199.99 (Min order: 50)

# For small order (1 unit): Choose GlobalElec
# For bulk order (50+ units): Choose BulkTech (save $100/unit!)
```

### Example 2: Location-Based Ordering

```python
# Warehouse in New York needs "Office Supplies"
GET /location-suppliers/2  # New York warehouse ID

# Shows suppliers sorted by distance:
# 1. Local Office Supply (15 km, $10 shipping, 1 day)
# 2. Regional Wholesaler (100 km, $35 shipping, 2 days)
# 3. National Distributor (800 km, $75 shipping, 5 days)

# For urgent orders: Use #1 (faster, cheaper shipping)
# For bulk orders: Use #3 (better unit prices despite shipping)
```

### Example 3: Best Price with Shipping

```python
# Find best total price for "Printer" to deliver to Boston warehouse
GET /best-price/Printer?location_id=5

# API calculates:
# Supplier A: $299 + $50 = $349
# Supplier B: $320 + $10 = $330 ✓ Best total
# Supplier C: $280 + $80 = $360

# Returns Supplier B even though not cheapest unit price
```

---

## 🔧 Setup Guide

### Step 1: Add Suppliers
Use existing `/suppliers` endpoints to add suppliers with coordinates:
```json
POST /suppliers
{
  "name": "Tech Distributors Inc",
  "email": "sales@techdist.com",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "lead_time_days": 7,
  "payment_terms": "Net 30"
}
```

### Step 2: Link Suppliers to Products
```json
POST /supplier-products
{
  "supplier_id": 3,
  "item_name": "Laptop Dell XPS",
  "supplier_sku": "DELL-001",
  "unit_price": 1299.99,
  "minimum_order_quantity": 5,
  "lead_time_days": 7
}
```

### Step 3: Link Suppliers to Locations
```json
POST /supplier-locations
{
  "supplier_id": 3,
  "location_id": 2,
  "distance_km": 50.5,
  "estimated_delivery_days": 2,
  "shipping_cost": 25.00
}
```

### Step 4: Find Best Prices
```
GET /best-price/Laptop%20Dell%20XPS?location_id=2
```

---

## 📊 Benefits by Industry

### **Retail Stores**
- Compare supplier prices before ordering
- Find local suppliers for faster restocking
- Reduce shipping costs with proximity-based ordering

### **Warehouses**
- Optimize supplier selection per location
- Track shipping costs for budget planning
- Preferred suppliers for each warehouse

### **Manufacturing**
- Multiple suppliers for critical components
- Compare lead times and minimum orders
- Backup suppliers for supply chain resilience

### **E-commerce**
- Multi-supplier inventory sourcing
- Dropshipping with supplier proximity to customers
- Dynamic pricing based on supplier costs

### **Restaurants**
- Multiple food suppliers per location
- Compare fresh produce suppliers by distance
- Track delivery times for perishables

---

## 🎯 Advanced Use Cases

### Dynamic Reordering
When stock is low, automatically suggest best supplier considering:
- Current price
- Availability
- Distance to location
- Minimum order quantity
- Lead time

### Supplier Performance Tracking
- Track which suppliers deliver fastest
- Monitor price changes over time
- Rate suppliers based on quality and reliability

### Multi-Location Optimization
- Central purchasing team sees all supplier-location relationships
- Optimize orders across multiple warehouses
- Consolidate shipments to reduce costs

---

## 🚀 Future Enhancements

- **Automatic distance calculation** from coordinates
- **Price history tracking** per supplier-product
- **Supplier scorecards** (price, delivery, quality)
- **Order history** per supplier
- **Bulk import** of supplier catalogs
- **Price alerts** when suppliers change prices
- **Contract management** with expiry dates

---

## 📝 API Summary

### Supplier-Product Endpoints
- `GET /supplier-products/{supplier_id}` - Products from supplier
- `GET /item-suppliers/{item_name}` - Suppliers for item
- `POST /supplier-products` - Add product to supplier
- `PUT /supplier-products/{id}` - Update product info
- `DELETE /supplier-products/{id}` - Remove product

### Supplier-Location Endpoints
- `GET /supplier-locations/{supplier_id}` - Locations supplier delivers to
- `GET /location-suppliers/{location_id}` - Suppliers for location
- `POST /supplier-locations` - Link supplier to location
- `PUT /supplier-locations/{id}` - Update relationship
- `DELETE /supplier-locations/{id}` - Remove relationship

### Smart Features
- `GET /best-price/{item_name}?location_id={id}` - Best total price

---

**Last Updated**: 2025-10-07
**Version**: 2.0.0 with Supplier-Location Features
