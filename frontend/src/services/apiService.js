const API_BASE_URL = 'http://localhost:3000';

// Token storage key
const ACCESS_TOKEN_KEY = 'atlas_access_token';
const REFRESH_TOKEN_KEY = 'atlas_refresh_token';

//Get stored access token
export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

//Store access token
export function setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

//Store refresh token
export function setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

// Clear stored tokens
export function clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Fetch password rules from backend
export async function getPasswordRules() {
    const response = await fetch(`${API_BASE_URL}/auth/password-rules`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch password rules');
    }

    const data = await response.json();
    return data.rules;
}

// Login user
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

//Register a new user
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

//Logout user
export async function logoutUser() {
    const token = getAccessToken();
    if (!token) {
        return;
    }
    const response = await fetchWithRetry(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error('Logout failed');
    }
    // Clear tokens only after successful response
    clearTokens();
    return true;
}

// Refresh access token using refresh token
export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`,
        },
    });
    if (!response.ok) {
        clearTokens();
        throw new Error('Session expired, please log in again');
    }
    const data = await response.json();
    setAccessToken(data.accessToken);
}

//Fetch user's explored coordinates from backend
export async function fetchUserCoordinates() {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated');
    }
    const response = await fetchWithRetry(`${API_BASE_URL}/coordinates/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        if (response.status === 401) {
            clearTokens();
            throw new Error('Session expired, please log in again');
        }
        if (response.status === 404) {
            return []; // No coordinates found, return empty array
        }
        throw new Error('Failed to fetch coordinates');
    }
    const data = await response.json();
    if (Array.isArray(data)) {
        return data;
    }
    if (data && Array.isArray(data.coordinates)) {
        return data.coordinates;
    }
    console.warn('Unexpected coordinates response format:', data);
    return [];
}

// Save coordinates to backend
export async function saveCoordinatesToBackend(coordinates) {
    if (!coordinates || coordinates.length === 0) {
        return [];
    }
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated');
    }
    console.log(`saveCoordinatesToBackend: Attempting to save ${coordinates.length} coordinates`);
    const response = await fetchWithRetry(`${API_BASE_URL}/coordinates/me`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ coordinates }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('saveCoordinatesToBackend: Failed response:', response.status, errorText);
        if (response.status === 401) {
            clearTokens();
            throw new Error('Session expired');
        }
        if (response.status === 404) {
            throw new Error('User not found');
        }
        throw new Error(`Failed to save coordinates: ${errorText}`);
    }
    const result = await response.json();
    console.log('saveCoordinatesToBackend: Successfully saved coordinates:', result);
    return result;
}

//Delete all user's coordinates from backend 
export async function deleteUserCoordinates() {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated');
    }
    console.log('deleteUserCoordinates: Deleting existing coordinates');
    const response = await fetchWithRetry(`${API_BASE_URL}/coordinates/me`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('deleteUserCoordinates: Failed response:', response.status, errorText);
        if (response.status === 401) {
            clearTokens();
            throw new Error('Session expired');
        }
        if (response.status === 404) {
            console.log('deleteUserCoordinates: No coordinates to delete (404)');
            return [];
        }
        throw new Error(`Failed to delete coordinates: ${errorText}`);
    }
    const result = await response.json();
    console.log('deleteUserCoordinates: Successfully deleted coordinates');
    return result;
}

// Fetch with automatic token refresh on 401 response
export async function fetchWithRetry(url, options = {}) {
    let response = await fetch(url, options);
    if (response.status === 401) {
        await refreshAccessToken();
        const token = getAccessToken();
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
            response = await fetch(url, options);
        }
    }
    return response;
}

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
