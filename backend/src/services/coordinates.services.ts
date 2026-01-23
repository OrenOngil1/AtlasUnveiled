import { getUserCoordinatesModel, addUserCoordinatesModel, deleteUserCoordinatesModel } from "../models/coordinates.models"
import { getUserByIdModel } from "../models/user.models";
import type { Point, TimestampedPoint } from "../utilities/utilities";
import { NotFoundError} from "../middleware/errorHandler.middleware";

/**
 * Retrieves all coordinates for a user
 * @param {number} userId - ID of user
 * @returns {Promise<Point[]>} array of coordinates
 * @throws {NotFoundError} if user does not exist
 * @throws {Error} if database operation fails
 */
export const getCoordinatesService = async(userId: number): Promise<Point[]> => {

    if(await getUserByIdModel(userId) === undefined) {
        throw new NotFoundError('User not found');
    }

    return await getUserCoordinatesModel(userId);
}

/**
 * Adds coordinates for a user
 * @param {number} userId - ID of user
 * @param {TimestampedPoint[]} coordinatesList - array of timestamped coordinates
 * @returns {Promise<Point[]>} array of saved coordinates
 * @throws {NotFoundError} if user does not exist
 * @throws {Error} if database operation fails
 */
export const addCoordinatesService = async(userId: number, coordinatesList: TimestampedPoint[]): Promise<void> => {
    if(await getUserByIdModel(userId) === undefined) {
        throw new NotFoundError('User not found');
    }

    await addUserCoordinatesModel(userId, coordinatesList);
}

/**
 * Deletes all coordinates for a user
 * @param {number} userId - ID of user
 * @returns {Promise<Point[]>} array of deleted coordinates
 * @throws {NotFoundError} if user does not exist
 * @throws {Error} if database operation fails
 */
export const deleteCoordinatesService = async(userId: number): Promise<void> => {
    if(await getUserByIdModel(userId) === undefined) {
        throw new NotFoundError('User not found');
    }

    await deleteUserCoordinatesModel(userId);
}