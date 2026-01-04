import express from "express";
import { createUserController, deleteAllUsersController, loginUserController, logoutUserController } from "../controllers/user.controllers";
import { getUserController, deleteUserController, getAllUsersController } from "../controllers/user.controllers";
import { validateIdBody, validateIdParam, validateUserNameAndPassword } from "../middleware/validation.middleware";

const router = express.Router();

router.post("/", validateUserNameAndPassword, createUserController);

router.post("/login", validateUserNameAndPassword, loginUserController);

router.post("/logout", validateIdBody, logoutUserController);

router.get("/:userId", validateIdParam, getUserController);

router.delete("/:userId", validateIdParam, deleteUserController);

// NOTE: This routes are for testing only!
router.get("/", getAllUsersController);

router.delete("/", deleteAllUsersController);

export default router;