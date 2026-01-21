import Dexie, { type EntityTable } from 'dexie';

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
}

class AtlasDatabase extends Dexie {
  exploredPoints!: EntityTable<ExploredPoint, 'id'>;
  users!: EntityTable<User, 'id'>;

  constructor() {
    super('AtlasUnveiledDB');
    this.version(1).stores({
      exploredPoints: '++id, timestamp, [latitude+longitude]',
      users: '++id, username'
    });
  }
}

export const db = new AtlasDatabase();
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('Database opened');
  } catch (error) {
    console.error('Database failed:', error);
    throw error;
  }
}
export default db;
