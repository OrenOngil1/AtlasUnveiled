import type { Request, Response } from "express";
import { createUserService, deleteAllUsersService, loginUserService, logoutUserService, getAllUsersService } from "../services/user.services";
import { getUserService, deleteUserService } from "../services/user.services";
import { UserAlreadyExistsError, UserNotFoundError } from "../utilities/customErrors.utilities";
import type { UserData } from "../utilities/utilities";

export const createUserController = async(req: Request, res: Response): Promise<void> => {
    const username = String(req.body.username);
    const password = String(req.body.password);
    try {
        const user = await createUserService(username, password);
        res.status(201).json(user);
    } catch(error: any) {
        if(error instanceof UserAlreadyExistsError) {
            res.status(409).json({ "message": error.message });
        } else {
            res.status(500).json({ "message": "Internal Server Error"});
        }
    }   
};

export const loginUserController = async(req: Request, res: Response): Promise<void> => {
    const username = String(req.body.username);
    const password = String(req.body.password);
    try {
        const loginConfirm: UserData = await loginUserService(username, password);
        res.json(loginConfirm);
    } catch(error: any) {
        if(error instanceof UserNotFoundError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ "message": "Internal Server Error"});
        }
    }
};

export const logoutUserController = async(req: Request, res: Response): Promise<void> => {
    const id = Number(req.body.userId);
    try {
        const logoutConfirm: void = await logoutUserService(id);
        res.json(logoutConfirm);
    } catch(error: any) {
        if(error instanceof UserNotFoundError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ "message": "Internal Server Error"});
        }
    }  
};

export const getUserController = async(req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.userId);
    try {
        const user = await getUserService(id);
        res.json(user);
    } catch(error: any) {
        if(error instanceof UserNotFoundError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ "message": "Internal Server Error"});
        }
    } 
};

export const getAllUsersController = async(req: Request, res: Response): Promise<void> => {
    try {
        const usersData = await getAllUsersService();
        res.json(usersData);
    } catch(error: any) {
        if(error instanceof UserNotFoundError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ "message": "Internal Server Error"});
        }
    }
}

export const deleteUserController = async(req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.userId);
    try {
        const userDeleted = await deleteUserService(id);
        res.json(userDeleted);
    } catch(error: any) {
        if(error instanceof UserNotFoundError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ "message": "Internal Server Error"});
        }
    }  
};
// This function is for testing only!
export const deleteAllUsersController = async(req: Request, res: Response): Promise<void> => {
    try {
        const usersDeleted = await deleteAllUsersService();
        res.json(usersDeleted);
    } catch(error: any) {
        if(error instanceof UserNotFoundError) {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ "message": "Internal Server Error"});
        }
    }
};