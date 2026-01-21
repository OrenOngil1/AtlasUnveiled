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


export async function getAllPoints(): Promise<ExploredPoint[]> {
    return await db.exploredPoints.toArray();
}


export async function clearAllPoints(): Promise<void> {
    await db.exploredPoints.clear();
    console.log('IndexedDB exploredPoints table cleared');
}


export async function getPointCount(): Promise<number> {
    return await db.exploredPoints.count();
}

export async function bulkAddPoints(points: Array<{ latitude: number; longitude: number }>): Promise<void> {
    const pointsWithTimestamp: ExploredPoint[] = points.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
        timestamp: Date.now()
    }));
    
    await db.exploredPoints.bulkAdd(pointsWithTimestamp);
    console.log(`Bulk added ${points.length} points to IndexedDB`);
}

export async function getCurrentUser(): Promise<User | undefined> {
    return await db.users.toCollection().first();
}

export async function createUser(username: string): Promise<User> {
    const user: User = {
        username,
        totalDistance: 0,
        createdAt: Date.now()
    };
    const id = await db.users.add(user);
    return { ...user, id };
}

export async function updateUsername(userId: number, newUsername: string): Promise<void> {
    await db.users.update(userId, { username: newUsername });
}

export async function addDistance(userId: number, meters: number): Promise<void> {
    const user = await db.users.get(userId);
    if (user) {
        await db.users.update(userId, { 
            totalDistance: user.totalDistance + meters 
        });
    }
}

export async function clearAllUsers(): Promise<void> {
    await db.users.clear();
}
