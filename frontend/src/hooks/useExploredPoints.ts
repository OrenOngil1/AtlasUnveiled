import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  db,
  saveExploredPoint as dbSavePoint,
  clearAllPoints,
} from '../db';

export function useExploredPoints() {
  const [error, setError] = useState(null);

  const points = useLiveQuery(
    () => db.exploredPoints.toArray(),
    [],
    []
  );

  const savePoint = async (lat, lng) => {
    try {
      return await dbSavePoint(lat, lng);
    } catch (err) {
      setError(err);
      return null;
    }
  };

  const clearPoints = async () => {
    await clearAllPoints();
  };

  return {
    points: points ?? [],
    loading: points === undefined,
    error,
    savePoint,
    clearPoints,
  };
}

export default useExploredPoints;