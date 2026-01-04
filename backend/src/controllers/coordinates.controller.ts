import type { Request, Response } from "express";
import { getCoordinatesService, addCoordinatesService, deleteCoordinatesService } from "../services/coordinates.services"
import { UserNotFoundError } from "../utilities/customErrors.utilities";

export const getCoordinatesController = async(req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.userId);
    try {
        const coordinates = await getCoordinatesService(id);
        res.json(coordinates);
    } catch(error: any) {
        if(error instanceof UserNotFoundError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ "message": "Internal Server Error"});
        }
    }
};

export const addCoordinatesController = async(req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.userId);
    const coordinates = req.body.coordinates;

    try {
        const coordinatesAdded = await addCoordinatesService(id, coordinates);
        res.status(201).json(coordinatesAdded);
    } catch(error: any) {
        if(error instanceof UserNotFoundError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ "message": "Internal Server Error"});
        }
    }
};

//NOTE: This controller is for testing only!
export const deleteCoordinatesController = async(req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.userId);

    try {
        const coordinatesDeleted = await deleteCoordinatesService(id);
        res.json(coordinatesDeleted);
    } catch(error: any) {
        if(error instanceof UserNotFoundError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ "message": "Internal Server Error"});
        }
    }
    
};