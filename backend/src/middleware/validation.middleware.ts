import type { Request, Response, NextFunction } from "express"
import { isString, isTimestampedPoint } from "../utilities/utilities";
import { validatePasswordStrength } from "./passwordRules.middleware";
import { ValidationError } from "./errorHandler.middleware";

/**
 * Validates username and password in request body
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * @throws {ValidationError} if username or password missing or invalid
 * @throws {ValidationError} if password doesn't meet strength requirements
 */
export const validateUserNameAndPassword = (req: Request, res: Response, next: NextFunction): void => {
    const username: string | undefined = req.body?.username;
    const password: string | undefined = req.body?.password;

    if(!isString(username)) {
        throw new ValidationError("Username required");
    }
    
    if(!isString(password)) {
        throw new ValidationError("Password required");
    }

    const detailedErrors = validatePasswordStrength(password);
    if(detailedErrors.length > 0) {
       throw new ValidationError("Weak Password", detailedErrors);
    }

    next();
};


/**
 * Validates coordinates array in request body
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 */
export const validateTimeStampedCoordinates = (req: Request, res: Response, next: NextFunction): void => {
    const coordinates = req.body?.coordinates;
    console.log(`validating coordinates=${JSON.stringify(coordinates)}`);

    if(!Array.isArray(coordinates) || !coordinates.every(isTimestampedPoint)) {
        console.log(!Array.isArray(coordinates) ? `coordinates isn't an array` : `coordinates isn't an array of Timestamped Points`);
        res.status(400).json({ message: 'Valid Coordinates Required' });
        return;
    }

    next();
};