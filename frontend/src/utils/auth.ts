import api from './api';
import { User } from '../types';

interface TokenResponse {
  access_token: string;
}

export const login = async (username: string, password: string): Promise<TokenResponse> => {
  try {
    // Use URLSearchParams instead of FormData for compatibility with FastAPI
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post<TokenResponse>('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      return response.data;
    } else {
      throw new Error('Invalid token response');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = (): void => {
  localStorage.removeItem('token');
};

export const getUser = async (): Promise<User | null> => {
  try {
    const response = await api.get<User>('/users/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

interface JwtPayload {
  exp?: number;
  [key: string]: any;
}

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  
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
      localStorage.removeItem('token');
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
      localStorage.removeItem('token');
      return false;
    }
    
    return true;
  } catch (e) {
    // If there's any error parsing the token, consider it invalid
    console.error('Error validating token:', e);
    localStorage.removeItem('token');
    return false;
  }
}; 