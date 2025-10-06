// API configuration
export const API_CONFIG = {
    BASE_URL: `http://127.0.0.1:${process.env.REACT_APP_API_PORT || 8001}`,
    ENDPOINTS: {
        LOGIN: '/token',
        INVENTORY: '/inventory',
        GROUPS: '/groups',
        USERS: '/users',
        PRICES: '/prices',
        REPORTS: '/reports',
        SETTINGS: '/settings'
    },
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    TIMEOUT: 5000  // 5 second timeout
};

// Authentication configuration
export const AUTH_CONFIG = {
    TOKEN_KEY: 'auth_token',
    ROLE_KEY: 'user_role',
    USERNAME_KEY: 'username'
};

// UI configuration
export const UI_CONFIG = {
    THEME: {
        PRIMARY_COLOR: '#1976d2',
        SECONDARY_COLOR: '#dc004e',
        SUCCESS_COLOR: '#4caf50',
        ERROR_COLOR: '#f44336',
        WARNING_COLOR: '#ff9800'
    },
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        PAGE_SIZE_OPTIONS: [5, 10, 25, 50]
    },
    DATE_FORMAT: 'YYYY-MM-DD HH:mm:ss',
    CURRENCY: 'USD'
};

// Feature flags
export const FEATURES = {
    ENABLE_DARK_MODE: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_EXPORT: true,
    ENABLE_IMPORT: true,
    ENABLE_PRICE_TRACKING: true
}; 