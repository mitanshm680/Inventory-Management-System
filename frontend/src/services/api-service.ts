import api from '../utils/api';
import { 
  InventoryItem, 
  User, 
  Group, 
  PriceRecord, 
  Supplier, 
  ApiResponse, 
  DashboardStats 
} from '../types';

/**
 * Inventory API service
 */
export const inventoryService = {
  /**
   * Get all inventory items
   */
  getItems: async (): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>('/inventory');
    return response.data;
  },

  /**
   * Get inventory item by ID
   */
  getItemById: async (id: number): Promise<InventoryItem> => {
    const response = await api.get<InventoryItem>(`/inventory/${id}`);
    return response.data;
  },

  /**
   * Create a new inventory item
   */
  createItem: async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
    const response = await api.post<InventoryItem>('/inventory', item);
    return response.data;
  },

  /**
   * Update an inventory item
   */
  updateItem: async (id: number, item: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await api.put<InventoryItem>(`/inventory/${id}`, item);
    return response.data;
  },

  /**
   * Delete an inventory item
   */
  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  }
};

/**
 * Users API service
 */
export const userService = {
  /**
   * Get all users
   */
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Create a new user
   */
  createUser: async (user: Omit<User, 'id' | 'created_at'>): Promise<User> => {
    const response = await api.post<User>('/users', user);
    return response.data;
  },

  /**
   * Update a user
   */
  updateUser: async (id: number, user: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, user);
    return response.data;
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};

/**
 * Groups API service
 */
export const groupService = {
  /**
   * Get all groups
   */
  getGroups: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/groups');
    return response.data;
  },

  /**
   * Get group by ID
   */
  getGroupById: async (id: number): Promise<Group> => {
    const response = await api.get<Group>(`/groups/${id}`);
    return response.data;
  },

  /**
   * Create a new group
   */
  createGroup: async (group: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> => {
    const response = await api.post<Group>('/groups', group);
    return response.data;
  },

  /**
   * Update a group
   */
  updateGroup: async (id: number, group: Partial<Group>): Promise<Group> => {
    const response = await api.put<Group>(`/groups/${id}`, group);
    return response.data;
  },

  /**
   * Delete a group
   */
  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/groups/${id}`);
  }
};

/**
 * Dashboard API service
 */
export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  }
};

/**
 * Prices API service
 */
export const priceService = {
  /**
   * Get all price records
   */
  getPrices: async (): Promise<PriceRecord[]> => {
    const response = await api.get<PriceRecord[]>('/prices');
    return response.data;
  },

  /**
   * Get price records for an item
   */
  getPricesForItem: async (itemId: number): Promise<PriceRecord[]> => {
    const response = await api.get<PriceRecord[]>(`/prices/item/${itemId}`);
    return response.data;
  },

  /**
   * Create a new price record
   */
  createPrice: async (price: Omit<PriceRecord, 'id' | 'created_at'>): Promise<PriceRecord> => {
    const response = await api.post<PriceRecord>('/prices', price);
    return response.data;
  }
};

/**
 * Suppliers API service
 */
export const supplierService = {
  /**
   * Get all suppliers
   */
  getSuppliers: async (): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>('/suppliers');
    return response.data;
  },

  /**
   * Get supplier by ID
   */
  getSupplierById: async (id: number): Promise<Supplier> => {
    const response = await api.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  /**
   * Create a new supplier
   */
  createSupplier: async (supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> => {
    const response = await api.post<Supplier>('/suppliers', supplier);
    return response.data;
  },

  /**
   * Update a supplier
   */
  updateSupplier: async (id: number, supplier: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.put<Supplier>(`/suppliers/${id}`, supplier);
    return response.data;
  },

  /**
   * Delete a supplier
   */
  deleteSupplier: async (id: number): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  }
}; 