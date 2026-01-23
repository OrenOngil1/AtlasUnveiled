import { eq, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { discoveredCoordinatesTable } from "../db/schema";
import type { Point, TimestampedPoint } from "../utilities/utilities";

export const addUserCoordinatesModel = async(userId: number, CoordinatesList: TimestampedPoint[]): Promise<void> => {
    if (!CoordinatesList || CoordinatesList.length === 0) {
        return;
    }

    // Insert coordinates individually with ON CONFLICT DO NOTHING
    // This approach works reliably with geometry types in composite primary keys
    // and handles any edge cases (race conditions, etc.) gracefully
    const inserted: Point[] = [];
    
    for (const coord of CoordinatesList) {
        try {
            const rows = await db.insert(discoveredCoordinatesTable)
                .values({
                    userId: userId,
                    coordinates: sql`ST_SetSRID(ST_MakePoint(${coord.x}, ${coord.y}), 4326)`,
                    timestamp: new Date(coord.timestamp)
                })
                .onConflictDoNothing({
                    target: [discoveredCoordinatesTable.userId, discoveredCoordinatesTable.coordinates]
                })
                .returning();
            
            if (rows.length > 0 && rows[0]) {
                inserted.push(rows[0].coordinates);
            }
        } catch (error) {
            // Log but continue - this coordinate might already exist
            // This shouldn't happen with proper frontend logic, but handles edge cases
            console.warn(`[MODEL] Coordinate (${coord.x}, ${coord.y}) skipped:`, error instanceof Error ? error.message : 'unknown error');
        }
    }
    
    if (inserted.length < CoordinatesList.length) {
        console.log(`[MODEL] Inserted ${inserted.length} of ${CoordinatesList.length} coordinates for user ${userId} (${CoordinatesList.length - inserted.length} were duplicates or conflicts)`);
    } else {
        console.log(`[MODEL] Successfully inserted ${inserted.length} coordinates for user ${userId}`);
    }
};

export const getUserCoordinatesModel = async(userId: number): Promise<Point[]> => {
    const rows = await db.select({ coordinates: discoveredCoordinatesTable.coordinates })
        .from(discoveredCoordinatesTable)
        .where(eq(discoveredCoordinatesTable.userId ,userId));

    const coordinatesList = rows.map(row => row.coordinates);
    // console.log(`got for user=${userId} coordinates=${coordinatesList} from database`);
    return coordinatesList;
};

export const deleteUserCoordinatesModel = async(userId: number): Promise<void> => {
    await db.delete(discoveredCoordinatesTable)
            .where(eq(discoveredCoordinatesTable.userId, userId));
};