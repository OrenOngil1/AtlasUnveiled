import { deleteUserCoordinatesModel } from "../models/coordinates.models";
import { addUserModel, deleteUserModel, getUserByIdModel, getUserByNameModel } from "../models/user.models"
import type { UserData } from "../utilities/utilities";
import { UserAlreadyExistsError, UserNotFoundError, WrongPasswordError } from "../middleware/errorHandler.middleware"
import bcrypt from 'bcrypt'; 
import { db } from "../db/connection";

// implement use of jwt
export const createUserService = async(userName: string, password: string): Promise<UserData> => {
    // usernames must be unique
    if(await getUserByNameModel(userName)) {
        throw new UserAlreadyExistsError();
    }

    // password encryption
    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(password, saltRound);

    const userAdded = await addUserModel(userName, hashedPassword);
    if(!userAdded) {
        throw new Error("User could not be created");
    }

    return userAdded;
}

export const loginUserService = async(username: string, password: string): Promise<UserData> => {
    // checks if user exists
    const user = await getUserByNameModel(username);
    if(!user) {
        throw new UserNotFoundError();
    }

    // compares passwords
    if(!await bcrypt.compare(password, user.password)) {
        throw new WrongPasswordError();
    }

    // add logic to set user as logged in

    console.log(`user=${JSON.stringify(user)} logged in`);
    return { id: user.id, name: user.name };
}

export const logoutUserService = async(userId: number): Promise<void> => {
    const user = await getUserByIdModel(userId);
    if(user === undefined) {
        throw new UserNotFoundError();
    }

    // add check to see if user is logged in, if not throw 409 error

    // add logout logic later

    console.log(`user=${JSON.stringify(user)} logged out`);
}

export const getUserService = async(userId: number): Promise<UserData> => {
    const user = await getUserByIdModel(userId);
    if(user === undefined) {
        throw new UserNotFoundError();
    }

    // add check to see if user is logged in, if not throw 409 error

    return user;
}

export const deleteUserService = async(userId: number): Promise<{ message: string }> => {
    const user = await getUserByIdModel(userId);
    if(user === undefined) {
        throw new UserNotFoundError();
    }

    // add check to see if user is logged in, if not throw 409 error

    // delete all user data or roll back if error occurs
    try {
        db.transaction(async(_) => {
            await deleteUserCoordinatesModel(userId);
            await deleteUserModel(userId);
        });
        
        return { message: `User ${user.name} deleted successfully` };

    } catch(error) {
        throw new Error("User could not be deleted");
    }
};
        