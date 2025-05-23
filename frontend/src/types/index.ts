export interface User {
  username: string;
  role: 'admin' | 'editor' | 'viewer';
  name?: string;
  email?: string;
  id?: number;
  created_at?: string;
  last_login?: string;
}

export interface InventoryItem {
  id?: number;
  item_name: string;
  quantity: number;
  group?: string;
  custom_fields?: Record<string, any>;
  reorder_point?: number;
  created_at: string;
  updated_at?: string;
  
  // Maintain compatibility with frontend display fields
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  supplier_id?: number;
  location?: string;
  image_url?: string;
}

export interface PriceRecord {
  id: number;
  item_id: number;
  price: number;
  start_date: string;
  end_date: string | null;
  created_by: number;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  total_items: number;
  low_stock_items: number;
  total_value: number;
  recent_transactions: Transaction[];
}

export interface Transaction {
  id: number;
  type: 'in' | 'out';
  quantity: number;
  item_id: number;
  item_name: string;
  user_id: number;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
} 