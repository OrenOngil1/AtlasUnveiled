import express from "express";
import { getCoordinatesController, addCoordinatesController, deleteCoordinatesController } from "../controllers/coordinates.controller";
import { validateCoordinates, validateIdParam } from "../middleware/validation.middleware";

const router = express.Router();

router.get("/:userId", validateIdParam, getCoordinatesController);

router.post("/:userId", validateIdParam, validateCoordinates, addCoordinatesController);

router.delete("/:userId", validateIdParam, deleteCoordinatesController);

export default router;