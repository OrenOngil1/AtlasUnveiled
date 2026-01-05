import "dotenv/config";
import express from "express";
import userRoutes from "./routes/user.routes";
import coordinateRoutes from "./routes/coordinates.routes";
import { pool } from "./db/connection";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    // In production, specify your app's origin:
    // origin: ['http://localhost:5173', 'capacitor://localhost', 'http://localhost'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Parse JSON Requests
app.use(express.json());

// Routes
app.use("/users", userRoutes);

app.use("/coordinates", coordinateRoutes);

// Creates server
const server = app.listen(port, () => {
  console.log(`atlas unveiled server app listening on port ${port}`);
});

// Graceful shutdown
const shutdown = (signal: string): void => {
    console.log(`server received signal ${signal}`);
    server.close(async(error: Error | undefined) => {
        if(error) {
            await pool.end();
            console.log(`error closing server`);
            process.exit(1);
        }
        await pool.end();
        console.log(`server closed`);
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);