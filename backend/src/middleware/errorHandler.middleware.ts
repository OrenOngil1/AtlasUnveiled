import type { NextFunction, Request, Response } from "express";


abstract class AppError extends Error {
    abstract statusCode: number;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    }
};


export class UserAlreadyExistsError extends AppError {
    statusCode = 409;

    constructor() {
        super("User Already Exists");
        this.name = "UserAlreadyExistsError";
    }
};


export class WrongPasswordError extends AppError {
    statusCode = 401;

    constructor() {
        super("Wrong Password");
        this.name = "WrongPasswordError";
    }
};


export class UserNotFoundError extends AppError {
    statusCode = 404;

    constructor() {
        super("User Not Found");
        this.name = "UserNotFoundError";
    }
};


export class ActiveSessionError extends AppError {
    statusCode = 409;

    constructor() {
        super("User Already Logged In");
        this.name = "ActiveSessionError";
    }
};


export class SessionExpiredError extends AppError {
    statusCode = 401;

    constructor() {
        super("User's session Expired");
        this.name = "SessionExpiredError";
    }
};

export const handleError = (error: AppError | Error, req: Request, res: Response, next: NextFunction): void => {
    if(error instanceof AppError) {
        console.error(`Handled error: ${error.message}`);
        res.status(error.statusCode).json({ message: error.message });
    } else {
        console.error(`Unhandled error: ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export default handleError;