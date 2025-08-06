# StudyBuddy Offline-First Architecture

## Problem Statement
Current StudyBuddy requires internet access and uses shared database. For true offline functionality, we need local data storage and offline app access.

## Proposed Solutions

### Option 1: Electron Desktop App (RECOMMENDED)
**Best for:** Complete offline functionality with native OS integration

#### Architecture:
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Electron Main     │    │   Renderer Process  │    │   Cloud Sync        │
│   - Local SQLite    │◄──►│   - Vue.js Frontend │◄──►│   - Supabase        │
│   - Ollama Service  │    │   - API Calls       │    │   - User Account    │
│   - File System     │    │   - UI Components   │    │   - Data Backup     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

#### Implementation:
1. **Local Database**: Each user gets their own SQLite file
   - Location: `~/Documents/StudyBuddy/user_data.db`
   - Schema: Same as current + sync metadata
   
2. **Offline Capabilities**:
   - Complete app functionality without internet
   - Local Ollama integration
   - File storage in user directory
   
3. **Sync Strategy**:
   - Background sync when online
   - Conflict resolution for concurrent edits
   - Export/import functionality

### Option 2: Progressive Web App (PWA)
**Best for:** Web-based with some offline capability

#### Architecture:
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Service Worker    │    │   Browser Storage   │    │   Cloud Backend     │
│   - Cache Strategy  │◄──►│   - IndexedDB       │◄──►│   - API Server      │
│   - Offline Queue   │    │   - LocalStorage    │    │   - Supabase        │
│   - Background Sync│    │   - File Cache      │    │   - Authentication  │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

#### Limitations:
- No local Ollama (browser security restrictions)
- Limited file system access
- Requires initial online access

### Option 3: Hybrid Local Server (CURRENT ENHANCED)
**Best for:** Quick implementation with current codebase

#### Architecture:
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Local Node Server │    │   Web Browser       │    │   Cloud Sync        │
│   - User SQLite DB  │◄──►│   - Frontend UI     │◄──►│   - Supabase        │
│   - Ollama Service  │    │   - Localhost API   │    │   - Sync Service    │
│   - User Data Dir   │    │   - PWA Features    │    │   - Data Export     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## Recommended Implementation: Hybrid Approach

### Phase 1: Enhanced Local Server
1. **User-Specific Databases**
   ```
   ~/StudyBuddy/
   ├── users/
   │   ├── user_123/
   │   │   ├── data.db          # Personal SQLite
   │   │   ├── uploads/         # Study materials
   │   │   └── config.json      # User settings
   │   └── user_456/
   │       └── ...
   ├── ollama/                  # Shared AI models
   └── app/                     # Application files
   ```

2. **Local Authentication**
   - Simple local user management
   - Encrypted local storage
   - Cloud account linking

3. **Offline-First Data Flow**
   ```
   User Action → Local SQLite → Background Cloud Sync (when online)
   ```

### Phase 2: Desktop App Migration
- Package as Electron app
- Auto-updater for app updates
- Native OS integration
- System tray for quick access

## Data Architecture

### Local Database Schema
```sql
-- Enhanced with sync metadata
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    cloud_user_id TEXT,  -- Links to Supabase
    last_sync TIMESTAMP,
    sync_enabled BOOLEAN DEFAULT 1
);

CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY,
    table_name TEXT,
    record_id TEXT,
    operation TEXT,      -- 'INSERT', 'UPDATE', 'DELETE'
    data JSON,
    created_at TIMESTAMP,
    synced BOOLEAN DEFAULT 0
);
```

### Sync Strategy
1. **Optimistic Sync**: Local operations complete immediately
2. **Background Queue**: Changes queued for cloud sync
3. **Conflict Resolution**: Last-write-wins with user override option
4. **Data Migration**: Export/import for switching devices

## Offline Setup Enhanced

### Installation Process
1. **Download Desktop App** (or enhanced local server)
2. **User Profile Creation** (local account)
3. **Ollama Installation** (existing process)
4. **Data Directory Setup** (user-specific folder)
5. **Optional Cloud Linking** (for sync)

### File Structure After Setup
```
~/StudyBuddy/
├── app/                     # Application
├── data/
│   └── user_profile/
│       ├── study_data.db    # Personal database
│       ├── uploads/         # Study materials
│       ├── generated/       # AI outputs
│       └── cache/           # Temp files
├── models/                  # Ollama models
└── logs/                    # Application logs
```

## Benefits of This Approach

1. **True Offline**: Complete functionality without internet
2. **Privacy**: All data stored locally by default
3. **Performance**: No network latency for operations
4. **Reliability**: No dependency on internet connection
5. **Flexibility**: Optional cloud sync for convenience
6. **Migration Path**: Easy upgrade to full desktop app

## Next Steps

1. Implement user-specific database routing
2. Create local user management system
3. Build data sync service
4. Enhance offline setup to create user directories
5. Add export/import functionality
6. Prepare for Electron migration