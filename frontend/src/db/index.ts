import Dexie, { type EntityTable } from 'dexie';

// TYPES
export interface ExploredPoint {
    id?: number;
    latitude: number;
    longitude: number;
    timestamp: number;
}
export interface User {
    id?: number;
    username: string;
    totalDistance: number;
    createdAt: number;
}

// DATABASE SETUP
class AtlasDatabase extends Dexie {
    exploredPoints!: EntityTable<ExploredPoint, 'id'>;
    users!: EntityTable<User, 'id'>;
    constructor() {
        super('AtlasUnveiledDB');
        this.version(1).stores({
            exploredPoints: '++id, latitude, longitude, timestamp',
            users: '++id, username, totalDistance, createdAt'
        });
    }
}
export const db = new AtlasDatabase();

// INITIALIZATION
export async function initializeDatabase(): Promise<boolean> {
    try {
        await db.open();
        console.log('IndexedDB opened: AtlasUnveiledDB');
        return true;
    } catch (err) {
        console.error('Failed to open IndexedDB:', err);
        throw err;
    }
}

// EXPLORED POINTS OPERATIONS
export async function saveExploredPoint(latitude: number, longitude: number): Promise<ExploredPoint> {
    const point: ExploredPoint = {
        latitude,
        longitude,
        timestamp: Date.now()
    };
    const id = await db.exploredPoints.add(point);
    return { ...point, id };
}

/**
 * Get all explored points
 */
export async function getAllPoints(): Promise<ExploredPoint[]> {
    return await db.exploredPoints.toArray();
}

/**
 * Clear all explored points
 * Used when user logs out
 */
export async function clearAllPoints(): Promise<void> {
    await db.exploredPoints.clear();
    console.log('IndexedDB exploredPoints table cleared');
}

/**
 * Get point count
 */
export async function getPointCount(): Promise<number> {
    return await db.exploredPoints.count();
}

/**
 * Bulk add points (for loading from backend)
 */
export async function bulkAddPoints(points: Array<{ latitude: number; longitude: number }>): Promise<void> {
    const pointsWithTimestamp: ExploredPoint[] = points.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
        timestamp: Date.now()
    }));
    
    await db.exploredPoints.bulkAdd(pointsWithTimestamp);
    console.log(`Bulk added ${points.length} points to IndexedDB`);
}
// ══════════════════════════════════════════════════════════════════════
// USER OPERATIONS
// ══════════════════════════════════════════════════════════════════════

/**
 * Get current user (first user in table)
 */
export async function getCurrentUser(): Promise<User | undefined> {
    return await db.users.toCollection().first();
}

/**
 * Create a new user
 */
export async function createUser(username: string): Promise<User> {
    const user: User = {
        username,
        totalDistance: 0,
        createdAt: Date.now()
    };
    const id = await db.users.add(user);
    return { ...user, id };
}

/**
 * Update username
 */
export async function updateUsername(userId: number, newUsername: string): Promise<void> {
    await db.users.update(userId, { username: newUsername });
}

/**
 * Add distance to user's total
 */
export async function addDistance(userId: number, meters: number): Promise<void> {
    const user = await db.users.get(userId);
    if (user) {
        await db.users.update(userId, { 
            totalDistance: user.totalDistance + meters 
        });
    }
}

/**
 * Clear all users (for logout)
 */
export async function clearAllUsers(): Promise<void> {
    await db.users.clear();
}
