import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, AUTH_CONFIG } from '../config';

export class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            headers: API_CONFIG.DEFAULT_HEADERS,
            timeout: API_CONFIG.TIMEOUT
        });

        // Add request interceptor for authentication
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Handle unauthorized access
                    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
                    localStorage.removeItem(AUTH_CONFIG.ROLE_KEY);
                    localStorage.removeItem(AUTH_CONFIG.USERNAME_KEY);
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // Authentication
    async login(username: string, password: string): Promise<any> {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await this.api.post(API_CONFIG.ENDPOINTS.LOGIN, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        if (response.data.access_token) {
            localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.access_token);
            // Get user info after login
            const userInfo = await this.getCurrentUser();
            localStorage.setItem(AUTH_CONFIG.ROLE_KEY, userInfo.role);
            localStorage.setItem(AUTH_CONFIG.USERNAME_KEY, userInfo.username);
        }
        return response.data;
    }

    async getCurrentUser(): Promise<any> {
        const response = await this.api.get(`${API_CONFIG.ENDPOINTS.USERS}/me`);
        return response.data;
    }

    async changePassword(oldPassword: string, newPassword: string): Promise<any> {
        const response = await this.api.post(`${API_CONFIG.ENDPOINTS.USERS}/me/change-password`, {
            old_password: oldPassword,
            new_password: newPassword
        });
        return response.data;
    }

    // Users
    async getUsers(): Promise<any> {
        const response = await this.api.get(API_CONFIG.ENDPOINTS.USERS);
        return response.data;
    }

    async createUser(userData: any): Promise<any> {
        const response = await this.api.post(API_CONFIG.ENDPOINTS.USERS, userData);
        return response.data;
    }

    async updateUser(username: string, updates: any): Promise<any> {
        const response = await this.api.put(`${API_CONFIG.ENDPOINTS.USERS}/${username}`, updates);
        return response.data;
    }

    async deleteUser(username: string): Promise<any> {
        const response = await this.api.delete(`${API_CONFIG.ENDPOINTS.USERS}/${username}`);
        return response.data;
    }

    // Groups
    async getGroups(): Promise<any> {
        const response = await this.api.get(API_CONFIG.ENDPOINTS.GROUPS);
        return response.data;
    }

    async createGroup(group: any): Promise<any> {
        const response = await this.api.post(API_CONFIG.ENDPOINTS.GROUPS, group);
        return response.data;
    }

    async updateGroup(oldName: string, newName: string): Promise<any> {
        const response = await this.api.put(
            `${API_CONFIG.ENDPOINTS.GROUPS}/${encodeURIComponent(oldName)}`,
            { new_name: newName }
        );
        return response.data;
    }

    async deleteGroup(groupName: string): Promise<any> {
        const response = await this.api.delete(`${API_CONFIG.ENDPOINTS.GROUPS}/${groupName}`);
        return response.data;
    }

    // Inventory
    async getInventory(groups?: string[]): Promise<any> {
        const params = groups ? { groups: groups.join(',') } : {};
        const response = await this.api.get(API_CONFIG.ENDPOINTS.INVENTORY, { params });
        return response.data;
    }

    async addItem(item: any): Promise<any> {
        const response = await this.api.post(API_CONFIG.ENDPOINTS.INVENTORY, item);
        return response.data;
    }

    async updateItem(itemName: string, updates: any): Promise<any> {
        const response = await this.api.put(
            `${API_CONFIG.ENDPOINTS.INVENTORY}/${itemName}`,
            updates
        );
        return response.data;
    }

    async deleteItem(itemName: string): Promise<any> {
        const response = await this.api.delete(
            `${API_CONFIG.ENDPOINTS.INVENTORY}/${itemName}`
        );
        return response.data;
    }

    async searchInventory(searchTerm: string, searchType: string = 'contains'): Promise<any> {
        const response = await this.api.post(`${API_CONFIG.ENDPOINTS.INVENTORY}/search`, {
            search_term: searchTerm,
            search_type: searchType
        });
        return response.data;
    }

    // Prices
    async getPrices(itemName?: string): Promise<any> {
        const url = itemName
            ? `${API_CONFIG.ENDPOINTS.PRICES}/${itemName}`
            : API_CONFIG.ENDPOINTS.PRICES;
        const response = await this.api.get(url);
        return response.data;
    }

    async updatePrice(itemName: string, priceData: any): Promise<any> {
        const response = await this.api.put(
            `${API_CONFIG.ENDPOINTS.PRICES}/${itemName}`,
            priceData
        );
        return response.data;
    }

    async getCheapestPrice(itemName: string): Promise<any> {
        const response = await this.api.get(`${API_CONFIG.ENDPOINTS.PRICES}/${itemName}/cheapest`);
        return response.data;
    }

    async getPriceHistory(itemName: string): Promise<any> {
        const response = await this.api.get(`${API_CONFIG.ENDPOINTS.PRICES}/${itemName}/history`);
        return response.data;
    }

    async deletePrice(itemName: string, supplier: string): Promise<any> {
        const response = await this.api.delete(`${API_CONFIG.ENDPOINTS.PRICES}/${itemName}?supplier=${supplier}`);
        return response.data;
    }

    async deleteAllPrices(itemName: string): Promise<any> {
        const response = await this.api.delete(`${API_CONFIG.ENDPOINTS.PRICES}/${itemName}`);
        return response.data;
    }

    async comparePrices(): Promise<any> {
        const response = await this.api.get(`${API_CONFIG.ENDPOINTS.PRICES}/compare/all`);
        return response.data;
    }

    // Suppliers
    async getSuppliers(activeOnly: boolean = false): Promise<any> {
        const params = activeOnly ? { active_only: true } : {};
        const response = await this.api.get('/suppliers', { params });
        return response.data;
    }

    async getSupplier(supplierId: number): Promise<any> {
        const response = await this.api.get(`/suppliers/${supplierId}`);
        return response.data;
    }

    async createSupplier(supplierData: any): Promise<any> {
        const response = await this.api.post('/suppliers', supplierData);
        return response.data;
    }

    async updateSupplier(supplierId: number, updates: any): Promise<any> {
        const response = await this.api.put(`/suppliers/${supplierId}`, updates);
        return response.data;
    }

    async deleteSupplier(supplierId: number): Promise<any> {
        const response = await this.api.delete(`/suppliers/${supplierId}`);
        return response.data;
    }

    async getSupplierItems(supplierId: number): Promise<any> {
        const response = await this.api.get(`/suppliers/${supplierId}/items`);
        return response.data;
    }

    async searchSuppliers(name: string): Promise<any> {
        const response = await this.api.get(`/suppliers/search/${name}`);
        return response.data;
    }

    // Reports
    async getLowStockReport(threshold?: number): Promise<any> {
        const params = threshold ? { threshold } : {};
        const response = await this.api.get(
            `${API_CONFIG.ENDPOINTS.REPORTS}/low-stock`,
            { params }
        );
        return response.data;
    }

    async generateInventoryReport(filename: string, format: string = 'csv'): Promise<any> {
        const response = await this.api.post(
            `${API_CONFIG.ENDPOINTS.REPORTS}/inventory`,
            { filename, format_type: format }
        );
        return response.data;
    }

    async getInventoryReport(groups?: string[]): Promise<any> {
        const params = groups ? { groups: groups.join(',') } : {};
        const response = await this.api.get(
            `${API_CONFIG.ENDPOINTS.REPORTS}/inventory`,
            { params }
        );
        return response.data;
    }

    // Backup & Export
    async createBackup(): Promise<any> {
        const response = await this.api.post('/backup');
        return response.data;
    }

    async exportToCSV(groups?: string[]): Promise<Blob> {
        const params = groups ? { groups: groups.join(',') } : {};
        const response = await this.api.get('/export/csv', {
            params,
            responseType: 'blob'
        });
        return response.data;
    }

    async exportToExcel(groups?: string[]): Promise<Blob> {
        const params = groups ? { groups: groups.join(',') } : {};
        const response = await this.api.get('/export/excel', {
            params,
            responseType: 'blob'
        });
        return response.data;
    }

    // Locations
    async getLocations(activeOnly: boolean = false): Promise<any> {
        const params = activeOnly ? { active_only: true } : {};
        const response = await this.api.get('/locations', { params });
        return response.data;
    }

    async getLocation(locationId: number): Promise<any> {
        const response = await this.api.get(`/locations/${locationId}`);
        return response.data;
    }

    async createLocation(locationData: any): Promise<any> {
        const response = await this.api.post('/locations', locationData);
        return response.data;
    }

    async updateLocation(locationId: number, updates: any): Promise<any> {
        const response = await this.api.put(`/locations/${locationId}`, updates);
        return response.data;
    }

    async deleteLocation(locationId: number): Promise<any> {
        const response = await this.api.delete(`/locations/${locationId}`);
        return response.data;
    }

    async getLocationItems(locationId: number): Promise<any> {
        const response = await this.api.get(`/locations/${locationId}/items`);
        return response.data;
    }

    // Item Locations
    async assignItemToLocation(itemLocationData: any): Promise<any> {
        const response = await this.api.post('/item-locations', itemLocationData);
        return response.data;
    }

    async getItemLocations(itemName: string): Promise<any> {
        const response = await this.api.get(`/items/${itemName}/locations`);
        return response.data;
    }

    // Batches
    async getBatches(filters?: { status?: string; expiring_soon?: boolean }): Promise<any> {
        const response = await this.api.get('/batches', { params: filters });
        return response.data;
    }

    async createBatch(batchData: any): Promise<any> {
        const response = await this.api.post('/batches', batchData);
        return response.data;
    }

    async updateBatch(batchId: number, updates: any): Promise<any> {
        const response = await this.api.put(`/batches/${batchId}`, updates);
        return response.data;
    }

    async getItemBatches(itemName: string, activeOnly: boolean = true): Promise<any> {
        const params = { active_only: activeOnly };
        const response = await this.api.get(`/items/${itemName}/batches`, { params });
        return response.data;
    }

    // Stock Adjustments
    async getStockAdjustments(itemName?: string, limit: number = 100): Promise<any> {
        const params: any = { limit };
        if (itemName) params.item_name = itemName;
        const response = await this.api.get('/stock-adjustments', { params });
        return response.data;
    }

    async createStockAdjustment(adjustmentData: any): Promise<any> {
        const response = await this.api.post('/stock-adjustments', adjustmentData);
        return response.data;
    }

    // Alerts
    async getAlerts(filters?: { unread_only?: boolean; alert_type?: string }): Promise<any> {
        const response = await this.api.get('/alerts', { params: filters });
        return response.data;
    }

    async updateAlert(alertId: number, updates: any): Promise<any> {
        const response = await this.api.put(`/alerts/${alertId}`, updates);
        return response.data;
    }

    async checkReorderLevels(): Promise<any> {
        const response = await this.api.post('/alerts/check-reorder-levels');
        return response.data;
    }

    // Generic GET method for any endpoint
    async get(endpoint: string, params?: any): Promise<any> {
        const response = await this.api.get(endpoint, { params });
        return response.data;
    }

    // Supplier Products
    async getSupplierProducts(supplierId: number): Promise<any> {
        const response = await this.api.get(`/supplier-products/${supplierId}`);
        return response.data;
    }

    async getItemSuppliers(itemName: string): Promise<any> {
        const response = await this.api.get(`/item-suppliers/${encodeURIComponent(itemName)}`);
        return response.data;
    }

    async createSupplierProduct(data: any): Promise<any> {
        const response = await this.api.post('/supplier-products', data);
        return response.data;
    }

    async updateSupplierProduct(id: number, data: any): Promise<any> {
        const response = await this.api.put(`/supplier-products/${id}`, data);
        return response.data;
    }

    async deleteSupplierProduct(id: number): Promise<any> {
        const response = await this.api.delete(`/supplier-products/${id}`);
        return response.data;
    }

    async getBestPrice(itemName: string, locationId?: number): Promise<any> {
        const params = locationId ? { location_id: locationId } : {};
        const response = await this.api.get(`/best-price/${encodeURIComponent(itemName)}`, { params });
        return response.data;
    }

    // Supplier Locations
    async getSupplierLocations(supplierId: number): Promise<any> {
        const response = await this.api.get(`/supplier-locations/${supplierId}`);
        return response.data;
    }

    async getLocationSuppliers(locationId: number): Promise<any> {
        const response = await this.api.get(`/location-suppliers/${locationId}`);
        return response.data;
    }

    async createSupplierLocation(data: any): Promise<any> {
        const response = await this.api.post('/supplier-locations', data);
        return response.data;
    }

    async updateSupplierLocation(id: number, data: any): Promise<any> {
        const response = await this.api.put(`/supplier-locations/${id}`, data);
        return response.data;
    }

    async deleteSupplierLocation(id: number): Promise<any> {
        const response = await this.api.delete(`/supplier-locations/${id}`);
        return response.data;
    }
}

export const apiService = new ApiService(); 