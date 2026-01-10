import express, { type Request, type Response, type NextFunction } from "express";
import userRoutes from "./routes/user.routes";
import coordinateRoutes from "./routes/coordinates.routes";
import authRoutes from "./routes/auth.routes";
import errorHandler  from "./middleware/errorHandler.middleware";
import { pool } from "./db/connection";
import { deleteExpiredRefreshTokensModel } from "./models/refreshTokens.models";

const app = express();
const port = process.env.PORT || 3000;



// Parse JSON Requests
app.use(express.json());

// Routes
app.use("/auth", authRoutes);

app.use("/user", userRoutes);

app.use("/coordinates", coordinateRoutes);

// 404 Not Found middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: "Not Found" });
});

// Error handling middleware
app.use(errorHandler);

// clean up expired refresh tokens daily
setInterval(deleteExpiredRefreshTokensModel, 24 * 60 * 60 * 1000);

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