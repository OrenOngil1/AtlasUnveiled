import { db, type User } from './database';

export async function createUser(username: string): Promise<User> {
  const user: Omit<User, 'id'> = {
    username,
    totalDistance: 0,
  };

  const id = await db.users.add(user as User);
  return { ...user, id } as User;
}

export async function getUserById(id: number): Promise<User | undefined> {
  return db.users.get(id);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  return db.users.where('username').equals(username).first();
}

export async function getAllUsers(): Promise<User[]> {
  return db.users.toArray();
}

export async function getCurrentUser(): Promise<User | undefined> {
  return db.users.toCollection().first();
}

export async function updateUsername(userId: number, newUsername: string): Promise<void> {
  await db.users.update(userId, { username: newUsername });
}

export async function updateTotalDistance(userId: number, totalDistance: number): Promise<void> {
  await db.users.update(userId, { totalDistance });
}

export async function addDistance(userId: number, meters: number): Promise<void> {
  const user = await db.users.get(userId);
  if (user) {
    await db.users.update(userId, { totalDistance: user.totalDistance + meters });
  }
}

export async function deleteUser(userId: number): Promise<void> {
  await db.users.delete(userId);
}
