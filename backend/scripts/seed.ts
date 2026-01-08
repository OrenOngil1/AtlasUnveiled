import { db, pool } from "../src/db/connection";
import { discoveredCoordinatesTable, usersTable } from "../src/db/schema";
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
            { name: "alice", hashedPassword: await bcrypt.hash("Password123", 10) },
            { name: "bob", hashedPassword: await bcrypt.hash("Password123", 10) }
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

        console.log(`Created users: `);
        console.log(`${user1.name} (id=${user1.id}, password=Password123),`);
        console.log(`${user2.name} (id=${user2.id}, password=Password123)`);

        console.log(`Created initial coordinates for users:`);
        console.log(`- User ${user1.name} (id=${user1.id}): (10,20), (15,25)`);
        console.log(`- User ${user2.name} (id=${user2.id}): (10,20), (20,40)`);

    } catch (error) {
        console.error("Seeding failed:", error);
        console.log("================================================");
        process.exit(1);

    } finally {
        await pool.end(); // Ensure the pool is closed after seeding
        console.log("================================================");
    }
};

seed();