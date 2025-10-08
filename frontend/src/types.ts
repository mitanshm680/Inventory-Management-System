export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
    username: string;
    role: UserRole;
    name?: string;
    email?: string;
    last_login?: string;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface UserResponse {
    username: string;
    role: string;
}

export interface Group {
    id?: string;
    group_name: string;
    name?: string;
    description?: string;
    created_at?: string;
}

export interface InventoryItem {
    item_name: string;
    name?: string;
    quantity: number;
    group?: string;
    group_name?: string;
    category?: string;
    reorder_point?: number;
    created_at?: string;
    updated_at?: string;
    custom_fields?: Record<string, any>;
    location_id?: number;
    location_name?: string;
}

export interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
    }>;
} 