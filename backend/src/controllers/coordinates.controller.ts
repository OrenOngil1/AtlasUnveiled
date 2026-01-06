import type { Request, Response, NextFunction } from "express";
import { getCoordinatesService, addCoordinatesService, deleteCoordinatesService } from "../services/coordinates.services"
import type { Point, TimestampedPoint } from "../utilities/utilities";

export const getCoordinatesController = async(req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
    const userId = Number(req.params.userId);
    try {
        const coordinates = await getCoordinatesService(userId);
        res.json(coordinates);

    } catch(error: unknown) {
        next(error);
    }
};

export const addCoordinatesController = async(req: Request<{ userId: string }, {}, { coordinates: TimestampedPoint[] }>, res: Response, next: NextFunction): Promise<void> => {
    const userId = Number(req.params.userId);
    const coordinates = req.body.coordinates;

    try {
        const coordinatesAdded = await addCoordinatesService(userId, coordinates);
        res.status(201).json(coordinatesAdded);

    } catch(error: unknown) {
        next(error);
    }
};

export const deleteCoordinatesController = async(req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
    const userId = Number(req.params.userId);

    try {
        const coordinatesDeleted = await deleteCoordinatesService(userId);
        res.json(coordinatesDeleted);

    } catch(error: unknown) {
        next(error);
    }  
};