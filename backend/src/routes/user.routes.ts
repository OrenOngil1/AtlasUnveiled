import express from "express";
import { getUserController, deleteUserController } from "../controllers/user.controllers";
import { authenticateAccessToken } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticateAccessToken);

router.get('/me', getUserController);

router.delete('/me', deleteUserController);

export default router;