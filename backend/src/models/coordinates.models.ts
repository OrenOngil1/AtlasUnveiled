import { eq, sql } from "drizzle-orm";
import { db } from "../db/connection";
import { discoveredCoordinatesTable } from "../db/schema";
import type { Point } from "../utilities/utilities";
// TODO: implement use of JWT
export const addUserCoordinatesModel = async(userId: number, CoordinatesList: Point[]): Promise<Point[]> => {
    const rows = await db.insert(discoveredCoordinatesTable)
            .values(CoordinatesList.map(coordinates => ({
                userId: userId,
                coordinates: sql`ST_SetSRID(ST_MakePoint(${coordinates.x}, ${coordinates.y}), 4326)`
            })
        )
    ).returning();
    
    const coordinatesInserted: Point[] = rows.map(r => r.coordinates);
    console.log(`inserted to user=${rows[0]!.userId} coordinates list=${coordinatesInserted} from database`);
    return coordinatesInserted;
};

export const getUserCoordinatesModel = async(userId: number): Promise<Point[]> => {
    const rows = await db.select({ coordinates: discoveredCoordinatesTable.coordinates })
        .from(discoveredCoordinatesTable)
        .where(eq(discoveredCoordinatesTable.userId ,userId));

    const coordinatesList: Point[] = rows.map(row => row.coordinates);
    console.log(`got for user=${userId} coordinates=${coordinatesList} from database`);
    return coordinatesList;
};

export const deleteUserCoordinatesModel = async(userId: number): Promise<Point[]> => {
    const rows = await db.delete(discoveredCoordinatesTable)
            .where(eq(discoveredCoordinatesTable.userId, userId))
            .returning();

    const coordinatesDeleted = rows.map(r => r.coordinates);
    console.log(`deleted for user=${userId} coordinates list=${coordinatesDeleted}`);
    return coordinatesDeleted;
};