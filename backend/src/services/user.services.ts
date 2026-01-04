import { deleteUserCoordinatesModel } from "../models/coordinates.models";
import { addUserModel, deleteAllUsersModel, deleteUserModel, getAllUsersModel, getUserByIdModel, getUserByNameModel } from "../models/user.models"
import type { Point, UserData } from "../utilities/utilities";
import { UserAlreadyExistsError, UserNotFoundError } from "../utilities/customErrors.utilities"
// implement use of jwt
export const createUserService = async(userName: string, password: string): Promise<UserData> => {
    if(await getUserByNameModel(userName)) {
        throw new UserAlreadyExistsError();
    }
    return await addUserModel(userName, password);
}

export const loginUserService = async(username: string, password: string): Promise<UserData> => {
    const user = await getUserByNameModel(username);
    if(user === undefined) {
        throw new UserNotFoundError();
    }

    // console.log(`user ${user} logged in`);
    return user;
}

export const logoutUserService = async(userId: number): Promise<void> => {
    const user = await getUserByIdModel(userId);
    if(user === undefined) {
        throw new UserNotFoundError();
    }

    //add check to see if user is logged in, if not throw 409 error
    console.log(`user ${user} logged out`);
}

export const getUserService = async(userId: number): Promise<UserData> => {
    const user = await getUserByIdModel(userId);
    if(user === undefined) {
        throw new UserNotFoundError();
    }

    return user;
}

export const deleteUserService = async(userId: number): Promise<UserData> => {
    if(getUserByIdModel(userId) === undefined) {
        throw new UserNotFoundError();
    }

    // may discard return value of the delete operation
    const coordinatesDeleted: Point[] = await deleteUserCoordinatesModel(userId);
    const userDeleted: UserData = await deleteUserModel(userId);
    // checks internal deletion operations were completed
    if(userDeleted == undefined) {
        throw new Error();
    }

    return userDeleted;
}