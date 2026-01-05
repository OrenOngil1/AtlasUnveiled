import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './atlas-styles.css'

// Database
import { initializeDatabase, db } from './db'
import { useExploredPoints } from './hooks'
import { SpatialIndex, metersToPixels, calculateDistance } from './utils/spatialIndex'

// Components
import LoginScreen from './components/LoginScreen'

// Services
import { logoutUser, saveCoordinatesToBackend } from './services/apiService'

// CONSTANTS
const FOG_COLOR = '#1a1a2e'
const FOG_OPACITY = 1
const CLEAR_RADIUS = 40 // meters

const UPDATE_INTERVAL = 5000 // 5 seconds between GPS checks


export default function App() {
    // REFS
    const mapContainer = useRef(null)
    const map = useRef(null)
    const fogCanvas = useRef(null)
    const userMarker = useRef(null)
    const trackingInterval = useRef(null)
    const spatialIndex = useRef(new SpatialIndex(CLEAR_RADIUS, 0.5))
    const lastSavedPos = useRef(null)
    // STATE
    // Authentication state
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [currentUser, setCurrentUser] = useState(null) // {id, name}
    
    // App state
    const [dbReady, setDbReady] = useState(false)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    // IndexedDB hook
    const { points: exploredPoints, savePoint, clearPoints } = useExploredPoints()

    // INITIALIZE DATABASE
    useEffect(() => {
        initializeDatabase()
            .then(() => {
                console.log('Database ready')
                setDbReady(true)
            })
            .catch(err => {
                console.error('Database init failed:', err)
            })
    }, [])

    // BUILD SPATIAL INDEX WHEN POINTS CHANGE
    useEffect(() => {
        if (exploredPoints && exploredPoints.length > 0) {
            spatialIndex.current.buildFromPoints(exploredPoints)
            console.log(`Spatial index rebuilt with ${exploredPoints.length} points`)
        }
    }, [exploredPoints])

    // LOGIN HANDLER
    const handleLoginSuccess = useCallback(async (user, backendCoordinates) => {
        console.log('Login successful:', user.name)
        setCurrentUser(user)
        // Clear any existing local data first
        await clearPoints()
        console.log('Cleared local IndexedDB')
        // Convert backend coordinates to IndexedDB format and save
        if (backendCoordinates && backendCoordinates.length > 0) {
            console.log(`Loading ${backendCoordinates.length} points from backend`)
            // Backend format: {x: longitude, y: latitude}
            // IndexedDB format: {latitude, longitude, timestamp}
            for (const coord of backendCoordinates) {
                await savePoint(coord.y, coord.x) // y=lat, x=lng
            }
            console.log('Points loaded into IndexedDB')
        }
        setIsLoggedIn(true)
    }, [clearPoints, savePoint])

    // LOGOUT HANDLER
    const handleLogout = useCallback(async () => {
        if (!currentUser || isLoggingOut) return
        setIsLoggingOut(true)
        console.log('Logging out...')
        try {
            // Get all points from IndexedDB
            const allPoints = await db.exploredPoints.toArray()
            console.log(`Syncing ${allPoints.length} points to backend`)
            if (allPoints.length > 0) {
                // Convert to backend format: {x: longitude, y: latitude}
                const coordinates = allPoints.map(p => ({
                    x: p.longitude,
                    y: p.latitude
                }))
                await saveCoordinatesToBackend(currentUser.id, coordinates)
                console.log('Points synced to backend')
            }

            // Call backend logout
            await logoutUser(currentUser.id)
            console.log('Backend logout complete')

        } catch (err) {
            console.error('Sync/logout error:', err)
            // Still proceed with local logout even if sync fails
        }
        // Clear local IndexedDB
        await clearPoints()
        console.log('Local data cleared')
        // Reset state
        setCurrentUser(null)
        setIsLoggedIn(false)
        setMapLoaded(false)
        setIsLoggingOut(false)
        // Clean up map
        if (map.current) {
            map.current.remove()
            map.current = null
        }
        if (userMarker.current) {
            userMarker.current.remove()
            userMarker.current = null
        }
        if (trackingInterval.current) {
            clearInterval(trackingInterval.current)
            trackingInterval.current = null
        }
    }, [currentUser, isLoggingOut, clearPoints])

    // HANDLE APP CLOSE/BACKGROUND
    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (isLoggedIn && currentUser) {
                // Quick sync attempt on close
                try {
                    const allPoints = await db.exploredPoints.toArray()
                    if (allPoints.length > 0) {
                        const coordinates = allPoints.map(p => ({
                            x: p.longitude,
                            y: p.latitude
                        }))
                        await saveCoordinatesToBackend(currentUser.id, coordinates)
                    }
                } catch (err) {
                    console.error('Sync on close failed:', err)
                }
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && isLoggedIn) {
                handleBeforeUnload()
            }
        })
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isLoggedIn, currentUser])

    // INITIALIZE MAP (only when logged in)
    useEffect(() => {
        if (!isLoggedIn || !dbReady || map.current) return
        // Create map
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
            center: [34.78, 32.08], // Default: Tel Aviv
            zoom: 15,
            attributionControl: false
        })

        map.current.on('load', () => {
            console.log('🗺️ Map loaded')
            setMapLoaded(true)
            setupFogCanvas()
            startGPSTracking()
        })
        map.current.on('move', renderFog)
        map.current.on('zoom', renderFog)
        return () => {
            if (trackingInterval.current) {
                clearInterval(trackingInterval.current)
            }
        }
    }, [isLoggedIn, dbReady])

    // FOG CANVAS SETUP
    const setupFogCanvas = () => {
        if (!fogCanvas.current) return
        const canvas = fogCanvas.current
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            renderFog()
        })
    }

    // RENDER FOG
    const renderFog = useCallback(() => {
        if (!fogCanvas.current || !map.current) return
        const canvas = fogCanvas.current
        const ctx = canvas.getContext('2d')
        // Draw fog
        ctx.fillStyle = FOG_COLOR
        ctx.globalAlpha = FOG_OPACITY
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        // Cut holes for explored points
        ctx.globalCompositeOperation = 'destination-out'
        ctx.globalAlpha = 1
        const points = spatialIndex.current.getClusteredPoints?.() || exploredPoints || []
        points.forEach(point => {
            if (!point.latitude || !point.longitude) return
            const screenPos = map.current.project([point.longitude, point.latitude])
            const radiusPixels = metersToPixels(point.latitude, CLEAR_RADIUS, map.current.getZoom())
            ctx.beginPath()
            ctx.arc(screenPos.x, screenPos.y, radiusPixels, 0, Math.PI * 2)
            ctx.fill()
        })
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over'
    }, [exploredPoints])
    // Re-render fog when points change
    useEffect(() => {
        if (mapLoaded) {
            renderFog()
        }
    }, [exploredPoints, mapLoaded, renderFog])

    // GPS TRACKING
    const startGPSTracking = () => {
        if (!navigator.geolocation) {
            console.error('Geolocation not supported')
            return
        }
        const updatePosition = () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    handleNewPosition(latitude, longitude)
                },
                (error) => {
                    console.error('GPS error:', error.message)
                },
                { enableHighAccuracy: true, timeout: 10000 }
            )
        }
        // Initial position
        updatePosition()
        // Periodic updates
        trackingInterval.current = setInterval(updatePosition, UPDATE_INTERVAL)
    }

    const handleNewPosition = async (latitude, longitude) => {
        if (!map.current) return
        // Update/create user marker
        if (!userMarker.current) {
            const el = document.createElement('div')
            el.className = 'user-marker'
            el.innerHTML = '📍'
            el.style.fontSize = '24px'

            userMarker.current = new maplibregl.Marker({ element: el })
                .setLngLat([longitude, latitude])
                .addTo(map.current)
        } else {
            userMarker.current.setLngLat([longitude, latitude])
        }
        // Check if we should save this point
        if (!spatialIndex.current.isLocationRevealed(latitude, longitude)) {
            await savePoint(latitude, longitude)
            lastSavedPos.current = { latitude, longitude }
            console.log(`New point saved: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
            renderFog()
        }
    }

    // RENDER
    // Show login screen if not logged in
    if (!isLoggedIn) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />
    }
    // Show loading while DB initializes
    if (!dbReady) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <span className="loading-spinner">⏳</span>
                    <p>Initializing...</p>
                </div>
            </div>
        )
    }
    // Main app view (NO STATUS BAR - as requested)
    return (
        <div className="app-container">
            {/* Map Container */}
            <div ref={mapContainer} className="map-container" />
            {/* Fog Canvas Overlay */}
            <canvas ref={fogCanvas} className="fog-canvas" />
            {/* Minimal UI - Just logout button and center button */}
            <div className="ui-overlay">
                {/* User info and logout */}
                <div className="top-bar">
                    <span className="user-name">👤 {currentUser?.name}</span>
                    <button 
                        className="logout-button" 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? '⏳' : '🚪 Logout'}
                    </button>
                </div>
                {/* Center on user button */}
                <button 
                    className="center-button"
                    onClick={() => {
                        if (userMarker.current && map.current) {
                            const lngLat = userMarker.current.getLngLat()
                            map.current.flyTo({
                                center: [lngLat.lng, lngLat.lat],
                                zoom: 16,
                                duration: 1000
                            })
                        }
                    }}
                >
                    📍
                </button>
                {/* Point counter (minimal, not a full status bar) */}
                <div className="point-counter">
                    {exploredPoints?.length || 0} points
                </div>
            </div>
        </div>
    )
}
