import { db } from "../db/connection";
import { ConflictError, ExpiredSessionError, NotFoundError, UnauthorizedError } from "../middleware/errorHandler.middleware";
import { addRefreshTokenModel, deleteRefreshTokenModel, getValidRefreshTokenModel } from "../models/refreshTokens.models";
import { addUserModel, getUserByIdModel, getUserByNameModel, resetPasswordModel } from "../models/user.models";
import { compareHash, hash } from "../utilities/hash";
import { generateAccessAndRefreshTokens, generateAccessToken, getTokenExpiry } from "../utilities/token";
import type { AuthenticatedUser } from "../utilities/utilities";

export const createUserService = async(username: string, password: string): Promise<AuthenticatedUser> => {
    // usernames must be unique
    if(await getUserByNameModel(username)) {
        throw new ConflictError('Username already exists');
    }

    return await db.transaction(async(_) => {
        // adds new user to database, hashing password
        const userAdded = await addUserModel(username, await hash(password));

        // generates tokens
        const { accessToken, refreshToken } = generateAccessAndRefreshTokens(userAdded!.id);

        // stores hashed refresh token in database
        const refreshTokenExpiry = getTokenExpiry(refreshToken);
        if(!refreshTokenExpiry) {
            throw new Error("Could not get refresh token expiry");
        }
        await addRefreshTokenModel(userAdded!.id, await hash(refreshToken), refreshTokenExpiry);

        return {user: userAdded!, accessToken: accessToken, refreshToken: refreshToken };
    });
};

export const loginUserService = async(username: string, password: string): Promise<AuthenticatedUser> => {
    // checks if user exists
    const user = await getUserByNameModel(username);
    if(!user) {
        throw new UnauthorizedError('username or password are incorrect');
    }

    // compares passwords
    if(!await compareHash(password, user.hashedPassword)) {
        throw new UnauthorizedError('username or password are incorrect');
    }

    // generate tokens
    const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user.id);

    // store refresh token
    const hashedToken = await hash(refreshToken);
    const refreshTokenExpiry = getTokenExpiry(refreshToken);
    if(!refreshTokenExpiry) {
        throw new Error("Could not get refresh token expiry");
    }

    await db.transaction(async(_) => {
        await deleteRefreshTokenModel(user.id); // delete old token if exists
        await addRefreshTokenModel(user.id, hashedToken, refreshTokenExpiry);
    });

    // console.log(`user=${JSON.stringify(user)} logged in`);
    return { user: user, accessToken: accessToken, refreshToken: refreshToken };
}

export const logoutUserService = async(userId: number): Promise<void> => {
    const user = await getUserByIdModel(userId);

    // checks if user exists
    if(!user) {
        throw new NotFoundError('User not found');
    }
    
    await deleteRefreshTokenModel(userId);
    // console.log(`user${JSON.stringify(user)} logged out`);
}

export const refreshAccessTokenService = async(userId: number): Promise<string> => {
    // checks if user exists
    const user = await getUserByIdModel(userId);
    if(!user) {
        throw new NotFoundError('User not found');
    }

    // local refresh token mustn't be expired
    const refreshToken = await getValidRefreshTokenModel(userId);
    if(!refreshToken) {
        throw new ExpiredSessionError();
    }

    return generateAccessToken(userId);
};


export const resetPasswordService = async(username: string, newPassword: string): Promise<void> => {
    // checks if user exists
    const user = await getUserByNameModel(username);
    if(!user) {
        throw new NotFoundError('User not found');
    }

    // stores hash of new password
    await resetPasswordModel(user.id, await hash(newPassword));
};