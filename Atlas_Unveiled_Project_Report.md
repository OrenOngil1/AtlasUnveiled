# Atlas Unveiled

## A Fog-of-War Exploration Web App

**By: Levi Vendrov & Oren**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Our Problems](#2-our-problems)
3. [Our Solutions](#3-our-solutions)
4. [System Architecture](#4-system-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Database Design](#6-database-design)
7. [Data Flow & Synchronization](#7-data-flow--synchronization)
8. [Conclusions & Learnings](#8-conclusions--learnings)
9. [Installation Instructions](#9-installation-instructions)

---

## 1. Introduction

### Background

Almost a decade ago, Pokemon GO was released for mobile devices and created a magical phenomenon where masses of people went out to the streets and into nature, simply walking around (and almost trampling each other in pursuit of Pokemon). 

**Atlas Unveiled** attempts to recreate that magical phenomenon through gamification of our regular, boring maps, thereby encouraging users to explore their surroundings.

### What is Atlas Unveiled?

Atlas Unveiled is a local host web application that displays a regular map with a twist - the map is covered with **fog of war** that hides the map from the user. The fog disperses within a certain radius around the user as they move, revealing the map beneath. This exploits natural curiosity (and perhaps a bit of OCD) in people, encouraging them to go out and walk to uncover the entire map.

### Project Goals

- Create an engaging exploration experience using fog-of-war mechanics
- Build an offline-first web application with backend DB synchronization
- Learn industry-standard development tools and practices regarding frontend and backend development

---

## 2. Our Problems

While creating Atlas Unveiled we encountered some challenges:

### Technical Challenges

| Challenge | Description |
|-----------|-------------|
| **Data Persistence** | Storing exploration progress locally with cross-device sync |
| **Offline Functionality** | App must work seamlessly without internet |
| **Performance Optimization** | Managing a large number of coordinates without degrading performance |
| **Redundant Point Prevention** | Avoiding saving overlapping coordinates that reveal the same area |

---

## 3. Our Solutions

The solutions employ a modern web technology stack with a **dual-database architecture** to achieve both offline functionality and cross-device synchronization as well as implemnting **grid-logic** to achieve performance optimization and saving redundant points.


### 3.1 Dual Database Architecture

A critical design decision was implementing a dual-database architecture:

| Database | Location | Purpose | Technology |
|----------|----------|---------|------------|
| **IndexedDB** | User's device | Offline-first local storage | Dexie wrapper |
| **PostgreSQL** | Server | Authoritative backup & sync | PostGIS extension |

This enables:
- **Offline Functionality**: data saves to local DB without internet
- **Cross-device sync**: Login from any device to access your exploration
- **Data Persistence**: Server backup prevents data loss

---

### 3.2 Spatial Indexing & Grid Logic

This critical optimization prevents saving redundant points that reveal overlapping areas.

#### The Problem

Without optimization, GPS updates every few meters (or even the same location!!) would save thousands of overlapping points:

```
Without spatial filtering:
    ●─5m──●─5m──●─5m──●─5m──●
    |5m   |5m   |5m   |5m   |
    ●─5m──●─5m──●─5m──●─5m──●
    With 40m clear radius, all the points reveal 
    essentially the huge ovelapping area so many 
    of the are not needed and are wasted storage!!
```

#### The Solution: Minimum Distance Threshold

Points are only saved when they're at least **35 meters** from all existing points.

```
The Math of Circle Overlap:

Distance = 0m (same spot)     →  100% overlap
Distance = 0.87 × radius      →   50% overlap
Distance = radius             →   39% overlap
Distance = 2 × radius         →    0% overlap

For CLEAR_RADIUS = 40m
SAVE_THRESHOLD = 0.87 × 40m ≈ 35m

If points are 35m+ apart → ≤50% overlap → SAVE
If points are <35m apart → >50% overlap → DON'T SAVE
```
But that floats another problem, we have to check distance from all the other points every time we want to add a new one!!
In order to avoid that we use the grid system:

#### The Grid System
The grid is created upon succeful login and getting all of the existing points, then the world is divided into a virtual grid where each cell has a fixed size in meters.
The function **getGridCell** converts a latitude/longitude into a unique string key (like "105,203").
It calculates roughly how many meters exist per degree of latitude/longitude at that specific location to ensure grid cells are square in shape.

The SpatialIndex class manages the grid in memory:
It uses a JavaScript Map where the key is the cell ID and the value is an array of points inside that cell.
The cellSize is the saveThreshold (which is calculated based on clearRadius as mentioned above). This ensures that if a point is close enough to matter, it will definitely be in the current cell or one of its 8 immediate neighbors meaning that we only have to check the distance from the points in the neighbor cells of our current point instead of all the points:

```
┌─────────────────────────────────────────────────────────────┐
│                     SPATIAL INDEX GRID                      │
│                                                             │
│    ┌────┬────┬────┬────┬────┐                               │
│    │ A  │ B  │ C  │ D  │ E  │                               │
│    │    │ ●  │    │    │    │                               │
│    ├────┼────┼────┼────┼────┤                               │
│    │ F  │ G  │ H  │ I  │ J  │                               │
│    │    │    │    │    │    │                               │
│    ├────┼────┼────┼────┼────┤                               │
│    │ K  │ L  │ M  │ N  │ O  │                               │
│    │    │    │    │ ●  │    │                               │
│    └────┴────┴────┴────┴────┘                               │
│                                                             │
│    New point arrives in cell H:                             │
│    → Only check cells B, C, D, G, H, I, L, M, N (9 cells)   │
│    → NOT all points in the entire database!                 │
│                                                             │
│    With 10,000 points across 1,000 cells:                   │
│    Check ~9 cells instead of 10,000!                        │
└─────────────────────────────────────────────────────────────┘
```

Finally after saving a new point to the grid, the grid is rebuilt again and is ready for the next point.
Rebuilding the grid for each point may take some time if we have a lot of points (from my testing ~700ms for 10,000 points) so it may not be ready for next point in time
but it is not the case because there is a 5s delay in checking for an updated GPS location.

---

## 4. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               Frontend                                      │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         REACT + VITE                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │  MapLibre   │  │   Canvas    │  │   Login     │  │   Spatial   │   │  │
│  │  │   GL JS     │  │    Fog      │  │   Screen    │  │    Index    │   │  │
│  │  │   (Map)     │  │  (Overlay)  │  │   (Auth)    │  │   (Grid)    │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       LOCAL STORAGE (IndexedDB)                       │  │
│  │                    Dexie wrapper for easy access                      │  │
│  │              • Explored coordinates (offline-first)                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
|                                                                             |
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTP/HTTPS (Sync)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND SERVER                                   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      Node.js + Express                                │  │
│  │  POST /users/login    │  GET  /coordinates/:id   │  POST /users       │  │
│  │  POST /users/logout   │  POST /coordinates/:id   │  DELETE /users/:id │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL + PostGIS                               │  │
│  │              (Geographic data storage with Drizzle ORM)               │  │
│  │                                                                       │  │
│  │    ┌─────────────┐          ┌──────────────────────────────┐          │  │
│  │    │   users     │          │   discovered_coordinates     │          │  │
│  │    ├─────────────┤          ├──────────────────────────────┤          │  │
│  │    │ id (PK)     │◄────────┤│ user_id (FK)                 │          │  │
│  │    │ name        │          │ coordinates (geometry/point) │          │  │
│  │    │ password    │          │ (composite PK)               │          │  │
│  │    └─────────────┘          └──────────────────────────────┘          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Docker Container                              │  │
│  │                      (postgis/postgis:15-3.3)                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```
---

## 5. Technology Stack

### Frontend

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React + Vite | UI development |
| Mapping | MapLibre GL JS | Open-source map rendering |
| Fog Rendering | HTML5 Canvas API | Fog overlay with "destination-out" |
| Local Storage | IndexedDB + Dexie | Offline data persistence |
| GPS | Geolocation API | Real-time location tracking |

### Backend

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js | Server-side JavaScript |
| Framework | Express.js | REST API routing |
| Database | PostgreSQL + PostGIS | Geographic data storage |
| ORM | Drizzle ORM | Type-safe database operations |
| Containerization | Docker | Database deployment |

### Development Tools

| Tool | Purpose |
|------|---------|
| Drizzle Kit | Database migrations |
| Docker Compose | Local PostgreSQL setup |

---


## 6. Database Design

### Entity Relationship Diagram

```
┌─────────────────────┐          ┌────────────────────────────┐
│       users         │          │   discovered_coordinates   │
├─────────────────────┤          ├────────────────────────────┤
│ id (PK, auto-inc)   │◄────────┤│ user_id (FK, composite PK) │
│ name (unique)       │    1:N   │ coordinates (composite PK) │
│ password            │          │   (PostGIS POINT)          │
└─────────────────────┘          └────────────────────────────┘
```

---

## 7. Data Flow & Synchronization

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User enters username/password                            │
│                    │                                         │
│                    ▼                                         │
│  2. Frontend calls POST /users/login                         │
│                    │                                         │
│                    ▼                                         │
│  3. Backend verifies credentials in PostgreSQL               │
│                    │                                         │
│                    ▼                                         │
│  4. Backend returns { id, name }                             │
│                    │                                         │
│                    ▼                                         │
│  5. Frontend calls GET /coordinates/{userId}                 │
│                    │                                         │
│                    ▼                                         │
│  6. Backend returns saved coordinates from PostgreSQL        │
│                    │                                         │
│                    ▼                                         │
│  7. Frontend saves to local IndexedDB                        │
│                    │                                         │
│                    ▼                                         │
│  8. Fog renders & Grid is created                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Exploration Session Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   DURING EXPLORATION                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  GPS updates position                                        │
│           │                                                  │
│           ▼                                                  │
│  Check: Is this a new area? (grid check)                     │
│           │                                                  │
│     ┌─────┴─────┐                                            │
│     │           │                                            │
│    YES          NO                                           │
│     │           │                                            │
│     ▼           ▼                                            │
│  Save to     (ignore)                                        │
│  IndexedDB                                                   │
│     │                                                        │
│     ▼                                                        │
│  Rebuild spatial index                                       │
│     │                                                        │
│     ▼                                                        │
│  Redraw fog canvas                                           │
│                                                              │
│  Note: All saves are LOCAL only during exploration.          │
│  No network requests until logout/sync.                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Logout & Sync Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      LOGOUT FLOW                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User clicks logout                                       │
│                    │                                         │
│                    ▼                                         │
│  2. Read ALL points from local IndexedDB                     │
│                    │                                         │
│                    ▼                                         │
│  3. POST /coordinates/{userId} with all points               │
│     (bulk save to PostgreSQL)                                │
│                    │                                         │
│                    ▼                                         │
│  4. Backend inserts to discovered_coordinates                │
│     using PostGIS:                                           │
│     ST_SetSRID(ST_MakePoint(x, y), 4326)                     │
│                    │                                         │
│                    ▼                                         │
│  5. Clear local IndexedDB                                    │
│                    │                                         │
│                    ▼                                         │
│  6. Show login screen                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Conclusions & Learnings

### Key Technical Learnings

| Learning | Details |
|----------|---------|
| **Grid Optimization** | Grid-based indexing provides O(1) lookup for proximity checks. Without this, adding new point would slow down exponentially as points accumulate. |
| **Dual Database Architecture** | IndexedDB + PostgreSQL pattern works excellently for offline-first mobile apps with sync capabilities. |
| **PostGIS** | Using geometry types with ST_MakePoint and SRID 4326 enables proper geographic data storage and future spatial queries. |

### What This Project Tought Us

- Modern JavaScript frameworks (React) and build tools (Vite)
- Geographic information systems and spatial databases
- Development patterns and offline-first architecture
- RESTful API design with authentication
- Performance optimization through algorithmic improvements
- Docker containerization for databases

---

## 9. Installation Instructions

### Prerequisites

- Node.js v18+
- Docker Desktop
- Git

### Backend + Database Setup

```bash
# 1. Clone the repository
git clone https://github.com/OrenOngil1/AtlasUnveiled.git

# 2. Navigate to backend
cd backend

# 3. Install dependencies
npm install

# 4. Start PostgreSQL with PostGIS
docker compose up -d

# 5. Wait for database to be ready, then push schema
npx drizzle-kit push

# 6. View data with Drizzle Studio
npx drizzle-kit studio

# 7. Start the backend server
npm run dev
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Enter the web app
http://localhost:5173
```
---

