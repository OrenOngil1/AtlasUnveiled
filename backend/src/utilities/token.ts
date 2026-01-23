import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import ms from 'ms';

const generateToken = (secret: string, expiresIn: number | StringValue): (userId: number) => string => {
    return (userId: number): string => {
        const options: jwt.SignOptions = {
            algorithm: "HS256",
            issuer: "atlasunveiledapp",
            subject: userId.toString(),
            expiresIn: expiresIn
        };

        return jwt.sign({}, secret, options);
    };
};

/**
 * Generates an access token for a user
 * @param {number} userId - User ID to encode in token
 * @returns {string} JWT access token
 */
export const generateAccessToken = generateToken(
    process.env.SECRET_ACCESS!,
    Number(process.env.ACCESS_TOKEN_EXPIRY || (Math.floor(ms('2h') / 1000))) // seconds
);


/**
 * Generates a refresh token for a user
 * @param {number} userId - User ID to encode in token
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = generateToken(
    process.env.SECRET_REFRESH!,
    Number(process.env.REFRESH_TOKEN_EXPIRY || (Math.floor(ms('7d') / 1000))) // seconds
);


/**
 * Generates both access and refresh tokens for a user
 * @param {number} userId - User ID to encode in tokens
 * @returns {{accessToken: string, refreshToken: string}} Object containing both tokens
 */
export const generateAccessAndRefreshTokens = (userId: number): { accessToken: string; refreshToken: string } => ({
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId)
});

/**
 * Verifies and decodes a JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret key for verification
 * @returns {jwt.JwtPayload} Decoded token payload
 * @throws {JsonWebTokenError} if token is invalid
 * @throws {TokenExpiredError} if token is expired
 */
export const verifyToken = (token: string, secret: string): jwt.JwtPayload => {
    return jwt.verify(token, secret, {
        "algorithms": ["HS256"],
        "issuer": "atlasunveiledapp"
    }) as jwt.JwtPayload;
};

/**
 * Extracts expiration date from JWT without verification
 * @param {string} token - JWT token
 * @returns {Date | null} Expiration date or null if invalid
 */
export const getTokenExpiry = (token: string): Date | null => {
    try {
        const decoded = jwt.decode(token) as jwt.JwtPayload;
        if(decoded.exp) {
            return new Date(decoded.exp * 1000);
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
};