import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'



// Fog settings
const FOG_COLOR = '#1a1a2e'
const FOG_OPACITY = 0.85
const CLEAR_RADIUS = 50 // meters

// Minimum distance to move before adding new point (meters)
const MIN_DISTANCE = 5

export default function App() {
  // Refs
  const mapContainer = useRef(null)
  const map = useRef(null)
  const fogCanvas = useRef(null)
  const userMarker = useRef(null)
  
  // State
  const [exploredPoints, setExploredPoints] = useState([])
  const [currentPos, setCurrentPos] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [status, setStatus] = useState('Press Start to begin exploring')
  
  // Last saved position (to check distance)
  const lastSavedPos = useRef(null)


  useEffect(() => {
    if (map.current) return

    // Create map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [34.7818, 32.0853], // Tel Aviv default
      zoom: 15,
      attributionControl: false,
    })

    // When map loads, create fog canvas
    map.current.on('load', () => {
      createFogCanvas()
      setStatus('Map loaded. Press Start to begin exploring!')
    })

    // Re-render fog when map moves
    map.current.on('move', renderFog)
    map.current.on('zoom', renderFog)

    // Handle resize
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      map.current?.remove()
    }
  }, [])


  const createFogCanvas = () => {
    const canvas = document.createElement('canvas')
    canvas.id = 'fog-canvas'
    canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `
    
    // Set canvas size
    const rect = mapContainer.current.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    
    mapContainer.current.appendChild(canvas)
    fogCanvas.current = canvas
    
    renderFog()
  }


  const handleResize = () => {
    if (!fogCanvas.current || !mapContainer.current) return
    
    const rect = mapContainer.current.getBoundingClientRect()
    fogCanvas.current.width = rect.width * window.devicePixelRatio
    fogCanvas.current.height = rect.height * window.devicePixelRatio
    renderFog()
  }


  const renderFog = () => {
    const canvas = fogCanvas.current
    if (!canvas || !map.current) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Fill with fog
    ctx.fillStyle = FOG_COLOR
    ctx.globalAlpha = FOG_OPACITY
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Reset alpha and set composite to "punch holes"
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'destination-out'

    // Clear fog for each explored point
    exploredPoints.forEach(point => {
      const screenPos = map.current.project([point.lng, point.lat])
      const radiusPixels = metersToPixels(point.lat, CLEAR_RADIUS, map.current.getZoom())

      // Draw gradient circle (soft edges)
      const gradient = ctx.createRadialGradient(
        screenPos.x * dpr, screenPos.y * dpr, 0,
        screenPos.x * dpr, screenPos.y * dpr, radiusPixels * dpr
      )
      gradient.addColorStop(0, 'rgba(0,0,0,1)')
      gradient.addColorStop(0.7, 'rgba(0,0,0,1)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(screenPos.x * dpr, screenPos.y * dpr, radiusPixels * dpr, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.globalCompositeOperation = 'source-over'
  }


  useEffect(() => {
    renderFog()
  }, [exploredPoints])

  /**
   * Start tracking location
   */
  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported')
      return
    }

    setIsTracking(true)
    setStatus('Getting location...')

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        setCurrentPos({ lat: latitude, lng: longitude })
        setStatus(`Tracking... (accuracy: ${Math.round(accuracy)}m)`)

        // Update user marker
        updateUserMarker(latitude, longitude)

        // Check if we should save this point
        if (shouldSavePoint(latitude, longitude)) {
          addExploredPoint(latitude, longitude)
        }
      },
      (error) => {
        setStatus(`Error: ${error.message}`)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )

    // Store watchId to clear later
    window.geoWatchId = watchId
  }


  const stopTracking = () => {
    if (window.geoWatchId) {
      navigator.geolocation.clearWatch(window.geoWatchId)
    }
    setIsTracking(false)
    setStatus(`Stopped. ${exploredPoints.length} points explored.`)
  }

  /**
   * Update or create user marker on map
   */
  const updateUserMarker = (lat, lng) => {
    if (!map.current) return

    if (!userMarker.current) {
      // Create marker element
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background: #1976d2;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          top: -10px;
          left: -10px;
          width: 40px;
          height: 40px;
          background: rgba(25,118,210,0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
      `
      el.style.cssText = 'position: relative; width: 20px; height: 20px;'

      userMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current)
    } else {
      userMarker.current.setLngLat([lng, lat])
    }

    // Center map on user (first time only)
    if (exploredPoints.length === 0) {
      map.current.flyTo({ center: [lng, lat], zoom: 16 })
    }
  }

  /**
   * Check if we should save this point (moved enough distance)
   */
  const shouldSavePoint = (lat, lng) => {
    if (!lastSavedPos.current) return true

    const distance = calculateDistance(
      lastSavedPos.current.lat,
      lastSavedPos.current.lng,
      lat,
      lng
    )

    return distance >= MIN_DISTANCE
  }

  /**
   * Add a new explored point
   */
  const addExploredPoint = (lat, lng) => {
    const newPoint = { lat, lng, timestamp: Date.now() }
    setExploredPoints(prev => [...prev, newPoint])
    lastSavedPos.current = { lat, lng }
  }

  /**
   * Center map on current location
   */
  const centerOnUser = () => {
    if (currentPos && map.current) {
      map.current.flyTo({ center: [currentPos.lng, currentPos.lat], zoom: 16 })
    }
  }

  /**
   * Clear all explored points (reset fog)
   */
  const clearExplored = () => {
    setExploredPoints([])
    lastSavedPos.current = null
    setStatus('Fog reset!')
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Map container */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Status bar */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.8)',
        borderRadius: 12,
        color: 'white',
        fontSize: 14,
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>
            {isTracking ? '🟢 Tracking' : '⚪ Stopped'}
          </div>
          <div>{status}</div>
        </div>
        <div style={{ fontWeight: 'bold' }}>
          {exploredPoints.length} pts
        </div>
      </div>

      {/* Control buttons */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        right: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 10,
      }}>
        {/* Center button */}
        <button onClick={centerOnUser} style={buttonStyle}>
          📍
        </button>

        {/* Clear button */}
        <button onClick={clearExplored} style={buttonStyle}>
          🗑️
        </button>

        {/* Start/Stop button */}
        <button
          onClick={isTracking ? stopTracking : startTracking}
          style={{
            ...buttonStyle,
            width: 64,
            height: 64,
            fontSize: 24,
            background: isTracking ? '#e53935' : '#1976d2',
          }}
        >
          {isTracking ? '⏹' : '▶️'}
        </button>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// Button style
const buttonStyle = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(0,0,0,0.8)',
  color: 'white',
  fontSize: 18,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

/**
 * Convert meters to pixels at given latitude and zoom
 */
function metersToPixels(lat, meters, zoom) {
  const earthCircumference = 40075016.686
  const pixelsPerMeter = (256 * Math.pow(2, zoom)) / 
    (earthCircumference * Math.cos(lat * Math.PI / 180))
  return meters * pixelsPerMeter
}


function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
