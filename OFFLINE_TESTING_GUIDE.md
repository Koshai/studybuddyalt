# 🧪 Offline Functionality Testing Guide

## Current Setup Status ✅
- **Server**: Running on localhost:3001
- **User**: syed.r.akbar@gmail.com (existing online account)
- **Ollama**: Enabled and ready
- **Goal**: Test offline functionality with existing data

## 🎯 **Best Testing Approach**

### **Method 1: Dashboard Offline Setup (Recommended)**

#### **Step 1: Login and Access Dashboard**
1. Open browser → `http://localhost:3001`
2. Login with `syed.r.akbar@gmail.com`
3. Go to Dashboard
4. Look for **"AI Status"** section in right sidebar

#### **Step 2: Enable Offline Mode**
1. Find **"Enable Offline Mode"** button in AI Status section
2. Click the button → OfflineSetup modal opens
3. Follow the setup wizard:
   - **Benefits** → Click "Let's Set It Up"
   - **System Requirements** → Check compatibility
   - **Installation** → Watch progress (Ollama + Local Setup)
   - **Complete** → Account synced to local storage

#### **Step 3: Test Offline (Disconnect Internet)**
1. **Disconnect WiFi/Ethernet** (simulate offline)
2. **Refresh browser** → App should still work
3. **Test functionality**:
   - Create new topics
   - Upload study materials
   - Generate questions (using local Ollama)
   - Practice sessions
   - All data saved locally

#### **Step 4: Test Sync (Reconnect Internet)**
1. **Reconnect internet**
2. **Refresh page** → Changes should sync to cloud
3. **Verify data** persisted both locally and online

---

### **Method 2: API Testing (Technical Validation)**

#### **Step 1: Check Sync Status**
```bash
curl http://localhost:3001/auth/sync/status/syed.r.akbar@gmail.com
```
**Expected Response:**
```json
{
  "status": "success",
  "email": "syed.r.akbar@gmail.com",
  "hasCloudAccount": true,
  "hasLocalAccount": false,
  "canSync": true
}
```

#### **Step 2: Trigger Auto-Sync**
```bash
curl -X POST http://localhost:3001/auth/sync/auto \
  -H "Content-Type: application/json" \
  -d '{"email": "syed.r.akbar@gmail.com", "mode": "cloud_to_local"}'
```

#### **Step 3: Verify Local Account Created**
```bash
curl http://localhost:3001/auth/local/users
```

#### **Step 4: Check Offline Installation Status**
```bash
curl http://localhost:3001/api/setup/offline/status
```

---

### **Method 3: Manual Local Account (Alternative)**

If the dashboard method doesn't work, create a local account manually:

#### **Step 1: Create Local Account**
```bash
curl -X POST http://localhost:3001/auth/local/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "syed.r.akbar@gmail.com",
    "firstName": "Syed",
    "lastName": "Akbar",
    "password": "test123"
  }'
```

#### **Step 2: Login Locally**
```bash
curl -X POST http://localhost:3001/auth/local/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "syed.r.akbar@gmail.com",
    "password": "test123"
  }'
```

---

## 🔍 **What to Test & Verify**

### **Offline Functionality Checklist:**

#### **✅ Account & Authentication**
- [ ] Login works offline
- [ ] User data accessible
- [ ] Session persists

#### **✅ Study Materials**
- [ ] Upload PDFs/documents offline
- [ ] Files stored locally (`~/StudyBuddy/users/{userId}/uploads/`)
- [ ] OCR processing works

#### **✅ AI Question Generation**
- [ ] Generate questions using local Ollama
- [ ] Multiple choice questions created
- [ ] No API calls to OpenAI
- [ ] Fast response times (local processing)

#### **✅ Practice Sessions**
- [ ] Start practice sessions
- [ ] Answer questions
- [ ] Score tracking works
- [ ] Progress saved locally

#### **✅ Data Persistence**
- [ ] Data survives browser refresh
- [ ] Data survives server restart
- [ ] Local SQLite database populated

#### **✅ Sync Functionality**
- [ ] Online changes sync to local
- [ ] Offline changes sync to cloud
- [ ] No data loss during sync
- [ ] Conflict resolution works

---

## 📂 **File Locations to Check**

### **User Data Directory:**
```
C:\Users\boltu\StudyBuddy\users\{userId}\
├── profile.json      # User profile with sync settings
├── study_data.db     # Personal SQLite database
├── uploads\          # Uploaded study materials
└── generated\        # AI-generated content
```

### **Verification Commands:**
```bash
# Check if user directory created
ls -la ~/StudyBuddy/users/

# Check local database
# (You'll need SQLite browser or command line)

# Check uploads folder
ls -la ~/StudyBuddy/users/*/uploads/

# Check sync logs
curl http://localhost:3001/auth/sync/log
```

---

## 🐛 **Troubleshooting**

### **Issue 1: "Enable Offline Mode" Button Not Showing**
**Solution:** Check AI Status section or try:
```javascript
// In browser console
fetch('/api/setup/offline/status').then(r => r.json()).then(console.log)
```

### **Issue 2: Sync Not Working**
**Solution:** Check sync status:
```bash
curl http://localhost:3001/auth/sync/status/syed.r.akbar@gmail.com
```

### **Issue 3: Local Account Creation Fails**
**Solution:** Check local user service:
```bash
curl -X POST http://localhost:3001/auth/local/init
```

### **Issue 4: Ollama Not Responding**
**Solution:** Test Ollama directly:
```bash
curl http://localhost:11434/api/version
```

---

## 🎬 **Step-by-Step Demo Script**

### **Demo 1: Online → Offline Transition**

1. **Start Online**: 
   - Login: `syed.r.akbar@gmail.com`
   - Create a topic: "Math Test"
   - Upload a document
   - Generate 5 questions

2. **Enable Offline Mode**:
   - Click "Enable Offline Mode" in dashboard
   - Watch setup progress
   - Verify local account created

3. **Go Offline**:
   - Disconnect internet
   - Refresh browser
   - Login with same credentials
   - Verify all data still available

4. **Test Offline Features**:
   - Create new topic: "Science Notes"
   - Upload new document
   - Generate questions (using local AI)
   - Take practice session

5. **Return Online**:
   - Reconnect internet
   - Refresh page
   - Verify new offline data synced to cloud

### **Demo 2: Pure Offline Experience**

1. **Disconnect Internet**: Turn off WiFi
2. **Open Browser**: `http://localhost:3001`
3. **Create Account**: Register new local account
4. **Full Workflow**: Topics → Upload → Questions → Practice
5. **Reconnect**: Watch auto-sync to cloud

---

## 📊 **Success Criteria**

Your offline functionality is working correctly if:

✅ **Account Sync**: Online account works offline  
✅ **Data Persistence**: All data available offline  
✅ **AI Processing**: Questions generated locally (fast)  
✅ **File Storage**: Documents stored locally  
✅ **Session Management**: Login works offline  
✅ **Bidirectional Sync**: Changes sync both ways  
✅ **No Data Loss**: All data preserved during transitions  

---

## 🚀 **Quick Test Command**

Run this to do a quick end-to-end test:

```bash
# 1. Check server health
curl http://localhost:3001/api/health

# 2. Check sync status for your user
curl http://localhost:3001/auth/sync/status/syed.r.akbar@gmail.com

# 3. Check offline setup status
curl http://localhost:3001/api/setup/offline/status

# 4. If needed, trigger auto-sync
curl -X POST http://localhost:3001/auth/sync/auto \
  -H "Content-Type: application/json" \
  -d '{"email": "syed.r.akbar@gmail.com"}'
```

This will tell you exactly what's working and what needs attention!