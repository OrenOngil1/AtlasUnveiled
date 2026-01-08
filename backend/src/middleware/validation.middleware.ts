import type { Request, Response, NextFunction } from "express"
import { isString, isTimestampedPoint } from "../utilities/utilities";
import { validatePasswordStrength } from "./passwordRules.middleware";
import { ValidationError } from "./errorHandler.middleware";

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

export const validateRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
    const refreshToken = req.body?.refreshToken;

    if(!isString(refreshToken)) {
        res.status(400).json({ message: 'Valid Refresh Token Required' });
        return;
    }

    next();
};