import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

abstract class AppError extends Error {
    abstract statusCode: number;
    details?: string[] | undefined;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    }
};

export class ValidationError extends AppError {
    statusCode = 400;

    constructor(message: string, details?: string[]) {
        super(message);
        this.name = "ValidationError";
        this.details = details;
    }
};

export class UnauthorizedError extends AppError {
    statusCode = 401;

    constructor(message: string) {
        super(message);
        this.name = "UnauthorizedError";
    }
};

export class NotFoundError extends AppError {
    statusCode = 404;

    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
};

export class ConflictError extends AppError {
    statusCode = 409;

    constructor(message: string) {
        super(message);
        this.name = "ConflictError";
    }
};


/**
 * Global error handler middleware
 * Handles AppError instances, JWT errors, and unexpected errors
 * @param {AppError | Error} error - Error object to handle
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 */
export const handleError = (error: AppError | Error, req: Request, res: Response, next: NextFunction): void => {
    if(error instanceof AppError) {
        console.error(`Handled error: ${error.message}`);
        res.status(error.statusCode).json({ message: error.message, details: error.details });
        return;

    } else if(error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: "Token is expired" });
        return;

    } else if(error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: "Token is invalid" });
        return;
    }
    // Default case: unhandled error
    console.error(`Unhandled error: ${error.message}`);
    res.status(500).json({ message: "Internal Server Error" });
};

export default handleError;