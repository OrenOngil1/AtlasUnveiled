import { db } from "../db/connection";
import { ConflictError, NotFoundError, UnauthorizedError } from "../middleware/errorHandler.middleware";
import { addRefreshTokenModel, deleteRefreshTokenModel, getValidRefreshTokenModel } from "../models/refreshTokens.models";
import { addUserModel, getUserByIdModel, getUserByNameModel, resetPasswordModel } from "../models/user.models";
import { compareHash, hash } from "../utilities/hash";
import { generateAccessAndRefreshTokens, generateAccessToken, getTokenExpiry } from "../utilities/token";
import type { AuthenticatedUser, ClientRule } from "../utilities/utilities";
import { rules } from "../middleware/passwordRules.middleware";


/** * Retrieves password rules for client-side validation
 * @returns {Promise<ClientRule[]>} array of password rules
 */
export const getPasswordRulesService = async(): Promise<ClientRule[]> => {
    return rules.map(rule => ({ type: rule.type, value: rule.value, message: rule.message }));
};

/**
 * Creates a new user account with authentication tokens
 * @param {string} username - unique username for new account
 * @param {string} password - plaintext password to be hashed
 * @returns {Promise<AuthenticatedUser>} user data with access and refresh tokens
 * @throws {ConflictError} if username already exists
 * @throws {Error} if token generation or database operation fails
 */
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

/**
 * Authenticates user and generates session tokens
 * @param {string} username - username to authenticate
 * @param {string} password - plaintext password to verify
 * @returns {Promise<AuthenticatedUser>} user data with access and refresh tokens
 * @throws {UnauthorizedError} if credentials are invalid
 * @throws {Error} if token generation or database operation fails
 */
export const loginUserService = async(username: string, password: string): Promise<AuthenticatedUser> => {
    // checks if user exists
    const user = await getUserByNameModel(username);
    if(!user) {
        throw new UnauthorizedError('username or password are incorrect');
    }

    // compares passwords
    const isPasswordValid = await compareHash(password, user.hashedPassword);
    if(!isPasswordValid) {
        throw new UnauthorizedError('username or password are incorrect');
    }

    // generates tokens
    const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user.id);

    // stores hashed refresh token
    const refreshTokenExpiry = getTokenExpiry(refreshToken);
    if(!refreshTokenExpiry) {
        throw new Error("Could not get refresh token expiry");
    }

    await db.transaction(async(_) => {
        await deleteRefreshTokenModel(user.id); // delete old token if exists
        await addRefreshTokenModel(user.id, await hash(refreshToken), refreshTokenExpiry);
    });

    // console.log(`user=${JSON.stringify(user)} logged in`);
    return { user: { id: user.id , name: user.name }, accessToken: accessToken, refreshToken: refreshToken };
};


/**
 * Logs out user by invalidating refresh token
 * @param {number} userId - ID of user to logout
 * @returns {Promise<void>}
 * @throws {NotFoundError} if user does not exist
 * @throws {Error} if database operation fails
 */
export const logoutUserService = async(userId: number): Promise<void> => {
    const user = await getUserByIdModel(userId);

    // checks if user exists
    if(!user) {
        throw new NotFoundError('User not found');
    }
    
    await deleteRefreshTokenModel(userId);
    // console.log(`user${JSON.stringify(user)} logged out`);
}

/**
 * Generates new access token from valid refresh token
 * @param {number} userId - ID of user requesting token refresh
 * @returns {Promise<string>} new access token
 * @throws {NotFoundError} if user does not exist
 * @throws {UnauthorizedError} if refresh token expired or not found
 * @throws {Error} if token generation fails
 */
export const refreshAccessTokenService = async(userId: number): Promise<string> => {
    // checks if user exists
    const user = await getUserByIdModel(userId);
    if(!user) {
        throw new NotFoundError('User not found');
    }

    // local refresh token mustn't be expired
    const refreshToken = await getValidRefreshTokenModel(userId);
    if(!refreshToken) {
        throw new UnauthorizedError("Session expired");
    }

    return generateAccessToken(userId);
};

/**
 * Resets user password
 * @param {string} username - username of account to update
 * @param {string} newPassword - new plaintext password
 * @returns {Promise<void>}
 * @throws {NotFoundError} if user does not exist
 * @throws {Error} if hashing or database operation fails
 */
export const resetPasswordService = async(username: string, newPassword: string): Promise<void> => {
    // checks if user exists
    const user = await getUserByNameModel(username);
    if(!user) {
        throw new NotFoundError('User not found');
    }

    // stores hash of new password
    await resetPasswordModel(user.id, await hash(newPassword));
};