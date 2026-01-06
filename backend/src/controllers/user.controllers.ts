import type { Request, Response, NextFunction } from "express";
import { createUserService, loginUserService, logoutUserService } from "../services/user.services";
import { getUserService, deleteUserService } from "../services/user.services";
import { UserNotFoundError, WrongPasswordError } from "../middleware/errorHandler.middleware";
import type { LoginRequest, UserData } from "../utilities/utilities";

export const createUserController = async(req: Request<{}, {}, LoginRequest>, res: Response, next: NextFunction): Promise<void> => {
    const { username, password } = req.body;
    try {
        const user = await createUserService(username, password);
        res.status(201).json(user);

    } catch(error: unknown) {
        next(error);
    }   
};

export const loginUserController = async(req: Request<{}, {}, LoginRequest>, res: Response, next: NextFunction): Promise<void> => {
    const { username, password } = req.body;

    try {
        const loginConfirm: UserData = await loginUserService(username, password);
        res.json(loginConfirm);

    } catch(error: unknown) {
        if(error instanceof UserNotFoundError) {
            res.status(401).json({ message: "username or password are incorrect" });
            return;
        }

        if(error instanceof WrongPasswordError) {
            res.status(401).json({ message: "username or password are incorrect" });
            return;
        }

        next(error);
    }
};

export const logoutUserController = async(req: Request<{}, {}, { userId: number }>, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = req.body;
    try {
        const logoutConfirm: void = await logoutUserService(userId);
        res.json(logoutConfirm);

    } catch(error: unknown) {
        next(error);
    }  
};

export const getUserController = async(req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
    const userId = Number(req.params.userId);
    try {
        const user = await getUserService(userId);
        res.json(user);

    } catch(error: unknown) {
        next(error);
    } 
};

export const deleteUserController = async(req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
    const userId = Number(req.params.userId);
    try {
        const userDeleted = await deleteUserService(userId);
        res.json(userDeleted);

    } catch(error: unknown) {
        next(error);
    }  
};