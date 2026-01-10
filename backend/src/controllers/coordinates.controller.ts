import type { Response, NextFunction } from "express";
import { getCoordinatesService, addCoordinatesService, deleteCoordinatesService } from "../services/coordinates.services"
import type { AuthenticatedRequest, TimestampedPoint } from "../utilities/utilities";

export const getCoordinatesController = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId!;
    const coordinates = await getCoordinatesService(userId);
    res.json({ coordinates });
};

export const addCoordinatesController = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId!;
    const coordinates = req.body.coordinates as TimestampedPoint[];
    console.log(`[BACKEND] addCoordinatesController: User ${userId} saving ${coordinates?.length || 0} coordinates`);
    if (coordinates && coordinates.length > 0) {
        console.log(`[BACKEND] First coordinate:`, coordinates[0]);
    }
    const coordinatesAdded = await addCoordinatesService(userId, coordinates);
    console.log(`[BACKEND] Successfully saved ${coordinatesAdded?.length || 0} coordinates`);
    res.status(201).json(coordinatesAdded);
};

export const deleteCoordinatesController = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId!;
    const coordinatesDeleted = await deleteCoordinatesService(userId);
    res.json(coordinatesDeleted);
};