import { deleteUserCoordinatesModel } from "../models/coordinates.models";
import { deleteUserModel, getUserByIdModel } from "../models/user.models"
import type { User } from "../utilities/utilities";
import { NotFoundError } from "../middleware/errorHandler.middleware"
import { db } from "../db/connection";
import { deleteRefreshTokenModel } from "../models/refreshTokens.models";

export const getUserService = async(userId: number): Promise<User> => {
    const user = await getUserByIdModel(userId);
    if(!user) {
        throw new NotFoundError('User not found');
    }

    return user;
}

export const deleteUserService = async(userId: number): Promise<{ message: string }> => {
    const user = await getUserByIdModel(userId);
    if(!user) {
        throw new NotFoundError('User not found');
    }

    // delete all user data or roll back if error occurs
    try {
        db.transaction(async(_) => {
            await deleteUserCoordinatesModel(userId);
            await deleteRefreshTokenModel(userId);
            await deleteUserModel(userId);
        });
        
        return { message: `User ${user.name} deleted successfully` };

    } catch(error) {
        throw new Error("User could not be deleted");
    }
};
        