import { db, type ExploredPoint } from './database';

export async function saveExploredPoint(
  latitude: number,
  longitude: number
): Promise<ExploredPoint> {
  const point: Omit<ExploredPoint, 'id'> = {
    latitude,
    longitude,
    timestamp: Date.now(),
  };

  const id = await db.exploredPoints.add(point as ExploredPoint);
  return { ...point, id } as ExploredPoint;
}

export async function isDuplicatePoint(
  latitude: number,
  longitude: number,
  thresholdMeters: number = 10
): Promise<boolean> {
  const thresholdDegrees = thresholdMeters / 111000;

  const nearbyPoint = await db.exploredPoints
    .filter(point => {
      const latDiff = Math.abs(point.latitude - latitude);
      const lngDiff = Math.abs(point.longitude - longitude);
      return latDiff < thresholdDegrees && lngDiff < thresholdDegrees;
    })
    .first();

  return nearbyPoint !== undefined;
}


export async function getAllExploredPoints(): Promise<ExploredPoint[]> {
  return db.exploredPoints.toArray();
}

export async function getExploredPointsCount(): Promise<number> {
  return db.exploredPoints.count();
}

export async function getPointsInBounds(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<ExploredPoint[]> {
  return db.exploredPoints
    .filter(point =>
      point.latitude >= bounds.south &&
      point.latitude <= bounds.north &&
      point.longitude >= bounds.west &&
      point.longitude <= bounds.east
    )
    .toArray();
}

export async function getPointById(id: number): Promise<ExploredPoint | undefined> {
  return db.exploredPoints.get(id);
}

export async function deletePoint(pointId: number): Promise<void> {
  await db.exploredPoints.delete(pointId);
}

export async function clearAllPoints(): Promise<void> {
  await db.exploredPoints.clear();
}
