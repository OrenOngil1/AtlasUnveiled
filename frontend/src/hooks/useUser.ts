import { useState, useEffect, useCallback } from 'react';
import { 
  type User,
  getCurrentUser,
  createUser,
  updateUsername as dbUpdateUsername,
  addDistance as dbAddDistance,
} from '../db';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  createNewUser: (username: string) => Promise<User>;
  updateUsername: (newUsername: string) => Promise<void>;
  addDistance: (meters: number) => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(u => setUser(u ?? null))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  const createNewUser = useCallback(async (username: string): Promise<User> => {
    const newUser = await createUser(username);
    setUser(newUser);
    return newUser;
  }, []);

  const updateUsername = useCallback(async (newUsername: string): Promise<void> => {
    if (!user?.id) return;
    await dbUpdateUsername(user.id, newUsername);
    setUser(prev => prev ? { ...prev, username: newUsername } : null);
  }, [user?.id]);

  const addDistance = useCallback(async (meters: number): Promise<void> => {
    if (!user?.id) return;
    await dbAddDistance(user.id, meters);
    setUser(prev => prev ? { ...prev, totalDistance: prev.totalDistance + meters } : null);
  }, [user?.id]);

  return {
    user,
    loading,
    error,
    createNewUser,
    updateUsername,
    addDistance,
  };
}

export default useUser;
