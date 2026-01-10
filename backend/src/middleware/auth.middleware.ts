import type { Response, NextFunction } from "express";
import { isStringNumeric, type AuthenticatedRequest } from "../utilities/utilities";
import { verifyToken } from "../utilities/token";
import { UnauthorizedError, ValidationError } from "./errorHandler.middleware";

const authenticateToken = (secret: string) => {
    return async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1]; // Bearer <token>

        if(!token) {
            throw new UnauthorizedError("Missing token");
        }

        const decoded = verifyToken(token, secret);
        req.userId = validateUserId(decoded.sub);

        next();
    };
};

const validateUserId = (sub: string | undefined): number => {
    if(!sub) {
        throw new ValidationError("User ID missing from token");
    }

    if(!isStringNumeric(sub)) {
        throw new ValidationError("User ID in token is not number");
    }

    const numValue = Number(sub);

    if(!numValue) {
        throw new ValidationError("User ID in token must be a positive number");
    }

    return numValue;
};

export const authenticateAccessToken = authenticateToken(process.env.SECRET_ACCESS!);

export const authenticateRefreshToken = authenticateToken(process.env.SECRET_REFRESH!);