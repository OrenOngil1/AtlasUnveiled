import { db } from "../db/connection";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import type { User, UserAccount } from "../utilities/utilities";
// TODO: implement use of JWT

// Returns user data WITHOUT password (safe for general use)
export const getUserByIdModel = async(id: number): Promise<User | undefined> => {
    const rows = await db.select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);
    
    return rows[0];
};

// Returns user data WITH password (for login use)
export const getUserByNameModel = async(name: string): Promise<UserAccount | undefined> => {
    const rows = await db.select({
        id: usersTable.id,
        name: usersTable.name,
        hashedPassword: usersTable.hashedPassword
    })
        .from(usersTable)
        .where(eq(usersTable.name, name))
        .limit(1);

    return rows[0];
};

export const addUserModel = async(name: string, hashedPassword: string): Promise<User | undefined> => {
    const rows = await db.insert(usersTable)
        .values({ name, hashedPassword })
        .returning({ id: usersTable.id, name: usersTable.name });

    const user = rows[0];
    // console.log(`added user=${JSON.stringify(user)} to database`);
    return user;
};



export const deleteUserModel = async(userId: number): Promise<User | undefined> => {
    const rows = await db.delete(usersTable)
        .where(eq(usersTable.id, userId))
        .returning({ id: usersTable.id, name: usersTable.name });

    // console.log(`deleted user=${JSON.stringify(rows[0])} from database`);
    const user = rows[0];;
    return user;
};

export const resetPasswordModel = async(userId: number, newHashedPassword: string): Promise<void> => {
    await db.update(usersTable)
        .set({ hashedPassword: newHashedPassword })
        .where(eq(usersTable.id, userId));    

    // console.log(`reset password for userId=${userId}`);
};

