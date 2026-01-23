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
    console.log(`[BACKEND] Received coordinates count:`, coordinates?.length);
    if (coordinates && coordinates.length > 0) {
        console.log(`[BACKEND] First coordinate:`, coordinates[0]);
    }
    await addCoordinatesService(userId, coordinates);
    res.status(201).json({ message: "Coordinates added successfully" });
};

export const deleteCoordinatesController = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId!;
    await deleteCoordinatesService(userId);
    res.json({ message: "Coordinates deleted successfully" });
};