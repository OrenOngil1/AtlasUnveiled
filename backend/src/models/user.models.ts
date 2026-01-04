import { db } from "../db/connection";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import type { UserData } from "../utilities/utilities";
// TODO: implement use of JWT
export const getUserByIdModel = async(userId: number): Promise<UserData | undefined> => {
    const rows = await db.select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, userId));
    // console.log(`got user ${JSON.stringify(rows[0])} by id ${userId} from database`);
    return rows[0];
}

export const getUserByNameModel = async(username: string): Promise<UserData | undefined> => {
    const rows = await db.select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.name, username));

    // console.log(`got user=${JSON.stringify(rows[0])} by username=${username} from database`);
    return rows[0];
}
// TODO: add password encryption later
export const addUserModel = async(username: string, password: string): Promise<UserData> => {
    const rows = await db.insert(usersTable)
        .values({ name: username, password: password })
        .returning();

    // console.log(`added user=${JSON.stringify(rows[0])} to database`);
    return {id: rows[0]!.id, name: rows[0]!.name };
}

export const deleteUserModel = async(userId: number): Promise<UserData> => {
    const rows = await db.delete(usersTable)
        .where(eq(usersTable.id, userId))
        .returning();
    // console.log(`deleted user=${JSON.stringify(rows[0])} from database`);
    return rows[0] ?? { id: rows[0]!.id, name: rows[0]!.name };
}

export const getAllUsersModel = async(): Promise<UserData[]> => {
    return await db.select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable);
}
// This function is for testing only!
export const deleteAllUsersModel = async(): Promise<UserData[]> => {
    const rows = await db.delete(usersTable).returning();
    // console.log(`deleted users=${rows} from database`);
    return rows.map(r => ({ id: r.id, name: r.name }));
}

