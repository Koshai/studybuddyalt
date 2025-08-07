# Jaquizy - SQLite ↔️ Supabase Sync Strategy

## 📊 **Database Architecture Analysis**

### **Current State:**
- ✅ **SQLite**: Local database with 7 tables, properly indexed
- ✅ **Supabase**: Cloud PostgreSQL with matching schema + RLS policies
- ✅ **Hybrid Service**: Exists but needs enhancement for full sync

### **Key Differences Found:**
| Feature | SQLite | Supabase | Sync Impact |
|---------|--------|----------|-------------|
| **IDs** | UUIDs (TEXT) | UUIDs (UUID) | ✅ Compatible |
| **Users** | Missing user table | user_profiles table | 🔧 Need user mapping |
| **Auth** | JWT-based | Supabase Auth | 🔧 Need auth bridge |
| **Timestamps** | DATETIME | TIMESTAMPTZ | ✅ Compatible |
| **RLS** | None | Full RLS policies | 🔧 Need user filtering |

---

## 🎯 **Sync Strategy Overview**

### **Sync Architecture:**
```
Local SQLite (Primary) ↔️ Hybrid Service ↔️ Supabase (Cloud Backup)
                              ↕️
                        Conflict Resolution
```

### **Data Flow Patterns:**
1. **User Login**: Pull latest data from Supabase → SQLite
2. **User Activity**: All operations write to SQLite immediately
3. **Background Sync**: Push changes to Supabase every 5 minutes
4. **User Logout**: Final sync push to Supabase

---

## 🔄 **Table-by-Table Sync Plan**

### **1. User Profiles** 
```sql
SQLite: No table (user data in JWT)
Supabase: user_profiles (id, email, full_name, subscription_tier)

Sync Strategy:
- Create user profile in Supabase on first login
- Sync subscription_tier for usage limits
- Store user_id mapping locally
```

### **2. Topics**
```sql
SQLite: topics (id, subject_id, name, description, user_id, created_at)
Supabase: topics (identical schema)

Sync Strategy:
- Full bidirectional sync
- Conflict resolution: Last modified wins
- Local-first: Create locally, sync to cloud
```

### **3. Notes**
```sql
SQLite: notes (id, topic_id, content, file_name, word_count, created_at)
Supabase: notes (identical schema)

Sync Strategy:
- Critical data: Keep both versions on conflict
- Rich text content requires careful merging
- Sync file attachments to Supabase storage
```

### **4. Questions**
```sql
SQLite: questions (id, topic_id, question, answer, type, options, correct_index, explanation, created_at, note_id)
Supabase: questions (identical schema minus note_id)

Sync Issues:
- ⚠️ SQLite has note_id column, Supabase doesn't
- Need to add note_id to Supabase schema
```

### **5. Practice Sessions**
```sql
SQLite: practice_sessions (id, topic_id, user_id, questions_count, correct_answers, accuracy_rate, session_date)
Supabase: practice_sessions (identical schema)

Sync Strategy:
- Append-only data (no conflicts)
- Aggregate for analytics
- Critical for progress tracking
```

### **6. User Answers**
```sql
SQLite: user_answers (id, question_id, practice_session_id, user_answer, is_correct, time_taken, created_at)
Supabase: user_answers (identical schema)

Sync Strategy:
- Append-only historical data
- Batch sync for performance
- Essential for learning analytics
```

### **7. Usage Tracking**
```sql
SQLite: user_usage (id, user_id, month_year, questions_used, storage_used, topics_created, created_at, updated_at)
Supabase: Missing - needs to be added

Sync Issues:
- ⚠️ Critical for billing and limits
- Need to create usage_tracking table in Supabase
```

---

## 🛠️ **Implementation Plan**

### **Phase 1: Schema Alignment** (1-2 hours)
```sql
-- Add missing columns to Supabase
ALTER TABLE questions ADD COLUMN note_id UUID REFERENCES notes(id);

-- Add usage_tracking table to Supabase
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    month_year TEXT NOT NULL,
    questions_used INTEGER DEFAULT 0,
    storage_used INTEGER DEFAULT 0,
    topics_created INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Phase 2: Sync Service Enhancement** (3-4 hours)

**Update existing `hybrid-storage-service.js`:**
```javascript
class EnhancedHybridStorageService {
    // Add missing methods:
    async syncUserProfile(userData) { /* ... */ }
    async syncAllTables() { /* ... */ }
    async resolveConflicts(localData, remoteData) { /* ... */ }
    async backgroundSync() { /* ... */ }
}
```

**Key Methods to Implement:**
1. `pullFromSupabase()` - Download latest data
2. `pushToSupabase()` - Upload local changes  
3. `detectConflicts()` - Compare timestamps
4. `resolveConflicts()` - User choice or auto-resolve
5. `batchSync()` - Optimize for performance

### **Phase 3: Conflict Resolution** (2-3 hours)

**Conflict Resolution Strategy:**
```javascript
const conflictResolution = {
    topics: 'last_modified_wins',
    notes: 'keep_both_versions', 
    questions: 'last_modified_wins',
    practice_sessions: 'append_only',
    user_answers: 'append_only',
    usage_tracking: 'sum_values'
};
```

**UI for Conflicts:**
- Show side-by-side comparison
- Let user choose which version to keep
- Auto-resolve for non-critical data

### **Phase 4: Sync Triggers** (1-2 hours)

**Authentication Integration:**
```javascript
// In auth-service.js
async login(email, password) {
    const result = await supabaseAuth.login();
    if (result.success) {
        await hybridStorage.pullFromSupabase(result.user.id);
    }
    return result;
}

async logout() {
    await hybridStorage.pushToSupabase();
    await supabaseAuth.logout();
}
```

**Background Sync:**
```javascript
// Every 5 minutes when online
setInterval(async () => {
    if (navigator.onLine && isAuthenticated) {
        await hybridStorage.backgroundSync();
    }
}, 5 * 60 * 1000);
```

---

## ⚡ **Quick Implementation Guide**

### **Step 1: Fix Supabase Schema** (30 minutes)
```sql
-- Run in Supabase SQL editor:
ALTER TABLE questions ADD COLUMN note_id UUID REFERENCES notes(id);

CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    questions_used INTEGER DEFAULT 0,
    storage_used INTEGER DEFAULT 0, 
    topics_created INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Add RLS policies
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own usage" ON usage_tracking  
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);
```

### **Step 2: Create Enhanced Sync Service** (2 hours)

I can create the complete sync service if you want to proceed with implementation.

### **Step 3: Test Sync Flow** (1 hour)
```javascript
// Test sequence:
1. Create data locally
2. Sync to Supabase 
3. Clear local DB
4. Pull from Supabase
5. Verify data integrity
```

---

## 🚨 **Critical Sync Considerations**

### **Data Integrity:**
- Always backup before sync
- Validate data after sync
- Handle partial sync failures
- Rollback on critical errors

### **Performance:**
- Batch operations (don't sync one record at a time)
- Only sync changed data (use timestamps)
- Compress large content before transfer
- Use connection pooling

### **User Experience:**
- Show sync status to user
- Allow manual sync trigger
- Work offline seamlessly
- Handle slow connections gracefully

### **Security:**
- Validate all data before sync
- Use RLS policies in Supabase
- Encrypt sensitive data
- Audit sync operations

---

## 🎯 **Recommended Next Steps**

### **Immediate (Next 2 hours):**
1. **Fix Supabase schema** (add missing columns/tables)
2. **Test basic sync** with one table (topics)
3. **Verify RLS policies** work correctly

### **This Week:**
1. **Implement full sync service**
2. **Add conflict resolution UI**
3. **Test with real user data** 
4. **Deploy and monitor**

### **Future Enhancements:**
1. **Real-time sync** with Supabase subscriptions
2. **Multi-device coordination**
3. **Offline conflict detection**
4. **Sync analytics and monitoring**

---

## 💡 **Sync Benefits Once Implemented**

✅ **Users can access data from any device**
✅ **Automatic backup of all study materials**  
✅ **Seamless online/offline experience**
✅ **No data loss on device failure**
✅ **Multi-device study sessions**
✅ **Cloud-based usage tracking for billing**

## 🚀 **Ready to Implement?**

The analysis is complete and the strategy is solid. Would you like me to:

1. **Create the enhanced sync service code?**
2. **Generate the Supabase schema fixes?**  
3. **Build the conflict resolution UI?**
4. **Set up the sync testing framework?**

Your hybrid architecture is well-designed - we just need to enhance the sync layer! 🎯