import * as Yup from 'yup';

// Inventory Item Validation Schema
export const inventoryItemSchema = Yup.object().shape({
  item_name: Yup.string()
    .required('Item name is required')
    .min(2, 'Item name must be at least 2 characters')
    .max(100, 'Item name must not exceed 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/, 'Item name can only contain letters, numbers, spaces, hyphens, and underscores'),

  quantity: Yup.number()
    .required('Quantity is required')
    .min(0, 'Quantity cannot be negative')
    .integer('Quantity must be a whole number')
    .typeError('Quantity must be a number'),

  group_name: Yup.string()
    .nullable()
    .max(50, 'Group name must not exceed 50 characters'),

  reorder_point: Yup.number()
    .nullable()
    .min(0, 'Reorder point cannot be negative')
    .integer('Reorder point must be a whole number')
    .typeError('Reorder point must be a number'),

  unit: Yup.string()
    .nullable()
    .max(20, 'Unit must not exceed 20 characters'),

  location: Yup.string()
    .nullable()
    .max(100, 'Location must not exceed 100 characters'),

  description: Yup.string()
    .nullable()
    .max(500, 'Description must not exceed 500 characters'),
});

// Supplier Validation Schema
export const supplierSchema = Yup.object().shape({
  name: Yup.string()
    .required('Supplier name is required')
    .min(2, 'Supplier name must be at least 2 characters')
    .max(100, 'Supplier name must not exceed 100 characters'),

  contact_person: Yup.string()
    .nullable()
    .max(100, 'Contact person must not exceed 100 characters'),

  email: Yup.string()
    .nullable()
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters'),

  phone: Yup.string()
    .nullable()
    .matches(/^[\d\s\-\+\(\)]+$/, 'Phone number can only contain digits, spaces, hyphens, plus signs, and parentheses')
    .max(20, 'Phone number must not exceed 20 characters'),

  address: Yup.string()
    .nullable()
    .max(200, 'Address must not exceed 200 characters'),

  city: Yup.string()
    .nullable()
    .max(50, 'City must not exceed 50 characters'),

  state: Yup.string()
    .nullable()
    .max(50, 'State must not exceed 50 characters'),

  zip_code: Yup.string()
    .nullable()
    .matches(/^[\d\-\s]+$/, 'ZIP code can only contain digits, hyphens, and spaces')
    .max(10, 'ZIP code must not exceed 10 characters'),

  country: Yup.string()
    .nullable()
    .max(50, 'Country must not exceed 50 characters'),

  website: Yup.string()
    .nullable()
    .url('Invalid URL format')
    .max(200, 'Website URL must not exceed 200 characters'),

  rating: Yup.number()
    .nullable()
    .min(0, 'Rating cannot be negative')
    .max(5, 'Rating cannot exceed 5')
    .typeError('Rating must be a number'),
});

// Location Validation Schema
export const locationSchema = Yup.object().shape({
  name: Yup.string()
    .required('Location name is required')
    .min(2, 'Location name must be at least 2 characters')
    .max(100, 'Location name must not exceed 100 characters'),

  address: Yup.string()
    .nullable()
    .max(200, 'Address must not exceed 200 characters'),

  city: Yup.string()
    .nullable()
    .max(50, 'City must not exceed 50 characters'),

  state: Yup.string()
    .nullable()
    .max(50, 'State must not exceed 50 characters'),

  zip_code: Yup.string()
    .nullable()
    .matches(/^[\d\-\s]+$/, 'ZIP code can only contain digits, hyphens, and spaces')
    .max(10, 'ZIP code must not exceed 10 characters'),

  country: Yup.string()
    .nullable()
    .max(50, 'Country must not exceed 50 characters'),

  location_type: Yup.string()
    .nullable()
    .oneOf(['warehouse', 'store', 'storage', 'distribution', 'other'], 'Invalid location type'),

  capacity: Yup.number()
    .nullable()
    .min(0, 'Capacity cannot be negative')
    .typeError('Capacity must be a number'),

  current_utilization: Yup.number()
    .nullable()
    .min(0, 'Utilization cannot be negative')
    .typeError('Utilization must be a number'),

  manager_name: Yup.string()
    .nullable()
    .max(100, 'Manager name must not exceed 100 characters'),

  contact_phone: Yup.string()
    .nullable()
    .matches(/^[\d\s\-\+\(\)]+$/, 'Phone number can only contain digits, spaces, hyphens, plus signs, and parentheses')
    .max(20, 'Phone number must not exceed 20 characters'),

  contact_email: Yup.string()
    .nullable()
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters'),
});

// Batch Validation Schema
export const batchSchema = Yup.object().shape({
  batch_number: Yup.string()
    .required('Batch number is required')
    .min(2, 'Batch number must be at least 2 characters')
    .max(50, 'Batch number must not exceed 50 characters'),

  item_name: Yup.string()
    .required('Item name is required'),

  location_id: Yup.number()
    .nullable()
    .positive('Location ID must be positive')
    .integer('Location ID must be a whole number')
    .typeError('Location ID must be a number'),

  quantity: Yup.number()
    .required('Quantity is required')
    .min(0, 'Quantity cannot be negative')
    .integer('Quantity must be a whole number')
    .typeError('Quantity must be a number'),

  manufacturing_date: Yup.date()
    .nullable()
    .max(new Date(), 'Manufacturing date cannot be in the future')
    .typeError('Invalid date format'),

  expiry_date: Yup.date()
    .nullable()
    .min(Yup.ref('manufacturing_date'), 'Expiry date must be after manufacturing date')
    .typeError('Invalid date format'),

  received_date: Yup.date()
    .nullable()
    .max(new Date(), 'Received date cannot be in the future')
    .typeError('Invalid date format'),

  supplier_id: Yup.number()
    .nullable()
    .positive('Supplier ID must be positive')
    .integer('Supplier ID must be a whole number')
    .typeError('Supplier ID must be a number'),

  cost_per_unit: Yup.number()
    .nullable()
    .min(0, 'Cost per unit cannot be negative')
    .typeError('Cost per unit must be a number'),

  status: Yup.string()
    .required('Status is required')
    .oneOf(['active', 'expired', 'recalled', 'quarantined', 'sold_out'], 'Invalid status'),
});

// User Validation Schema
export const userSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  password: Yup.string()
    .when('$isNewUser', {
      is: true,
      then: (schema) => schema.required('Password is required')
        .min(4, 'Password must be at least 4 characters')
        .max(100, 'Password must not exceed 100 characters'),
      otherwise: (schema) => schema.nullable(),
    }),

  role: Yup.string()
    .required('Role is required')
    .oneOf(['admin', 'editor', 'viewer'], 'Invalid role'),
});

// Password Change Validation Schema
export const passwordChangeSchema = Yup.object().shape({
  old_password: Yup.string()
    .required('Current password is required'),

  new_password: Yup.string()
    .required('New password is required')
    .min(4, 'Password must be at least 4 characters')
    .max(100, 'Password must not exceed 100 characters')
    .notOneOf([Yup.ref('old_password')], 'New password must be different from current password'),

  confirm_password: Yup.string()
    .required('Please confirm your new password')
    .oneOf([Yup.ref('new_password')], 'Passwords must match'),
});

// Stock Adjustment Validation Schema
export const stockAdjustmentSchema = Yup.object().shape({
  item_name: Yup.string()
    .required('Item name is required'),

  adjustment_type: Yup.string()
    .required('Adjustment type is required')
    .oneOf(['addition', 'subtraction'], 'Invalid adjustment type'),

  quantity: Yup.number()
    .required('Quantity is required')
    .positive('Quantity must be positive')
    .integer('Quantity must be a whole number')
    .typeError('Quantity must be a number'),

  reason: Yup.string()
    .required('Reason is required')
    .oneOf(
      ['damaged', 'stolen', 'lost', 'expired', 'returned', 'found', 'correction', 'transfer', 'donation', 'sample', 'other'],
      'Invalid reason'
    ),

  location_id: Yup.number()
    .nullable()
    .positive('Location ID must be positive')
    .integer('Location ID must be a whole number')
    .typeError('Location ID must be a number'),

  batch_id: Yup.number()
    .nullable()
    .positive('Batch ID must be positive')
    .integer('Batch ID must be a whole number')
    .typeError('Batch ID must be a number'),

  reference_number: Yup.string()
    .nullable()
    .max(50, 'Reference number must not exceed 50 characters'),

  notes: Yup.string()
    .nullable()
    .max(500, 'Notes must not exceed 500 characters'),
});

// Price Validation Schema
export const priceSchema = Yup.object().shape({
  item_name: Yup.string()
    .required('Item name is required'),

  supplier_name: Yup.string()
    .required('Supplier name is required'),

  price: Yup.number()
    .required('Price is required')
    .min(0, 'Price cannot be negative')
    .typeError('Price must be a number'),

  effective_date: Yup.date()
    .nullable()
    .max(new Date(), 'Effective date cannot be in the future')
    .typeError('Invalid date format'),
});

// Supplier Product Validation Schema
export const supplierProductSchema = Yup.object().shape({
  supplier_id: Yup.number()
    .required('Supplier is required')
    .positive('Invalid supplier')
    .integer('Invalid supplier')
    .typeError('Supplier must be selected'),

  item_name: Yup.string()
    .required('Item name is required'),

  supplier_sku: Yup.string()
    .nullable()
    .max(50, 'SKU must not exceed 50 characters'),

  unit_price: Yup.number()
    .required('Unit price is required')
    .min(0, 'Unit price cannot be negative')
    .typeError('Unit price must be a number'),

  minimum_order_quantity: Yup.number()
    .nullable()
    .min(1, 'Minimum order quantity must be at least 1')
    .integer('Minimum order quantity must be a whole number')
    .typeError('Minimum order quantity must be a number'),

  lead_time_days: Yup.number()
    .nullable()
    .min(0, 'Lead time cannot be negative')
    .integer('Lead time must be a whole number')
    .typeError('Lead time must be a number'),
});

// Login Validation Schema
export const loginSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),

  password: Yup.string()
    .required('Password is required')
    .min(4, 'Password must be at least 4 characters'),
});

// Group Validation Schema
export const groupSchema = Yup.object().shape({
  name: Yup.string()
    .required('Group name is required')
    .min(2, 'Group name must be at least 2 characters')
    .max(50, 'Group name must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/, 'Group name can only contain letters, numbers, spaces, hyphens, and underscores'),

  description: Yup.string()
    .nullable()
    .max(200, 'Description must not exceed 200 characters'),
});

// Note Validation Schema
export const noteSchema = Yup.object().shape({
  item_name: Yup.string()
    .required('Item name is required'),

  note_text: Yup.string()
    .required('Note text is required')
    .min(1, 'Note cannot be empty')
    .max(1000, 'Note must not exceed 1000 characters'),

  is_pinned: Yup.boolean(),
});

// Helper function to get error message
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.detail) {
    if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map((e: any) => e.msg).join(', ');
    }
  }
  return error.message || 'An error occurred';
};

export default {
  inventoryItemSchema,
  supplierSchema,
  locationSchema,
  batchSchema,
  userSchema,
  passwordChangeSchema,
  stockAdjustmentSchema,
  priceSchema,
  supplierProductSchema,
  loginSchema,
  groupSchema,
  noteSchema,
  getErrorMessage,
};
