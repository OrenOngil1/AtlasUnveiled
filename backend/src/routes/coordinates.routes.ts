import express from "express";
import { getCoordinatesController, addCoordinatesController, deleteCoordinatesController } from "../controllers/coordinates.controller";
import { validateIdParam, validateTimeStampedCoordinates } from "../middleware/validation.middleware";

const router = express.Router();

router.get("/:userId", validateIdParam, getCoordinatesController);

router.post("/:userId", validateIdParam, validateTimeStampedCoordinates, addCoordinatesController);

router.delete("/:userId", validateIdParam, deleteCoordinatesController);

export default router;