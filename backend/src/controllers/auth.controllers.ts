import type { Request, Response, NextFunction } from "express";
import { createUserService, getPasswordRulesService, loginUserService, logoutUserService, refreshAccessTokenService, resetPasswordService } from "../services/auth.services";
import type { AuthenticatedRequest, LoginRequest } from "../utilities/utilities";

export const getPasswordRulesController = async(req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rules = await getPasswordRulesService();
    res.json({ rules });
}

export const createUserController = async(req: Request<{}, {}, LoginRequest>, res: Response, next: NextFunction): Promise<void> => {
    const { username, password } = req.body;
    const user = await createUserService(username, password);
    res.status(201).json(user);
};

export const loginUserController = async(req: Request<{}, {}, LoginRequest>, res: Response, next: NextFunction): Promise<void> => {
    const { username, password } = req.body;
    const user = await loginUserService(username, password);
    res.status(201).json(user);
};

export const logoutUserController = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId!;
    await logoutUserService(userId);
    res.json({ message: "Logout successful" });
};

export const refreshAccessTokenController = async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.userId!
    const accessToken = await refreshAccessTokenService(userId);
    res.json({ accessToken });
};

export const resetPasswordController = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const username = req.body.username!;
    const newPassword = req.body.password!;
    await resetPasswordService(username, newPassword);
    res.json({ message: "Password reset successful" });
};