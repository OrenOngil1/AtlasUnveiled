import type { Request, Response, NextFunction } from "express"
import { isString, isStringNumeric, isTimestampedPoint } from "../utilities/utilities";
import { validatePasswordStrength } from "./passwordRules.middleware";

export const validateUserNameAndPassword = (req: Request, res: Response, next: NextFunction): void => {
    const username: string | undefined = req.body?.username;
    const password: string | undefined = req.body?.password;

    if(!isString(username)) {
        res.status(400).json({ message: 'Username Required' });
        return;
    }
    
    if(!isString(password)) {
        res.status(400).json({ message: 'Password required' });
        return;
    }

    const detailedErrors = validatePasswordStrength(password);
    if(detailedErrors.length > 0) {
        res.status(400).json({ message: 'Weak Password', details: detailedErrors });
        return;
    }

    next();
};

const validateIdFrom = (location: 'params' | 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {

        const id = location === 'params' ? req.params?.userId : req.body?.userId;

        if(!id) {
            res.status(400).json({ message: 'Id Required' });
            return;
        }

        if(!isStringNumeric(id)) {
            res.status(400).json({ message: 'Malformed Id' });
            return;
        }

        next();
    };
};

export const validateIdParam = validateIdFrom('params');

export const validateIdBody = validateIdFrom('body');

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