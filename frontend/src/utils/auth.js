import api from './api';

export const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await api.post('/token', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  localStorage.setItem('token', response.data.access_token);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getUser = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = () => {
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
    const payload = JSON.parse(atob(tokenParts[1].replace(/_/g, '/').replace(/-/g, '+')));
    
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