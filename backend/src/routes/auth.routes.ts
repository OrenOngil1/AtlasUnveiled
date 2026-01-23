import express from "express";
import { authenticateAccessToken, authenticateRefreshToken } from "../middleware/auth.middleware";
import { createUserController, getPasswordRulesController, loginUserController, logoutUserController, refreshAccessTokenController, resetPasswordController } from "../controllers/auth.controllers";
import { validateUserNameAndPassword } from "../middleware/validation.middleware";

const router = express.Router();

router.get('/password-rules', getPasswordRulesController);

router.post('/register', validateUserNameAndPassword, createUserController);

router.post('/login', validateUserNameAndPassword, loginUserController);

router.post('/logout', authenticateAccessToken, logoutUserController);

router.post('/refresh', authenticateRefreshToken, refreshAccessTokenController);

router.post('/reset-password', authenticateAccessToken, validateUserNameAndPassword, resetPasswordController);

export default router;