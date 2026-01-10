import express from "express";
import { getCoordinatesController, addCoordinatesController, deleteCoordinatesController } from "../controllers/coordinates.controller";
import { validateTimeStampedCoordinates } from "../middleware/validation.middleware";
import { authenticateAccessToken } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticateAccessToken);

router.get('/me', getCoordinatesController);

router.post('/me', validateTimeStampedCoordinates, addCoordinatesController);

router.delete('/me', deleteCoordinatesController);

export default router;