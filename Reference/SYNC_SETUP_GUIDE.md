# 🔄 Jaquizy Sync Setup Guide

## 📋 **Quick Setup Steps** (15 minutes)

### **Step 1: Fix Supabase Schema** (5 minutes)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click on "SQL Editor" in the left sidebar

2. **Run Schema Fixes**
   - Copy the entire content of `supabase-schema-fixes.sql`
   - Paste into Supabase SQL Editor
   - Click "Run" button
   - ✅ You should see "ALL SCHEMA FIXES APPLIED SUCCESSFULLY!"

### **Step 2: Set Environment Variables** (2 minutes)

Make sure your `.env` file has these variables:
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
NODE_ENV=development
```

### **Step 3: Test the Sync** (8 minutes)

1. **Start your server**
   ```bash
   npm run dev
   ```

2. **Check server logs for sync routes**
   - You should see sync routes loaded
   - No errors about missing dependencies

3. **Test sync endpoint**
   ```bash
   # Replace TOKEN with your actual JWT token from login
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/sync/test
   ```

4. **Login to your app**
   - You should see sync logs in server console
   - Background sync should start automatically

---

## 🎯 **How Sync Works Now**

### **Automatic Sync Events:**
- ✅ **Login**: Pulls latest data from Supabase
- ✅ **Background**: Every 5 minutes while active
- ✅ **Page focus**: When returning to the app
- ✅ **Online**: When internet connection restored
- ✅ **Before exit**: When closing/leaving app

### **Manual Sync Options:**
```javascript
// Available in browser console:
await window.SyncClient.pullFromCloud();     // Pull from Supabase
await window.SyncClient.pushToCloud();       // Push to Supabase  
await window.SyncClient.emergencySync();     // Force sync everything
await window.SyncClient.showSyncStatus();    // Check sync status
```

### **What Gets Synced:**
- ✅ **Topics**: User-created topics
- ✅ **Notes**: All note content and edits
- ✅ **Questions**: Generated questions
- ✅ **Practice Sessions**: Scores and progress
- ✅ **User Answers**: All practice responses
- ✅ **Usage Tracking**: For billing and limits

---

## 🚀 **Testing Your Sync**

### **Quick Test Sequence:**

1. **Create test data locally**
   ```javascript
   // In browser console:
   console.log('Creating test topic...');
   // Use your app to create a topic and some notes
   ```

2. **Push to cloud**
   ```javascript
   await window.SyncClient.pushToCloud();
   ```

3. **Verify in Supabase**
   - Check your Supabase dashboard
   - Go to Table Editor
   - You should see your data in topics/notes tables

4. **Clear local data and pull back**
   ```javascript
   // This would be done via app reset, but for testing:
   await window.SyncClient.pullFromCloud();
   ```

### **Common Issues & Solutions:**

**❌ "Sync service not available"**
- Check that `better-sqlite3` is installed: `npm install better-sqlite3`
- Verify Supabase credentials in `.env`

**❌ "RLS policy violated"**
- Make sure you're logged in with a valid JWT
- Check that user_id matches between local and Supabase

**❌ "Background sync failed"**
- Check internet connection
- Verify Supabase project is active
- Look at server console for detailed errors

---

## 📊 **Sync Monitoring**

### **Server Logs to Watch:**
```
🔄 Starting background sync for user@email.com
✅ Background sync completed for user@email.com
⬆️ Push sync requested for user@email.com  
✅ Synced 5 records from cloud
```

### **Browser Console Messages:**
```
🔄 Initializing sync client...
✅ Sync client initialized
🔄 Periodic sync started (every 5 minutes)
🔄 Background sync: 3 records backed up
```

### **Frontend Notifications:**
- Success: "Synced X records from cloud"
- Success: "Backed up X records to cloud"
- Error: "Sync failed: [error message]"

---

## 🎉 **What You've Gained**

### ✅ **Multi-Device Access**
- Start studying on laptop, continue on phone
- All notes, questions, and progress synced

### ✅ **Data Safety**
- Automatic cloud backup of all study materials
- No data loss on device failure
- Version history preserved

### ✅ **Seamless Experience**
- Works online and offline
- Automatic sync in background
- No user intervention needed

### ✅ **Billing Accuracy**
- Usage tracking synced across devices
- Consistent limits enforcement
- Accurate subscription management

---

## 🔧 **Advanced Configuration**

### **Customizing Sync Frequency:**
```javascript
// In sync-client.js, change this line:
const syncInterval = 5 * 60 * 1000; // 5 minutes -> change to your preference
```

### **Adding More Tables:**
```javascript
// In enhanced-sync-service.js, add to this array:
this.syncTables = [
    'topics',
    'notes', 
    'questions',
    'practice_sessions',
    'user_answers',
    'usage_tracking',
    'your_new_table'  // Add here
];
```

### **Conflict Resolution:**
Currently using "last write wins" - can be enhanced to:
- Show user both versions
- Merge compatible changes
- Keep history of conflicts

---

## 🎯 **Ready to Deploy!**

With sync working, your Jaquizy deployment will have:
- ✅ **Professional data management**
- ✅ **Multi-device user experience**  
- ✅ **Reliable cloud backup**
- ✅ **Accurate usage billing**

The sync system runs automatically in the background. Users won't even know it's there - it just works! 🚀

---

## 🆘 **Need Help?**

**Check these files for troubleshooting:**
- Server logs: Look for sync-related messages
- Browser console: Check for sync client messages
- `DATABASE_SYNC_STRATEGY.md`: Detailed technical info

**Test endpoints:**
- `GET /api/sync/status` - Check sync status
- `POST /api/sync/test` - Test connectivity (dev only)
- `GET /api/health` - Verify server is running

Your hybrid offline-first architecture with cloud sync is now complete! 🎉