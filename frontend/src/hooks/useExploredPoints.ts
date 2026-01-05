import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
    db,
    saveExploredPoint as dbSavePoint,
    clearAllPoints,
    type ExploredPoint
} from '../db';

interface UseExploredPointsReturn {
    points: ExploredPoint[];
    loading: boolean;
    error: Error | null;
    savePoint: (latitude: number, longitude: number) => Promise<ExploredPoint | null>;
    clearPoints: () => Promise<void>;
}

export function useExploredPoints(): UseExploredPointsReturn {
    const [error, setError] = useState<Error | null>(null);
    const points = useLiveQuery(
        () => db.exploredPoints.toArray(),
        [],
        []
    );

    const savePoint = async (latitude: number, longitude: number): Promise<ExploredPoint | null> => {
        try {
            setError(null);
            return await dbSavePoint(latitude, longitude);
        } catch (err) {
            console.error('Error saving point:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            return null;
        }
    };

    const clearPoints = async (): Promise<void> => {
        try {
            setError(null);
            await clearAllPoints();
            console.log('All points cleared from IndexedDB');
        } catch (err) {
            console.error('Error clearing points:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        }
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
