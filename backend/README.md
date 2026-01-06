# Atlas Unveiled - Complete API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Core Components](#core-components)
7. [Middleware](#middleware)
8. [Error Handling](#error-handling)
9. [Data Models & Services](#data-models--services)
10. [Security](#security)
11. [Development Guide](#development-guide)

---

## Overview

Atlas Unveiled is a geographic discovery tracking application built with Node.js, Express, TypeScript, and PostgreSQL with PostGIS. The application allows users to create accounts, authenticate, and track geographic coordinates they've discovered.

### Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: Drizzle ORM
- **Authentication**: Bcrypt password hashing
- **Validation**: Custom middleware

---

## Architecture

The application follows a layered architecture pattern:

```
┌─────────────────────────────────────┐
│         Routes Layer                │
│   (user.routes / coordinates.routes)│
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Middleware Layer               │
│  (validation / error handling)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Controllers Layer              │
│  (user.controllers / coordinates)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Services Layer                │
│  (business logic / authentication)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Models Layer                 │
│   (database operations)             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Database                    │
│   (PostgreSQL + PostGIS)            │
└─────────────────────────────────────┘
```

### Project Structure

project-root/
  ├── src/
  │   ├── index.ts
  │   ├── db/
  │   ├── routes/
  │   └── ... (as documented)
  ├── drizzle/           # Migration files
  ├── node_modules/
  ├── package.json
  ├── tsconfig.json
  ├── .env
  └── README.md

```
project-root/
  ├── src/
  │   ├── index.ts                      # Application entry point
  │   ├── db/
  │   │   ├── connection.ts             # Database connection pool
  │   │   ├── schema.ts                 # Drizzle schema definitions
  │   │   ├── migrate.ts                # Migration runner
  │   │   └── seed.ts                   # Database seeding script
  │   ├── routes/
  │   │   ├── user.routes.ts            # User endpoint routes
  │   │   └── coordinates.routes.ts     # Coordinates endpoint routes
  │   ├── controllers/
  │   │   ├── user.controllers.ts       # User request handlers
  │   │   └── coordinates.controller.ts # Coordinates request handlers
  │   ├── services/
  │   │   ├── user.services.ts          # User business logic
  │   │   └── coordinates.services.ts   # Coordinates business logic
  │   ├── models/
  │   │   ├── user.models.ts            # User database operations
  │   │   └── coordinates.models.ts     # Coordinates database operations
  │   ├── middleware/
  │   │   ├── validation.middleware.ts  # Input validation
  │   │   ├── passwordRules.middleware.ts # Password strength validation
  │   │   └── errorHandler.middleware.ts # Error handling
  │   └── utilities/
  │       └── utilities.ts              # Type definitions and helpers
  ├── drizzle/           # Migration files
  ├── node_modules/
  ├── package.json
  ├── tsconfig.json
  ├── .env
  └── README.md  
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+) with PostGIS extension
- npm or yarn

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/atlas_unveiled
PORT=3000
```

### Installation

```bash
# Install dependencies
npm install

# Run migrations
npm run db:migrate

# Seed database (optional - for development)
npm run db:seed

# Start server
npm start
```

### Server Startup

The server listens on port 3000 (or `PORT` environment variable) and implements graceful shutdown:

```typescript
// Handles SIGINT and SIGTERM signals
// Closes server connections
// Closes database pool
// Force exits after 10 seconds if graceful shutdown fails
```

---

## Database Schema

### Users Table

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, IDENTITY | Auto-generated user ID |
| `name` | TEXT | NOT NULL, UNIQUE | Username |
| `password` | TEXT | NOT NULL | Bcrypt-hashed password |

### Discovered Coordinates Table

Tracks geographic locations discovered by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | INTEGER | FK → users(id), PK | User who discovered the location |
| `coordinates` | GEOMETRY(POINT) | NOT NULL, PK | PostGIS point (SRID 4326) |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Discovery timestamp |

**Composite Primary Key**: (`user_id`, `coordinates`) - prevents duplicate discoveries

### Relationships

- One user can have many discovered coordinates (1:N)
- Foreign key ensures referential integrity
- Coordinates must be deleted before user deletion

---

## API Endpoints

### User Endpoints

#### Create User

Creates a new user account.

```
POST /users
Content-Type: application/json

{
  "username": "alice",
  "password": "Password123"
}
```

**Validation**:
- Username: required, string
- Password: required, min 8 chars, 1 uppercase, 1 lowercase, 1 digit

**Response**: `201 Created`
```json
{
  "id": 1,
  "name": "alice"
}
```

**Errors**:
- `400`: Invalid input or weak password
- `409`: User already exists

---

#### Login User

Authenticates a user.

```
POST /users/login
Content-Type: application/json

{
  "username": "alice",
  "password": "Password123"
}
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "name": "alice"
}
```

**Errors**:
- `400`: Missing credentials
- `401`: Invalid username or password

---

#### Logout User

Logs out a user (currently placeholder for future JWT implementation).

```
POST /users/logout
Content-Type: application/json

{
  "userId": 1
}
```

**Response**: `200 OK`

**Errors**:
- `400`: Missing or invalid user ID
- `404`: User not found

---

#### Get User

Retrieves user information by ID.

```
GET /users/:userId
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "name": "alice"
}
```

**Errors**:
- `400`: Invalid user ID format
- `404`: User not found

---

#### Delete User

Deletes a user and all their discovered coordinates.

```
DELETE /users/:userId
```

**Response**: `200 OK`
```json
{
  "message": "User alice deleted successfully"
}
```

**Errors**:
- `400`: Invalid user ID format
- `404`: User not found

**Note**: Uses transaction to ensure both user and coordinates are deleted atomically.

---

### Coordinates Endpoints

#### Get User Coordinates

Retrieves all coordinates discovered by a user.

```
GET /coordinates/:userId
```

**Response**: `200 OK`
```json
[
  { "x": -122.4194, "y": 37.7749 },
  { "x": -118.2437, "y": 34.0522 }
]
```

**Errors**:
- `400`: Invalid user ID format
- `404`: User not found

---

#### Add Coordinates

Adds new discovered coordinates for a user.

```
POST /coordinates/:userId
Content-Type: application/json

{
  "coordinates": [
    { "x": -122.4194, "y": 37.7749, "timestamp": 1704556800000 },
    { "x": -118.2437, "y": 34.0522, "timestamp": 1704556900000 }
  ]
}
```

**Coordinate Format**:
- `x`: Longitude (-180 to 180)
- `y`: Latitude (-90 to 90)
- `timestamp`: Unix timestamp in milliseconds

**Response**: `201 Created`
```json
[
  { "x": -122.4194, "y": 37.7749 },
  { "x": -118.2437, "y": 34.0522 }
]
```

**Errors**:
- `400`: Invalid user ID or coordinates format
- `404`: User not found
- `409`: Duplicate coordinate for user (composite key violation)

---

#### Delete User Coordinates

Deletes all coordinates for a user.

```
DELETE /coordinates/:userId
```

**Response**: `200 OK`
```json
[
  { "x": -122.4194, "y": 37.7749 },
  { "x": -118.2437, "y": 34.0522 }
]
```

**Errors**:
- `400`: Invalid user ID format
- `404`: User not found

---

## Core Components

### Application Entry Point (`index.ts`)

Main server configuration and startup.

**Features**:
- Express app initialization
- JSON body parsing
- Route mounting
- 404 handler
- Global error handler
- Graceful shutdown on SIGINT/SIGTERM

**Graceful Shutdown Process**:
1. Receives shutdown signal (SIGINT or SIGTERM)
2. Stops accepting new connections
3. Closes existing connections (10-second timeout)
4. Closes database pool
5. Exits process

```typescript
// Force shutdown after 10 seconds
const forceServerShutdown = setTimeout(() => {
  console.error('Forcing server shutdown after timeout');
  process.exit(1);
}, 10000);
```

---

### Database Connection (`connection.ts`)

Manages PostgreSQL connection pool.

```typescript
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

export const db = drizzle(pool, { schema });
```

**Key Points**:
- Connection pool for efficient connection reuse
- Schema integration with Drizzle ORM
- Must be properly closed during shutdown

---

### Database Migrations (`migrate.ts`)

Runs Drizzle ORM migrations.

```bash
npm run db:migrate
```

**Process**:
1. Locates migration files in `drizzle/` folder
2. Applies pending migrations
3. Closes database pool
4. Exits with appropriate status code

---

### Database Seeding (`seed.ts`)

Populates database with test data.

```bash
npm run db:seed
```

**⚠️ Warning**: Deletes all existing data!

**Seeds**:
- 2 users: alice and bob (password: "Password123")
- 4 sample coordinates distributed between users

---

## Middleware

### Validation Middleware (`validation.middleware.ts`)

Validates request data before processing.

#### `validateUserNameAndPassword`

Validates login/registration credentials.

**Checks**:
- Username is a non-empty string
- Password is a non-empty string
- Password meets strength requirements

**Usage**:
```typescript
router.post("/", validateUserNameAndPassword, createUserController);
```

---

#### `validateIdParam`

Validates user ID from URL parameters.

**Checks**:
- ID parameter exists
- ID is numeric

**Usage**:
```typescript
router.get("/:userId", validateIdParam, getUserController);
```

---

#### `validateIdBody`

Validates user ID from request body.

**Checks**:
- ID in body exists
- ID is numeric

**Usage**:
```typescript
router.post("/logout", validateIdBody, logoutUserController);
```

---

#### `validateTimeStampedCoordinates`

Validates coordinate array format.

**Checks**:
- Coordinates is an array
- Each element has valid `x`, `y`, and `timestamp` numbers

**Usage**:
```typescript
router.post("/:userId", 
  validateIdParam, 
  validateTimeStampedCoordinates, 
  addCoordinatesController
);
```

---

### Password Rules Middleware (`passwordRules.middleware.ts`)

Enforces password strength requirements.

**Rules**:
1. Minimum 8 characters
2. At least one uppercase letter
3. At least one lowercase letter
4. At least one digit

**Function**: `validatePasswordStrength(password: string): string[]`

Returns array of error messages for failed rules.

```typescript
const errors = validatePasswordStrength("weak");
// Returns: [
//   "Password must be at least 8 characters long",
//   "Password must contain at least one uppercase letter",
//   "Password must contain at least one digit"
// ]
```

---

### Error Handler Middleware (`errorHandler.middleware.ts`)

Centralized error handling.

#### Custom Error Classes

All extend `AppError` base class:

| Error Class | Status Code | Description |
|-------------|-------------|-------------|
| `UserAlreadyExistsError` | 409 | Username already taken |
| `WrongPasswordError` | 401 | Password doesn't match |
| `UserNotFoundError` | 404 | User doesn't exist |
| `ActiveSessionError` | 409 | User already logged in |
| `SessionExpiredError` | 401 | Session expired |

#### Error Handler Function

```typescript
export const handleError = (
  error: AppError | Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  if(error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
  } else {
    console.error(`Unhandled error: ${error.message}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
```

**Usage**:
```typescript
app.use(errorHandler);
```

---

## Data Models & Services

### User Models (`user.models.ts`)

Direct database operations for users.

#### `getUserByIdModel(userId: number): Promise<UserData | undefined>`

Retrieves user without password (safe for general use).

```typescript
const user = await getUserByIdModel(1);
// Returns: { id: 1, name: "alice" }
```

---

#### `getUserByNameModel(username: string): Promise<User | undefined>`

Retrieves user with password (for authentication only).

```typescript
const user = await getUserByNameModel("alice");
// Returns: { id: 1, name: "alice", password: "hashed..." }
```

---

#### `addUserModel(username: string, password: string): Promise<UserData | undefined>`

Creates a new user.

```typescript
const user = await addUserModel("alice", hashedPassword);
```

**Note**: Password should already be hashed before calling.

---

#### `deleteUserModel(userId: number): Promise<UserData | undefined>`

Deletes a user.

```typescript
const deleted = await deleteUserModel(1);
```

**Note**: Delete coordinates first to avoid foreign key violations.

---

#### `getAllUsersModel(): Promise<UserData[]>`

Retrieves all users (without passwords).

---

#### `deleteAllUsersModel(): Promise<UserData[]>`

**⚠️ Testing only!** Deletes all users.

---

### User Services (`user.services.ts`)

Business logic layer for user operations.

#### `createUserService(userName: string, password: string): Promise<UserData>`

Creates a new user with hashed password.

**Process**:
1. Check username uniqueness
2. Hash password with bcrypt (10 salt rounds)
3. Insert user into database
4. Return user data (without password)

**Throws**:
- `UserAlreadyExistsError`: Username taken

---

#### `loginUserService(username: string, password: string): Promise<UserData>`

Authenticates a user.

**Process**:
1. Find user by username
2. Compare password with bcrypt
3. Return user data (without password)

**Throws**:
- `UserNotFoundError`: User doesn't exist
- `WrongPasswordError`: Password incorrect

**TODO**: Set user as logged in (JWT implementation pending)

---

#### `logoutUserService(userId: number): Promise<void>`

Logs out a user.

**Throws**:
- `UserNotFoundError`: User doesn't exist

**TODO**: Check session status, clear session (JWT implementation pending)

---

#### `getUserService(userId: number): Promise<UserData>`

Retrieves user information.

**Throws**:
- `UserNotFoundError`: User doesn't exist

**TODO**: Check session status (JWT implementation pending)

---

#### `deleteUserService(userId: number): Promise<{ message: string }>`

Deletes a user and all their coordinates.

**Process**:
1. Verify user exists
2. Begin transaction
3. Delete user's coordinates
4. Delete user
5. Commit transaction

**Throws**:
- `UserNotFoundError`: User doesn't exist
- `Error`: Transaction failed

---

### Coordinates Models (`coordinates.models.ts`)

Direct database operations for coordinates.

#### `addUserCoordinatesModel(userId: number, coordinatesList: TimestampedPoint[]): Promise<Point[]>`

Adds coordinates for a user.

**PostGIS Usage**:
```typescript
coordinates: sql`ST_SetSRID(ST_MakePoint(${x}, ${y}), 4326)`
```

Returns array of inserted coordinates.

---

#### `getUserCoordinatesModel(userId: number): Promise<Point[]>`

Retrieves all coordinates for a user.

```typescript
const coords = await getUserCoordinatesModel(1);
// Returns: [{ x: -122.4194, y: 37.7749 }, ...]
```

---

#### `deleteUserCoordinatesModel(userId: number): Promise<Point[]>`

Deletes all coordinates for a user, returns deleted coordinates.

---

### Coordinates Services (`coordinates.services.ts`)

Business logic layer for coordinate operations.

All coordinate services verify user existence before operations:

#### `getCoordinatesService(userId: number): Promise<Point[]>`

Retrieves user's discovered coordinates.

**Throws**: `UserNotFoundError`

---

#### `addCoordinatesService(userId: number, coordinatesList: Point[]): Promise<Point[]>`

Adds new discovered coordinates.

**Throws**: `UserNotFoundError`

---

#### `deleteCoordinatesService(userId: number): Promise<Point[]>`

Deletes all coordinates for a user.

**Throws**: `UserNotFoundError`

---

## Security

### Password Security

**Hashing**:
- Uses bcrypt with 10 salt rounds
- Passwords never stored in plain text
- Hashing occurs in `createUserService`

**Verification**:
- Uses `bcrypt.compare()` for constant-time comparison
- Prevents timing attacks

**Password Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit

### Data Exposure

**Safe Responses**:
- User passwords never included in API responses
- `getUserByIdModel` specifically excludes password field
- Only `getUserByNameModel` includes password (for authentication only)

### Input Validation

All inputs validated before processing:
- Username/password presence and format
- User ID format (numeric)
- Coordinate structure validation
- Type checking with TypeScript

---

## Development Guide

### Type Definitions (`utilities.ts`)

#### Interfaces

```typescript
interface User {
  id: number;
  name: string;
  password: string;  // Only used internally
}

interface UserData {
  id: number;
  name: string;  // Safe for API responses
}

interface LoginRequest {
  username: string;
  password: string;
}

interface Point {
  x: number;  // Longitude
  y: number;  // Latitude
}

interface TimestampedPoint extends Point {
  timestamp: number;  // Unix timestamp
}
```

#### Type Guards

```typescript
// Checks if value is a string
isString(x: any): x is String

// Checks if string contains only digits
isStringNumeric(str: string): boolean

// Checks if value is a valid Point
isPoint(x: any): x is Point

// Checks if value is a valid TimestampedPoint
isTimestampedPoint(x: any): x is TimestampedPoint
```

### Adding New Endpoints

1. **Define route** in `routes/` folder
2. **Create controller** in `controllers/` folder
3. **Implement service logic** in `services/` folder
4. **Add database operations** in `models/` folder
5. **Add validation middleware** if needed
6. **Define custom errors** if needed

### Testing

**Seeding Test Data**:
```bash
npm run db:seed
```

**Test Users**:
- Username: `alice`, Password: `Password123`
- Username: `bob`, Password: `Password123`

### Common Operations

**Create User**:
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Password123"}'
```

**Login**:
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"Password123"}'
```

**Add Coordinates**:
```bash
curl -X POST http://localhost:3000/coordinates/1 \
  -H "Content-Type: application/json" \
  -d '{"coordinates":[{"x":-122.4194,"y":37.7749,"timestamp":1704556800000}]}'
```

**Get Coordinates**:
```bash
curl http://localhost:3000/coordinates/1
```

---

## Future Enhancements

### Planned Features

1. **JWT Authentication**
   - Token-based authentication
   - Session management
   - Token refresh mechanism
   - Currently: TODO comments throughout codebase

2. **Session Management**
   - Active session tracking
   - Login/logout enforcement
   - Session expiration

3. **Advanced Spatial Queries**
   - Proximity searches
   - Area-based discovery tracking
   - Geographic clustering
   - Leverage PostGIS capabilities

### Known Limitations

- No authentication tokens (passwords only)
- No rate limiting
- No pagination on coordinate lists
- Session state not tracked
- No email verification
- No password reset functionality

---

## Troubleshooting

### Common Issues

**Database Connection Failed**:
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check PostGIS extension is installed

**Migration Errors**:
- Ensure `drizzle/` folder exists
- Verify migration files are present
- Check database permissions

**Graceful Shutdown Issues**:
- Server has 10-second timeout
- Check for hanging database connections
- Review connection pool configuration

**Coordinate Insertion Failures**:
- Verify PostGIS is installed: `CREATE EXTENSION postgis;`
- Check SRID 4326 support
- Validate coordinate ranges (x: -180 to 180, y: -90 to 90)

---

## API Response Format

### Success Responses

All successful responses return JSON with appropriate status codes:
- `200 OK`: Successful GET, DELETE
- `201 Created`: Successful POST

### Error Responses

Standard error format:
```json
{
  "message": "Error description"
}
```

Password validation errors include details:
```json
{
  "message": "Weak Password",
  "details": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter"
  ]
}
```

### Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication failed)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

---

## License & Credits

Atlas Unveiled - Geographic Discovery Tracking API

Built with Express, TypeScript, PostgreSQL, PostGIS, and Drizzle ORM.