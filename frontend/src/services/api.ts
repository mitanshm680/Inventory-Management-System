import axios, { AxiosInstance, AxiosResponse } from 'axios';
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

    // Generic GET method for any endpoint
    async get(endpoint: string, params?: any): Promise<any> {
        const response = await this.api.get(endpoint, { params });
        return response.data;
    }
}

export const apiService = new ApiService(); 