import { apiService } from '../services/api';
import { User } from '../types';
import { AUTH_CONFIG } from '../config';

interface TokenResponse {
  access_token: string;
}

export const login = async (username: string, password: string): Promise<TokenResponse> => {
  try {
    const response = await apiService.login(username, password);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.ROLE_KEY);
  localStorage.removeItem(AUTH_CONFIG.USERNAME_KEY);
};

export const getUser = async (): Promise<User | null> => {
  try {
    return await apiService.getCurrentUser();
  } catch (error) {
    return null;
  }
};

interface JwtPayload {
  exp?: number;
  [key: string]: any;
}

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  
  // If no token exists, user is not authenticated
  if (!token) {
    return false;
  }
  
  // Check if token is expired
  try {
    // JWT token consists of three parts separated by dots
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      // Not a valid JWT token
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      return false;
    }
    
    // Parse the payload (second part)
    const payload: JwtPayload = JSON.parse(
      atob(tokenParts[1].replace(/_/g, '/').replace(/-/g, '+'))
    );
    
    // Check if the token has an expiration claim
    if (!payload.exp) {
      return true; // No expiration, assume it's valid
    }
    
    // Check if the token has expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      // Token has expired
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      return false;
    }
    
    return true;
  } catch (e) {
    // If there's any error parsing the token, consider it invalid
    console.error('Error validating token:', e);
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    return false;
  }
}; 