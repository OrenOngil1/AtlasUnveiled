// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}


export function getGridCell(lat, lng, cellSizeMeters) {
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos(lat * Math.PI / 180)
  const cellSizeLat = cellSizeMeters / metersPerDegreeLat
  const cellSizeLng = cellSizeMeters / metersPerDegreeLng
  const cellX = Math.floor(lng / cellSizeLng)
  const cellY = Math.floor(lat / cellSizeLat)
  return `${cellX},${cellY}`
}


export function getNeighborCells(lat, lng, cellSizeMeters) {
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos(lat * Math.PI / 180)
  const cellSizeLat = cellSizeMeters / metersPerDegreeLat
  const cellSizeLng = cellSizeMeters / metersPerDegreeLng
  const cellX = Math.floor(lng / cellSizeLng)
  const cellY = Math.floor(lat / cellSizeLat)
  const neighbors = []
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      neighbors.push(`${cellX + dx},${cellY + dy}`)
    }
  }
  return neighbors
}


export class SpatialIndex {
  constructor(clearRadius, maxOverlapPercent = 0.65) {
    this.clearRadius = clearRadius
    this.saveThreshold = clearRadius * (1 - maxOverlapPercent * 0.26)
    this.cellSize = this.saveThreshold
    this.grid = new Map()
    this.allPoints = []
  }
  buildFromPoints(points) {
    this.grid.clear()
    this.allPoints = [...points]
    for (const point of points) {
      this.addToGrid(point.latitude, point.longitude)
    }
  }
   //Add a point to the grid
  addToGrid(lat, lng) {
    const cellKey = getGridCell(lat, lng, this.cellSize)
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, [])
    }
    this.grid.get(cellKey).push({ lat, lng })
  }

  isLocationRevealed(lat, lng) {
    const cellsToCheck = getNeighborCells(lat, lng, this.cellSize)
    for (const cellKey of cellsToCheck) {
      const pointsInCell = this.grid.get(cellKey)
      if (!pointsInCell) continue
      for (const point of pointsInCell) {
        const distance = calculateDistance(lat, lng, point.lat, point.lng)
        if (distance < this.saveThreshold) {
          return true // Already within a cleared circle
        }
      }
    }
    return false
  }

  getClusteredPoints() {
    const clustered = []
    const used = new Set()
    for (let i = 0; i < this.allPoints.length; i++) {
      if (used.has(i)) continue
      const point = this.allPoints[i]
      clustered.push(point)
      used.add(i)
      for (let j = i + 1; j < this.allPoints.length; j++) {
        if (used.has(j)) continue
        const other = this.allPoints[j]
        const distance = calculateDistance(
          point.latitude, point.longitude,
          other.latitude, other.longitude
        )
        if (distance < this.clearRadius * 0.7) {
          used.add(j)
        }
      }
    }
    return clustered
  }
}

// Convert meters to pixels at a given zoom level
export function metersToPixels(lat, meters, zoom) {
  const earthCircumference = 40075016.686
  const pixelsPerMeter = (256 * Math.pow(2, zoom)) / 
    (earthCircumference * Math.cos(lat * Math.PI / 180))
  return meters * pixelsPerMeter
}
