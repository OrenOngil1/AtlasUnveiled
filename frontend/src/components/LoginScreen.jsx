import { useEffect, useState } from 'react';
import { getPasswordRules, loginUser, registerUser, fetchUserCoordinates } from '../services/apiService';

// Default password requirements if fetching fails
const DEFAULT_RULES = [
    { type: 'minLength', value: 8, message: 'At least 8 characters' },
    { type: 'requireUppercase', value: true, message: 'One uppercase letter (A-Z)' },
    { type: 'requireLowercase', value: true, message: 'One lowercase letter (a-z)' },
    { type: 'requireNumber', value: true, message: 'One number (0-9)' },
    { type: 'requireSpecial', value: true, message: 'One special character' }
];

// Password requirements configuration
const validators = {
    minLength: (password, value) => password.length >= value,
    requireUppercase: (password) => /[A-Z]/.test(password),
    requireLowercase: (password) => /[a-z]/.test(password),
    requireNumber: (password) => /[0-9]/.test(password),
    requireSpecial: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
}

// Validate password strength on frontend
function validatePassword(password, rules) {
    return rules
        .filter(rule => !validators[rule.type](password, rule.value))
        .map(rule => rule.message);
}

// Check if password is strong enough
function isPasswordStrong(password, rules = []) {
    return validatePassword(password, rules).length === 0;
}

async function fetchRules() {
    try {
        const rules = await getPasswordRules();
        console.log('Password rules fetched:', rules);
        return rules || DEFAULT_RULES;
    } catch (err) {
        console.error('Failed to fetch password rules:', err);
        return DEFAULT_RULES;
    }
}

export default function LoginScreen({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordErrors, setPasswordErrors] = useState([]);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [passwordRules, setPasswordRules] = useState([]);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

    // Fetch password rules once when switching to register mode
    useEffect(() => {
        if (isRegisterMode && passwordRules.length === 0) {
            fetchRules().then(setPasswordRules);
        }
    }, [isRegisterMode, passwordRules.length]);

    // Handle password input change
    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        // Only validate in register mode
        if (isRegisterMode && newPassword.length > 0) {
            const errors = validatePassword(newPassword, passwordRules);
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
            if (!isPasswordStrong(password, passwordRules)) {
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
            // Fetch user's coordinates from backend
            let coordinates = [];
            try {
                coordinates = await fetchUserCoordinates();
                console.log(`Fetched ${coordinates.length} coordinates from backend`);
            } catch (err) {
                console.log('No existing coordinates or fetch failed:', err.message);
            }
            onLoginSuccess(authData, coordinates);

        } catch (err) {
            console.error('Auth error:', err);
            // Parse error message
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
                                {passwordRules.map((rule, index) => {
                                    const isMet = validators[rule.type](password, rule.value);
                                    return (
                                        <li key={index} className={` ${isMet ? 'met' : 'unmet'}`}>
                                            {isMet ? '✓' : '○'} {rule.message}
                                        </li>
                                    );
                                })}
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
