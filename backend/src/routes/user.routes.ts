import express from "express";
import { createUserController, loginUserController, logoutUserController } from "../controllers/user.controllers";
import { getUserController, deleteUserController } from "../controllers/user.controllers";
import { validateIdBody, validateIdParam, validateUserNameAndPassword } from "../middleware/validation.middleware";

const router = express.Router();

router.post("/", validateUserNameAndPassword, createUserController);

router.post("/login", validateUserNameAndPassword, loginUserController);

router.post("/logout", validateIdBody, logoutUserController);

router.get("/:userId", validateIdParam, getUserController);

router.delete("/:userId", validateIdParam, deleteUserController);

export default router;