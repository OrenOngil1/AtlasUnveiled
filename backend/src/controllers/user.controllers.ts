import type { Response, NextFunction } from "express";
import { getUserService, deleteUserService } from "../services/user.services";
import type { AuthenticatedRequest } from "../utilities/utilities";

export const getUserController = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId!;
    const user = await getUserService(userId);
    res.json(user);
};

export const deleteUserController = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId!;
    const userDeleted = await deleteUserService(userId);
    res.json(userDeleted);
};