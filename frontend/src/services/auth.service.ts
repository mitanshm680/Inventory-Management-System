import axios from 'axios';
import { API_CONFIG, AUTH_CONFIG } from '../config';

class AuthService {
    async login(username: string, password: string) {
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await axios.post(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data.access_token) {
                localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, response.data.access_token);
                // Get user info
                await this.getUserInfo();
            }

            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async getUserInfo() {
        try {
            const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
            if (!token) {
                throw new Error('No token found');
            }

            const response = await axios.get(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/me`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            localStorage.setItem(AUTH_CONFIG.ROLE_KEY, response.data.role);
            localStorage.setItem(AUTH_CONFIG.USERNAME_KEY, response.data.username);

            return response.data;
        } catch (error) {
            console.error('Error getting user info:', error);
            this.logout();
            throw error;
        }
    }

    logout() {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.ROLE_KEY);
        localStorage.removeItem(AUTH_CONFIG.USERNAME_KEY);
        window.location.href = '/login';
    }

    getCurrentUser() {
        return {
            username: localStorage.getItem(AUTH_CONFIG.USERNAME_KEY),
            role: localStorage.getItem(AUTH_CONFIG.ROLE_KEY),
            token: localStorage.getItem(AUTH_CONFIG.TOKEN_KEY)
        };
    }

    isAuthenticated() {
        return !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    }
}

export default new AuthService(); 