import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./connection";

import { join } from "path";

const runMigrations = async () => {
    console.log("Running database migrations...");

    try {
        const migrationPath = join(process.cwd(), "drizzle"); // should point to the migrations folder
        await migrate(db, { migrationsFolder: migrationPath });
        console.log("Database migrations completed successfully.");

    } catch (error) {
        console.error("Error running database migrations:", error);
        process.exit(1);

    } finally {
        await pool.end(); // Ensure the pool is closed after migrations
    }
};

runMigrations();