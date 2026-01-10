const API_BASE_URL = 'http://localhost:3000';

/**
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{id: number, name: string}>} User data with ID
 */
export async function loginUser(username, password) {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Invalid username or password');
        }
        throw new Error('Login failed');
    }
    return response.json();
}

/**
 * Register a new user
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise<{id: number, name: string}>} Created user data
 */
export async function registerUser(username, password) {
    const response = await fetch(`${API_BASE_URL}/users`, {
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
    return response.json();
}

/**
 * Logout user
 * @param {number} userId 
 * @returns {Promise<void>}
 */
export async function logoutUser(userId) {
    const response = await fetch(`${API_BASE_URL}/users/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
        throw new Error('Logout failed');
    }
    return true;
}

/**
 * Fetch user's explored coordinates from backend
 * @param {number} userId 
 * @returns {Promise<Array<{x: number, y: number}>>} Array of coordinates
 */
export async function fetchUserCoordinates(userId) {
    const response = await fetch(`${API_BASE_URL}/coordinates/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('User not found');
        }
        throw new Error('Failed to fetch coordinates');
    }
    return response.json();
}

/**
 * Save coordinates to backend
 * @param {number} userId 
 * @param {Array<{x: number, y: number}>} coordinates - Array of {x: longitude, y: latitude}
 * @returns {Promise<Array>} Saved coordinates
 */
export async function saveCoordinatesToBackend(userId, coordinates) {
    if (!coordinates || coordinates.length === 0) {
        return [];
    }
    const response = await fetch(`${API_BASE_URL}/coordinates/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coordinates }),
    });
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('User not found');
        }
        throw new Error('Failed to save coordinates');
    }
    return response.json();
}

/**
 * Delete all user's coordinates from backend (for testing)
 * @param {number} userId 
 * @returns {Promise<Array>} Deleted coordinates
 */
export async function deleteUserCoordinates(userId) {
    const response = await fetch(`${API_BASE_URL}/coordinates/${userId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
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
};
