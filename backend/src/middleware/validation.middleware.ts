import type { Request, Response, NextFunction } from "express"
import { isPoint, isString, isStringNumeric } from "../utilities/utilities";

export const validateUserNameAndPassword = (req: Request, res: Response, next: NextFunction): void => {
    const username = req.body?.username;
    const password = req.body?.password;

    if(!isString(username)) {
        res.status(400).json({ message: 'Username required' });
        return;
    } else if(!isString(password)) {
        res.status(400).json({ message: 'Password required' });
        return;
    }

    next();
};

export const validateIdParam = (req: Request, res: Response, next: NextFunction): void => {
    const errorMessage = validateId(req.params?.userId);
    if(errorMessage.length > 0) {
        res.status(400).json({ message: errorMessage });
        return;
    }
    next();
};

export const validateIdBody = (req: Request, res: Response, next: NextFunction): void => {
    const errorMessage = validateId(req.body?.userId);
    if(errorMessage.length > 0) {
        res.status(400).json({ message: errorMessage });
        return;
    }

    next();
};

export const validateCoordinates = (req: Request, res: Response, next: NextFunction): void => {
    const coordinates = req.body?.coordinates;
    console.log(`validating coordinates=${JSON.stringify(coordinates)}`)
    if(!Array.isArray(coordinates) || !coordinates.every(isPoint)) {
        console.log(!Array.isArray(coordinates) ? `coordinates isn't an array` : `coordinates isn't an array of Points`);
        res.status(400).json({ message: 'Coordinates required' });
        return;
    }

    next();
};

const validateId = (id: string | undefined): string => {
    if(!id) {
        return 'Id required';
    } else if(!isStringNumeric(id)) {
        return 'Malformed id';
    }
    return "";
}