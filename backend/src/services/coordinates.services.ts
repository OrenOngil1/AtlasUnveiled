import { getUserCoordinatesModel, addUserCoordinatesModel, deleteUserCoordinatesModel } from "../models/coordinates.models"
import { getUserByIdModel } from "../models/user.models";
import type { Point, TimestampedPoint } from "../utilities/utilities";
import { UserNotFoundError } from "../middleware/errorHandler.middleware";

// Need to return in all a JWT
export const getCoordinatesService = async(userId: number): Promise<Point[]> => {

    if(await getUserByIdModel(userId) === undefined) {
        throw new UserNotFoundError();
    }

    return await getUserCoordinatesModel(userId);
}

export const addCoordinatesService = async(userId: number, coordinatesList: TimestampedPoint[]): Promise<Point[]> => {
    if(await getUserByIdModel(userId) === undefined) {
        throw new UserNotFoundError();
    }

    return await addUserCoordinatesModel(userId, coordinatesList);
}

export const deleteCoordinatesService = async(userId: number): Promise<Point[]> => {
    if(await getUserByIdModel(userId) === undefined) {
        throw new UserNotFoundError();
    }

    return await deleteUserCoordinatesModel(userId);
}