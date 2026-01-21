import { useState } from 'react';
import { loginUser, registerUser, fetchUserCoordinates } from '../services/apiService';

const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
};

// Validate password strength on frontend
function validatePassword(password) {
    const errors = [];
    
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
    }
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('One uppercase letter (A-Z)');
    }
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('One lowercase letter (a-z)');
    }
    if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
        errors.push('One number (0-9)');
    }
    if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('One special character (!@#$%^&*...)');
    }
    
    return errors;
}

// Check if password is strong enough
function isPasswordStrong(password) {
    return validatePassword(password).length === 0;
}

export default function LoginScreen({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

    // Handle password input change
    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        
        // Only validate in register mode
        if (isRegisterMode && newPassword.length > 0) {
            const errors = validatePassword(newPassword);
            setPasswordErrors(errors);
            setShowPasswordRequirements(true);
        } else {
            setPasswordErrors([]);
            setShowPasswordRequirements(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Frontend validation for registration
        if (isRegisterMode) {
            if (!isPasswordStrong(password)) {
                setError('Please fix the password requirements below');
                return;
            }
        }
        
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
            onLoginSuccess(authData, coordinates);

        } catch (err) {
            console.error('Auth error:', err);
            // Parse error message for user-friendly display
            const errorMessage = err.message || 'Authentication failed';
            if (isRegisterMode) {
                // Registration errors
                if (errorMessage.toLowerCase().includes('weak password') || 
                    errorMessage.toLowerCase().includes('password')) {
                    setError('Password is too weak. Please check the requirements below.');
                    setShowPasswordRequirements(true);
                } else if (errorMessage.toLowerCase().includes('already exists') ||
                           errorMessage.toLowerCase().includes('username')) {
                    setError('Username already taken. Please choose a different one.');
                } else {
                    setError('Registration failed. Please try again.');
                }
            } else {
                // Login errors
                if (errorMessage.toLowerCase().includes('invalid') ||
                    errorMessage.toLowerCase().includes('not found') ||
                    errorMessage.toLowerCase().includes('incorrect') ||
                    errorMessage.toLowerCase().includes('401')) {
                    setError('Incorrect username or password. Please try again.');
                } else if (errorMessage.toLowerCase().includes('network') ||
                           errorMessage.toLowerCase().includes('fetch')) {
                    setError('Connection error. Please check your internet connection.');
                } else {
                    setError('Login failed. Please check your credentials and try again.');
                }
            }
        } finally {
            setIsLoading(false);
        }
    };
    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setError('');
        setPasswordErrors([]);
        setShowPasswordRequirements(false);
        setPassword('');
    };
    // Calculate password strength percentage
    const getPasswordStrength = () => {
        if (!password) return 0;
        const totalRequirements = 5;
        const passedRequirements = totalRequirements - passwordErrors.length;
        return (passedRequirements / totalRequirements) * 100;
    };

    const strengthPercent = getPasswordStrength();
    const strengthColor = strengthPercent < 40 ? '#ff5252' : 
                          strengthPercent < 70 ? '#ffc107' : 
                          strengthPercent < 100 ? '#8bc34a' : '#4caf50';

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
                            onChange={handlePasswordChange}
                            placeholder={isRegisterMode ? "Create a strong password" : "Enter password"}
                            required
                            disabled={isLoading}
                            autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                        />
                        
                        {/* Password Strength Indicator */}
                        {isRegisterMode && password.length > 0 && (
                            <div className="password-strength">
                                <div className="strength-bar">
                                    <div 
                                        className="strength-fill"
                                        style={{ 
                                            width: `${strengthPercent}%`,
                                            backgroundColor: strengthColor
                                        }}
                                    />
                                </div>
                                <span className="strength-text" style={{ color: strengthColor }}>
                                    {strengthPercent < 40 ? 'Weak' : 
                                     strengthPercent < 70 ? 'Fair' : 
                                     strengthPercent < 100 ? 'Good' : 'Strong'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Password Requirements */}
                    {isRegisterMode && showPasswordRequirements && (
                        <div className="password-requirements">
                            <p className="requirements-title">Password must have:</p>
                            <ul className="requirements-list">
                                <li className={password.length >= PASSWORD_REQUIREMENTS.minLength ? 'met' : 'unmet'}>
                                    {password.length >= PASSWORD_REQUIREMENTS.minLength ? '✓' : '○'} At least {PASSWORD_REQUIREMENTS.minLength} characters
                                </li>
                                <li className={/[A-Z]/.test(password) ? 'met' : 'unmet'}>
                                    {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter (A-Z)
                                </li>
                                <li className={/[a-z]/.test(password) ? 'met' : 'unmet'}>
                                    {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter (a-z)
                                </li>
                                <li className={/[0-9]/.test(password) ? 'met' : 'unmet'}>
                                    {/[0-9]/.test(password) ? '✓' : '○'} One number (0-9)
                                </li>
                                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'met' : 'unmet'}>
                                    {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '○'} One special character
                                </li>
                            </ul>
                        </div>
                    )}
                    {/* Error Message */}
                    {error && (
                        <div className="login-error">
                            <span className="error-icon">⚠️</span>
                            <span className="error-text">{error}</span>
                        </div>
                    )}
                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading || !username || !password || (isRegisterMode && passwordErrors.length > 0)}
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
