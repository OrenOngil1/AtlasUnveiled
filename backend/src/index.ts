import express, { type Request, type Response, type NextFunction } from "express";
import userRoutes from "./routes/user.routes";
import coordinateRoutes from "./routes/coordinates.routes";
import  errorHandler  from "./middleware/errorHandler.middleware";
import { pool } from "./db/connection";

const app = express();
const port = process.env.PORT || 3000;

// Parse JSON Requests
app.use(express.json());

// Routes
app.use("/users", userRoutes);

app.use("/coordinates", coordinateRoutes);

// 404 Not Found middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ message: "Not Found" });
});

// Error handling middleware
app.use(errorHandler);

// Creates server
const server = app.listen(port, () => {
  console.log(`atlas unveiled server app listening on port ${port}`);
});

// Graceful shutdown
const shutdown = (signal: string): void => {
    console.log(`server received signal ${signal}`);

    // Force exit after 10 seconds
        const forceServerShutdown = setTimeout(() => {
            console.error('Forcing server shutdown after timeout');
            process.exit(1);
        }, 10000);

    server.close(async(error: Error | undefined) => {

        // prevents server from hanging during shutdown
        clearTimeout(forceServerShutdown);

        // error during closing server
        if(error) {
            console.log(`error closing server: ${error}`);
            try{
                await pool.end();
            } catch (poolError) {
                console.error(`error closing database pool: ${poolError}`);
            } finally {
                process.exit(1);
            }
        }

        // close database pool
        try{
            await pool.end();
            console.log(`server closed successfully`);
            process.exit(0);
        } catch (poolError) {
            console.error(`error closing database pool: ${poolError}`);
            process.exit(1);
        }
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);