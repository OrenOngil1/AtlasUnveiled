import { db } from "../db/connection";
import { refreshTokensTable } from "../db/schema";
import { eq, and, gt, lte } from "drizzle-orm";

export const addRefreshTokenModel = async(userId: number, hashedToken: string, expiredAt: Date): Promise<void> => {
    await db.insert(refreshTokensTable).values({ userId, hashedToken, expiredAt });
};

export const getValidRefreshTokenModel = async(userId: number): Promise<string | undefined> => {
    const currentTime = new Date();

    return await db.select({ hashedToken: refreshTokensTable.hashedToken })
        .from(refreshTokensTable)
        .where(and(
            eq(refreshTokensTable.userId, userId),
            gt(refreshTokensTable.expiredAt, currentTime)
        ))
        .limit(1)
        .then(rows => rows[0]?.hashedToken);
};

export const deleteRefreshTokenModel = async(userId: number): Promise<void> => {
    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.userId, userId));
};

export const deleteExpiredRefreshTokensModel = async(): Promise<void> => {
    const currentTime = new Date();

    await db.delete(refreshTokensTable).where(lte(refreshTokensTable.expiredAt, currentTime));
};