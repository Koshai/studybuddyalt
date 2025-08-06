# StudyBuddy Desktop & Sync Guide

## 🚀 How to Launch StudyBuddy (User-Friendly)

### **Method 1: Desktop Launcher (Recommended)**
```bash
# Double-click on StudyBuddy.bat (Windows)
# Or run from command line:
npm run desktop
```

### **Method 2: One-Click Launch**
```bash
# From the StudyBuddy folder:
npm run launch
```

### **Method 3: Create Desktop Shortcut**
```bash
npm run create-shortcut
```

## 🔄 Account Sync - Your Questions Answered

### **Q: "If I create a user online, will it work offline?"**
**Answer: YES!** Here's how:

1. **Create account online** → Use StudyBuddy normally
2. **Going offline?** → Click "Enable Offline Mode" in dashboard
3. **System automatically** → Downloads your account data locally
4. **Work offline** → All your data available without internet
5. **Go back online** → Changes sync automatically

### **Q: "If I create a user offline, will it work online?"**
**Answer: YES!** Here's how:

1. **Create local account** → Work offline with local storage
2. **Go online later** → System detects internet connection
3. **Auto-sync triggered** → Creates cloud account automatically
4. **Cross-device access** → Access your data from any device
5. **Bidirectional sync** → Changes merge intelligently

## 📋 Step-by-Step User Scenarios

### **Scenario 1: Online → Offline**
```
1. User registers at studybuddy.com
2. Creates topics, uploads materials, generates questions
3. Wants to work offline (privacy, travel, etc.)
4. Clicks "Enable Offline Mode" in dashboard
5. System installs Ollama + creates local copy of account
6. User can now work offline with all data intact
```

### **Scenario 2: Offline → Online**
```
1. User installs StudyBuddy locally (no internet)
2. Creates local account, works offline
3. Adds study materials, generates questions
4. Gets internet connection later
5. System automatically creates cloud account
6. Local data syncs to cloud for cross-device access
```

### **Scenario 3: Seamless Switching**
```
1. User has both local and cloud accounts
2. Works online → data syncs to cloud
3. Goes offline → continues with local data
4. Makes changes offline → queued for sync
5. Returns online → changes merge automatically
```

## 🖥️ Desktop Experience

### **Automatic Features:**
- ✅ **Port Management**: Finds available port (3001-3010)
- ✅ **Browser Launch**: Opens automatically in default browser
- ✅ **Desktop Shortcut**: Created on first run
- ✅ **Graceful Shutdown**: Ctrl+C stops server safely
- ✅ **Status Monitoring**: Shows server status and URL

### **User Experience:**
```
==================================================
   📚 StudyBuddy - AI Study Assistant
   🚀 Starting desktop application...
==================================================

📡 Using port: 3001
🚀 Starting StudyBuddy server...
✅ Server started successfully!
🌐 Opening StudyBuddy at: http://localhost:3001
🖱️ Desktop shortcut created!

✅ StudyBuddy is now running!
🌐 URL: http://localhost:3001
📝 Press Ctrl+C to stop the server
```

## 🔄 Sync API Endpoints

### **Check Sync Status**
```http
GET /auth/sync/status/user@example.com
```
**Response:**
```json
{
  "status": "success",
  "email": "user@example.com",
  "hasCloudAccount": true,
  "hasLocalAccount": true,
  "cloudUserId": "uuid-123",
  "localUserId": "uuid-456",
  "canSync": true,
  "syncInProgress": false
}
```

### **Auto-Sync Accounts**
```http
POST /auth/sync/auto
{
  "email": "user@example.com",
  "mode": "bidirectional"  // or "cloud_to_local" or "local_to_cloud"
}
```

### **Manual Sync Options**
```http
# Cloud to Local (for offline use)
POST /auth/sync/cloud-to-local
{
  "cloudUserId": "uuid-123",
  "cloudUserData": { "email": "...", "firstName": "..." }
}

# Local to Cloud (for cross-device access)
POST /auth/sync/local-to-cloud
{
  "localUserId": "uuid-456"
}
```

## 📁 File Structure After Setup

### **Windows:**
```
C:\Users\YourName\StudyBuddy\
├── users\
│   └── user_abc123\
│       ├── profile.json      # User settings
│       ├── study_data.db     # Personal database
│       ├── uploads\          # Study materials
│       └── generated\        # AI outputs
├── models\
│   └── llama3.2:1b          # AI model
└── app\                     # Application files
```

### **Mac/Linux:**
```
~/StudyBuddy/
├── users/
│   └── user_abc123/
│       ├── profile.json      # User settings
│       ├── study_data.db     # Personal database
│       ├── uploads/          # Study materials
│       └── generated/        # AI outputs
├── models/
│   └── llama3.2:1b          # AI model
└── app/                     # Application files
```

## 🔒 Privacy & Data Control

### **Local Mode (Maximum Privacy):**
- ✅ All data stays on your computer
- ✅ No internet required after setup
- ✅ Complete user control
- ✅ Fast AI processing (no API calls)

### **Cloud Sync (Convenience):**
- ✅ Access from multiple devices
- ✅ Automatic backups
- ✅ Cross-device synchronization
- ✅ Optional - user controls when to sync

### **Hybrid Mode (Best of Both):**
- ✅ Work offline with privacy
- ✅ Sync online for convenience
- ✅ Smart conflict resolution
- ✅ User chooses sync frequency

## 🛠️ Troubleshooting

### **Port Already in Use:**
```bash
# The launcher automatically finds free ports 3001-3010
# If all ports busy, it will show an error message
```

### **Server Won't Start:**
```bash
# Check Node.js installation:
node --version

# Check for conflicting processes:
netstat -ano | findstr :3001

# Try different port manually:
PORT=3002 npm start
```

### **Sync Issues:**
```bash
# Check sync status:
curl http://localhost:3001/auth/sync/status/your@email.com

# View sync log:
curl http://localhost:3001/auth/sync/log

# Force auto-sync:
curl -X POST http://localhost:3001/auth/sync/auto \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

## 🎯 Quick Start Commands

### **New User (No Internet):**
```bash
1. Download StudyBuddy folder
2. Double-click StudyBuddy.bat
3. Create local account
4. Start studying offline!
```

### **Existing Online User:**
```bash
1. Login to online StudyBuddy
2. Click "Enable Offline Mode"
3. Wait for setup to complete
4. Desktop shortcut created automatically
5. Use either online or offline!
```

### **Developer/Advanced User:**
```bash
# Install dependencies
npm install

# Launch desktop mode
npm run desktop

# Create desktop shortcut
npm run create-shortcut

# Check server health
npm run health-check
```

## 📊 Sync Behavior Matrix

| User Type | Online Access | Offline Access | Data Location | Sync Behavior |
|-----------|---------------|----------------|---------------|---------------|
| Online Only | ✅ Full | ❌ None | Cloud | N/A |
| Local Only | ❌ None | ✅ Full | Local | N/A |
| Hybrid | ✅ Full | ✅ Full | Both | Auto-bidirectional |
| Cloud→Local | ✅ Read-only | ✅ Full | Both | Cloud overwrites local |
| Local→Cloud | ✅ Full | ✅ Read-only | Both | Local overwrites cloud |

## 🚀 Future Enhancements

### **Phase 2: Electron App**
- Native desktop application
- System tray integration
- Auto-updater
- Better OS integration

### **Phase 3: Advanced Sync**
- Real-time collaboration
- Version history
- Conflict resolution UI
- Selective sync options

The system now provides complete flexibility for users to work online, offline, or switch between both modes seamlessly!