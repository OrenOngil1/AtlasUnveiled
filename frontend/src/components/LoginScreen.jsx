import { useState } from 'react';
import { loginUser, registerUser, fetchUserCoordinates } from '../services/apiService';

export default function LoginScreen({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            let authData;
            if (isRegisterMode) {
                // Register new user
                // Returns {user: {id, name}, accessToken, refreshToken}
                authData = await registerUser(username, password);
                console.log('User registered:', authData.user);
            } else {
                // Login existing user
                // Returns {user: {id, name}, accessToken, refreshToken}
                authData = await loginUser(username, password);
                console.log('User logged in:', authData.user);
            }
            // Fetch user's coordinates from backend (uses stored token)
            let coordinates = [];
            try {
                coordinates = await fetchUserCoordinates();
                console.log(`Fetched ${coordinates.length} coordinates from backend`);
            } catch (err) {
                console.log('No existing coordinates or fetch failed:', err.message);
                // Continue anyway - user may be new or have no data
            }
            // Pass auth data (contains user info) and coordinates to parent
            onLoginSuccess(authData, coordinates);

        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setError('');
    };

    return (
        <div className="login-screen">
            <div className="login-container">
                {/* Logo/Title */}
                <div className="login-header">
                    <h1 className="login-title">🗺️ Atlas Unveiled</h1>
                    <p className="login-subtitle">Explore Your World</p>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            disabled={isLoading}
                            autoComplete="username"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            disabled={isLoading}
                            autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                        />
                    </div>
                    {/* Error Message */}
                    {error && (
                        <div className="login-error">
                            ⚠️ {error}
                        </div>
                    )}
                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading || !username || !password}
                    >
                        {isLoading ? (
                            <span className="loading-spinner">⏳</span>
                        ) : (
                            isRegisterMode ? 'Create Account' : 'Login'
                        )}
                    </button>
                </form>

                {/* Toggle Login/Register */}
                <div className="login-toggle">
                    <button 
                        type="button" 
                        onClick={toggleMode}
                        className="toggle-button"
                        disabled={isLoading}
                    >
                        {isRegisterMode 
                            ? 'Already have an account? Login' 
                            : "Don't have an account? Register"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
