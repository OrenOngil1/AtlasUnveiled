const API_BASE_URL = 'http://localhost:3000';

// Token storage key
const ACCESS_TOKEN_KEY = 'atlas_access_token';
const REFRESH_TOKEN_KEY = 'atlas_refresh_token';

/**
 * Get stored access token
 * @returns {string|null}
 */
export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Store access token
 * @param {string} token 
 */
export function setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * Store refresh token
 * @param {string} token 
 */
export function setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Clear stored tokens
 */
export function clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{user: {id: number, name: string}, accessToken: string, refreshToken: string}>} User data with tokens
 */
export async function loginUser(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid username or password');
        }
        throw new Error('Login failed');
    }
    const data = await response.json();
    // Store tokens
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return data;
}

/**
 * Register a new user
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{user: {id: number, name: string}, accessToken: string, refreshToken: string}>} Created user data with tokens
 */
export async function registerUser(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        if (response.status === 409) {
            throw new Error('Username already exists');
        }
        throw new Error('Registration failed');
    }
    const data = await response.json();
    // Store tokens
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return data;
}

/**
 * Logout user (requires authentication token)
 * BUG FIX: Only clears tokens AFTER successful logout response
 * @returns {Promise<void>}
 */
export async function logoutUser() {
    const token = getAccessToken();
    if (!token) {
        // Already logged out locally
        return;
    }
    
    // Make logout request first
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    
    // Only clear tokens if logout was successful
    // This ensures client state stays consistent with server state
    if (response.ok) {
        clearTokens();
        return true;
    }
    
    // If logout failed, throw error but keep tokens
    // This allows retry and prevents inconsistent state
    throw new Error('Logout failed');
}

/**
 * Fetch user's explored coordinates from backend (requires authentication token)
 * BUG FIX: Handles both { coordinates: [...] } and [...] response formats
 * @returns {Promise<Array<{x: number, y: number}>>} Array of coordinates
 */
export async function fetchUserCoordinates() {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated');
    }
    const response = await fetch(`${API_BASE_URL}/coordinates/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        if (response.status === 401) {
            clearTokens();
            throw new Error('Authentication expired');
        }
        if (response.status === 404) {
            return []; // No coordinates found, return empty array
        }
        throw new Error('Failed to fetch coordinates');
    }
    const data = await response.json();
    
    // Handle both response formats:
    // 1. Backend format: { coordinates: [...] }
    // 2. Direct array format: [...]
    if (Array.isArray(data)) {
        return data;
    }
    if (data && Array.isArray(data.coordinates)) {
        return data.coordinates;
    }
    
    // If response structure is unexpected, log warning and return empty array
    // This prevents silent data loss - we know something went wrong
    console.warn('Unexpected coordinates response format:', data);
    return [];
}

/**
 * Save coordinates to backend (requires authentication token)
 * @param {Array<{x: number, y: number, timestamp: number}>} coordinates - Array of {x: longitude, y: latitude, timestamp: number}
 * @returns {Promise<Array>} Saved coordinates
 */
export async function saveCoordinatesToBackend(coordinates) {
    if (!coordinates || coordinates.length === 0) {
        return [];
    }
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated');
    }
    const response = await fetch(`${API_BASE_URL}/coordinates/me`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ coordinates }),
    });
    if (!response.ok) {
        if (response.status === 401) {
            clearTokens();
            throw new Error('Authentication expired');
        }
        if (response.status === 404) {
            throw new Error('User not found');
        }
        throw new Error('Failed to save coordinates');
    }
    return response.json();
}

/**
 * Delete all user's coordinates from backend (requires authentication token)
 * @returns {Promise<Array>} Deleted coordinates
 */
export async function deleteUserCoordinates() {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated');
    }
    const response = await fetch(`${API_BASE_URL}/coordinates/me`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        if (response.status === 401) {
            clearTokens();
            throw new Error('Authentication expired');
        }
        throw new Error('Failed to delete coordinates');
    }
    return response.json();
}

/**
 * @param {string} url 
 */
export function setApiBaseUrl(url) {
    console.log('To change API URL, modify API_BASE_URL in apiService.js');
}

export default {
    loginUser,
    registerUser,
    logoutUser,
    fetchUserCoordinates,
    saveCoordinatesToBackend,
    deleteUserCoordinates,
    getAccessToken,
    setAccessToken,
    clearTokens,
};
