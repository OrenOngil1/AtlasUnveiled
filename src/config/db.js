import { Client } from "pg";

export const db = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function getPgVersion() {
    try {
        await db.connect();
        const result = await db.query("SELECT version()");
        console.log(result.rows[0]);
    } finally {
        await db.end();
    }
};

getPgVersion();