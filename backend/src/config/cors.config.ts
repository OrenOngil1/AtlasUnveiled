import cors from "cors";

// CORS Configuration
// Allow requests from common frontend development ports
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',  // Vite default
    'http://localhost:5174',
    'http://localhost:8080',
    'http://localhost:4173',  // Vite preview
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
];

const corsOptions: cors.CorsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}

export default corsOptions;