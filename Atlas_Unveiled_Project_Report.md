# Atlas Unveiled

## A Fog-of-War Exploration Web App

**By: Levi Vendro & Oren**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [The What?](#2-the-what?)
3. [The How?](#3-the-how?)
4. [System Architecture](#4-system-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Core Features](#6-core-features)
   - [Fog of War Mechanism](#61-fog-of-war-mechanism)
   - [Spatial Indexing & Grid Logic](#62-spatial-indexing--grid-logic)
7. [Database Design](#7-database-design)
8. [Data Flow & Synchronization](#8-data-flow--synchronization)
9. [Conclusions & Learnings](#9-conclusions--learnings)
10. [Installation Instructions](#10-installation-instructions)

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

## 2. The What?

Creating a web exploration app that gamifies real-world movement presents several technical challenges:

### Technical Challenges

| Challenge | Description |
|-----------|-------------|
| **Fog of War Rendering** | Efficiently rendering fog overlay that updates in real-time |
| **Data Persistence** | Storing exploration progress locally with cross-device sync |
| **Offline Functionality** | App must work seamlessly without internet |
| **Performance Optimization** | Managing a large number of coordinates without degrading performance |
| **Redundant Point Prevention** | Avoiding saving overlapping coordinates that reveal the same area |

### Key Requirements

1. Display an interactive map with a fog overlay
2. Track GPS location and clear fog in real-time
3. Store exploration data locally for offline use
4. Synchronize data with server for backup and cross-device access
5. Support user authentication

---

## 3. The How?

The solution employs a modern web technology stack with a **dual-database architecture** to achieve both offline functionality and cross-device synchronization.

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MOBILE APP (Android APK)                          │
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

### Dual Database Architecture

A critical design decision was implementing a dual-database architecture:

| Database | Location | Purpose | Technology |
|----------|----------|---------|------------|
| **IndexedDB** | User's device | Offline-first local storage | Dexie wrapper |
| **PostgreSQL** | Server | Authoritative backup & sync | PostGIS extension |

This enables:
- **Offline functionality**: App works without internet
- **Cross-device sync**: Login from any device to access your exploration
- **Data safety**: Server backup prevents data loss

---

## 4. System Architecture

### Component Flow Diagram

```
                              ┌──────────────────┐
                              │   User Opens     │
                              │      App         │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  Login Screen    │
                              │  (Username/Pass) │
                              └────────┬─────────┘
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                          ▼                         ▼
                 ┌─────────────────┐      ┌─────────────────┐
                 │ POST /users/    │      │  POST /users    │
                 │    login        │      │  (Register)     │
                 └────────┬────────┘      └────────┬────────┘
                          │                         │
                          └────────────┬────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ GET /coordinates │
                              │   /:userId       │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  Populate Local  │
                              │    IndexedDB     │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │   Map + Fog      │
                              │    Display       │
                              └────────┬─────────┘
                                       │
                          ┌────────────┴────────────┐
                          │    GPS Tracking Loop    │
                          └────────────┬────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │  New Position    │
                              │   Received       │
                              └────────┬─────────┘
                                       │
                                       ▼
                          ┌────────────────────────┐
                          │  Is position ≥35m from │
                          │   all existing points? │
                          └────────────┬───────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        │                             │
                       YES                           NO
                        │                             │
                        ▼                             ▼
               ┌─────────────────┐          ┌─────────────────┐
               │  Save to Local  │          │     Ignore      │
               │    IndexedDB    │          │   (redundant)   │
               └────────┬────────┘          └─────────────────┘
                        │
                        ▼
               ┌─────────────────┐
               │  Redraw Fog     │
               │  with all pts   │
               └─────────────────┘
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
| Android Studio | APK building |
| Docker Compose | Local PostgreSQL setup |

---

## 6. Core Features

### 6.1 Fog of War Mechanism

The fog of war is the central "gameplay" mechanic. The map is covered with a semi-transparent fog layer that gets cleared as the user explores the map. The user has a "light" aura around him that clears the fog at 40m radius.

---

### 6.2 Spatial Indexing & Grid Logic

A critical optimization prevents saving redundant points that reveal overlapping areas.

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

For CLEAR_RADIUS = 40m (visual circle size):
SAVE_THRESHOLD = 0.87 × 40m ≈ 35m

If points are 35m+ apart → ≤50% overlap → SAVE
If points are <35m apart → >50% overlap → DON'T SAVE
```


#### Grid-Based Lookup

Instead of checking every saved point (O(n)), we use a grid for O(1) lookups:

```
┌─────────────────────────────────────────────────────────────┐
│                     SPATIAL INDEX GRID                      │
│                                                             │
│    ┌────┬────┬────┬────┬────┐                               │
│    │ A  │ B  │ C  │ D  │ E  │                               │
│    │    │ ●  │    │    │    │                               │
│    ├────┼────┼────┼────┼────┤                               │
│    │ F  │ G  │ H  │ I  │ J  │                               │
│    │    │    │ ●  │    │ ●  │                               │
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

---

## 7. Database Design

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

## 8. Data Flow & Synchronization

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
│  8. Fog renders with all saved locations cleared             │
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

## 9. Conclusions & Learnings

### Key Technical Learnings

| Learning | Details |
|----------|---------|
| **Spatial Optimization** | Grid-based indexing provides O(1) lookup for proximity checks. Without this, the app would slow down exponentially as points accumulate. |
| **Dual Database Architecture** | IndexedDB + PostgreSQL pattern works excellently for offline-first mobile apps with sync capabilities. |
| **Capacitor Bridge** | Building as a web app with Capacitor provides excellent dev velocity while accessing native GPS features. |
| **PostGIS** | Using geometry types with ST_MakePoint and SRID 4326 enables proper geographic data storage and future spatial queries. |

### What This Project Tought Us

- Modern JavaScript frameworks (React) and build tools (Vite)
- Geographic information systems and spatial databases
- Mobile development patterns and offline-first architecture
- RESTful API design with authentication
- Performance optimization through algorithmic improvements
- Docker containerization for databases

---

## 10. Installation Instructions

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

