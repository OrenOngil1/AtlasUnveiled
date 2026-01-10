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
import { logoutUser, saveCoordinatesToBackend, deleteUserCoordinates, clearTokens } from './services/apiService'
// At the top, after imports
window.__db = db;
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
    const lastSyncPointCount = useRef(0) // Track last sync to avoid redundant syncs
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
    const handleLoginSuccess = useCallback(async (authData, backendCoordinates) => {
        // authData contains {user: {id, name}, accessToken, refreshToken}
        const user = authData.user || authData; // Support both formats for backward compatibility
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
            console.log(`[LOGOUT] Found ${allPoints.length} points in IndexedDB`)
            if (allPoints.length > 0) {
                console.log('[LOGOUT] Sample point from IndexedDB:', allPoints[0])
                // Convert to backend format: {x: longitude, y: latitude, timestamp: number}
                // Backend expects TimestampedPoint[] format
                const coordinates = allPoints.map(p => ({
                    x: p.longitude,
                    y: p.latitude,
                    timestamp: p.timestamp || Date.now() // Use stored timestamp or current time
                }))
                console.log('[LOGOUT] Converted coordinates sample:', coordinates[0])
                console.log(`[LOGOUT] Syncing ${coordinates.length} points to backend`)

                try {
                    await deleteUserCoordinates();
                    console.log('[LOGOUT] Old backend coordinates deleted');
                } catch (deleteErr) {
                    console.warn('[LOGOUT] Error deleting old coordinates (may not exist):', deleteErr);
                    // Continue anyway
                }

                await saveCoordinatesToBackend(coordinates);
                console.log('[LOGOUT] New coordinates saved to backend');
                lastSyncPointCount.current = allPoints.length; // Update sync count after logout
            } else {
                console.log('[LOGOUT] No points in IndexedDB to sync');
                lastSyncPointCount.current = 0; // Reset sync count
            }

            // Call backend logout (no userId needed, uses token)
            await logoutUser()
            console.log('Backend logout complete')

        } catch (err) {
            console.error('Sync/logout error:', err)
            // Still proceed with local logout even if sync fails
            // Clear tokens in case of auth errors
            clearTokens()
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
    // Note: Only syncs on actual page unload, not on tab visibility changes
    // This prevents unnecessary API calls when switching tabs
    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (!isLoggedIn || !currentUser) return;
            
            try {
                const allPoints = await db.exploredPoints.toArray()
                
                // Only sync if:
                // 1. There are points to save
                // 2. The point count has changed since last sync (avoid redundant syncs)
                if (allPoints.length > 0 && allPoints.length !== lastSyncPointCount.current) {
                    console.log(`[SYNC] Syncing ${allPoints.length} points before page unload`);
                    const coordinates = allPoints.map(p => ({
                        x: p.longitude,
                        y: p.latitude,
                        timestamp: p.timestamp || Date.now()
                    }))
                    await saveCoordinatesToBackend(coordinates)
                    lastSyncPointCount.current = allPoints.length; // Update sync count
                }
                // If no points or same count, silently skip (no API calls)
            } catch (err) {
                console.error('[SYNC] Sync on close failed:', err)
                // Don't block page unload on sync failure
            }
        }

        // Only sync on actual page unload (user closing tab/window/navigating away)
        // Removed visibilitychange to prevent frequent unnecessary syncs
        window.addEventListener('beforeunload', handleBeforeUnload)
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isLoggedIn, currentUser])

    // Update sync count after successful logout sync
    useEffect(() => {
        if (!isLoggedIn) {
            lastSyncPointCount.current = 0; // Reset when logged out
        }
    }, [isLoggedIn])

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
            console.log(`[GPS] New point saved to IndexedDB: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
            // Verify it was saved
            const count = await db.exploredPoints.count()
            console.log(`[GPS] Total points in IndexedDB: ${count}`)
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
