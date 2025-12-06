import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'


// Fog settings
const FOG_COLOR = '#1a1a2e'
const FOG_OPACITY = 0.85
const CLEAR_RADIUS = 50 // meters

// Tracking settings
const UPDATE_INTERVAL = 5000 // 5 seconds
const MIN_DISTANCE = 5 // minimum meters to move before adding new point

export default function App() {
  // Refs
  const mapContainer = useRef(null)
  const map = useRef(null)
  const fogCanvas = useRef(null)
  const userMarker = useRef(null)
  const trackingInterval = useRef(null)
  const exploredPointsRef = useRef([]) // Ref to access in interval
  
  // State
  const [exploredPoints, setExploredPoints] = useState([])
  const [currentPos, setCurrentPos] = useState(null)
  const [status, setStatus] = useState('Requesting location permission...')
  
  // Last saved position
  const lastSavedPos = useRef(null)

  // Keep ref in sync with state
  useEffect(() => {
    exploredPointsRef.current = exploredPoints
  }, [exploredPoints])


  useEffect(() => {
    if (map.current) return

    // Create map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [34.7818, 32.0853], // Default center
      zoom: 15,
      attributionControl: false,
    })

    // When map loads, create fog and start tracking
    map.current.on('load', () => {
      createFogCanvas()
      requestLocationPermission()
    })

    // Re-render fog when map moves/zooms
    map.current.on('move', renderFog)
    map.current.on('zoom', renderFog)

    // Handle resize
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current)
      }
      map.current?.remove()
    }
  }, [])


  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported in this browser')
      return
    }

    setStatus('Requesting location permission...')

    // browser permission prompt
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('Permission granted! Tracking started.')
        handleNewPosition(position)
        
        // Center map on user
        const { latitude, longitude } = position.coords
        map.current?.flyTo({ center: [longitude, latitude], zoom: 16 })
        
        // Start continuous tracking every 5 seconds
        startContinuousTracking()
      },
      (error) => {
        handleGeolocationError(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }


  const startContinuousTracking = () => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current)
    }

    trackingInterval.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handleNewPosition,
        (error) => {
          if (error.code !== error.TIMEOUT) {
            handleGeolocationError(error)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    }, UPDATE_INTERVAL)
  }


  const handleNewPosition = (position) => {
    const { latitude, longitude, accuracy } = position.coords
    
    setCurrentPos({ lat: latitude, lng: longitude })
    
    const pointCount = exploredPointsRef.current.length
    setStatus(`Tracking (±${Math.round(accuracy)}m) | ${pointCount} points explored`)

    updateUserMarker(latitude, longitude)

    if (shouldSavePoint(latitude, longitude)) {
      addExploredPoint(latitude, longitude)
    }
  }


  const handleGeolocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setStatus('Permission denied. Please allow location access and refresh the page.')
        break
      case error.POSITION_UNAVAILABLE:
        setStatus('Location unavailable. Check GPS/Location settings.')
        break
      case error.TIMEOUT:
        setStatus('Getting location...')
        break
      default:
        setStatus(`Error: ${error.message}`)
    }
  }


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
    const points = exploredPointsRef.current

    // Clear and fill with fog
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = FOG_COLOR
    ctx.globalAlpha = FOG_OPACITY
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Punch holes for explored points
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'destination-out'

    points.forEach(point => {
      const screenPos = map.current.project([point.lng, point.lat])
      const radiusPixels = metersToPixels(point.lat, CLEAR_RADIUS, map.current.getZoom())

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

   //Re-render fog when points change
  useEffect(() => {
    renderFog()
  }, [exploredPoints])

   //Update user marker on map
  const updateUserMarker = (lat, lng) => {
    if (!map.current) return

    if (!userMarker.current) {
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
  }

// Check if point should be saved (moved enough)
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

//Add explored point
  const addExploredPoint = (lat, lng) => {
    const newPoint = { lat, lng, timestamp: Date.now() }
    setExploredPoints(prev => [...prev, newPoint])
    lastSavedPos.current = { lat, lng }
  }

//Center map on user
  const centerOnUser = () => {
    if (currentPos && map.current) {
      map.current.flyTo({ center: [currentPos.lng, currentPos.lat], zoom: 16 })
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Map */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Status bar */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.85)',
        borderRadius: 12,
        color: 'white',
        fontSize: 14,
        zIndex: 10,
      }}>
        {status}
      </div>

      {/* Center on user button */}
      <button
        onClick={centerOnUser}
        disabled={!currentPos}
        style={{
          position: 'absolute',
          bottom: 30,
          right: 10,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: currentPos ? '#1976d2' : 'rgba(0,0,0,0.5)',
          color: 'white',
          fontSize: 24,
          cursor: currentPos ? 'pointer' : 'not-allowed',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
      </button>

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

 //Convert meters to pixels
function metersToPixels(lat, meters, zoom) {
  const earthCircumference = 40075016.686
  const pixelsPerMeter = (256 * Math.pow(2, zoom)) / 
    (earthCircumference * Math.cos(lat * Math.PI / 180))
  return meters * pixelsPerMeter
}

//Calculate distance between two points (meters)
function calculateDistance(lat1, lng1, lat2, lng2) {
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
