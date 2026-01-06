import { db, pool } from "../db/connection";
import { discoveredCoordinatesTable, usersTable } from "./schema";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";

// Seed function to populate the database with initial data for testing/development
const seed  = async () => {
    console.log("Seeding database with initial data...");

    try {
        // delete existing data, WARNING: this will remove all existing data
        await db.delete(discoveredCoordinatesTable);
        await db.delete(usersTable);

        // add initial users
        const users = await db.insert(usersTable).values([
            { name: "alice", password: await bcrypt.hash("Password123", 10) },
            { name: "bob", password: await bcrypt.hash("Password123", 10) }
        ]).returning();

        const user1 = users[0]!;
        const user2 = users[1]!;

        // add initial coordinates for users
        await db.insert(discoveredCoordinatesTable).values([
            { userId: user1.id, coordinates: sql`ST_SetSRID(ST_MakePoint(10, 20), 4326)`, timestamp: new Date() },
            { userId: user1.id, coordinates: sql`ST_SetSRID(ST_MakePoint(15, 25), 4326)`, timestamp: new Date() },
            { userId: user2.id, coordinates: sql`ST_SetSRID(ST_MakePoint(10, 20), 4326)`, timestamp: new Date() },
            { userId: user2.id, coordinates: sql`ST_SetSRID(ST_MakePoint(20, 40), 4326)`, timestamp: new Date() }
        ]);

        console.log("Seeding completed!");

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);

    } finally {
        await pool.end(); // Ensure the pool is closed after seeding
    }
};

seed();