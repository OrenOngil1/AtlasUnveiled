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

export const generateAccessToken = generateToken(
    process.env.SECRET_ACCESS!,
    Number(process.env.ACCESS_TOKEN_EXPIRY || (Math.floor(ms('2h') / 1000))) // seconds
);

export const generateRefreshToken = generateToken(
    process.env.SECRET_REFRESH!,
    Number(process.env.REFRESH_TOKEN_EXPIRY || (Math.floor(ms('7d') / 1000))) // seconds
);

export const generateAccessAndRefreshTokens = (userId: number): { accessToken: string; refreshToken: string } => ({
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId)
});

export const verifyToken = (token: string, secret: string): jwt.JwtPayload => {
    return jwt.verify(token, secret, {
        "algorithms": ["HS256"],
        "issuer": "atlasunveiledapp"
    }) as jwt.JwtPayload;
};

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