// Auto-Sync Service - Bidirectional sync for missing data detection
// Automatically syncs SQLite ↔ Supabase when user logs in

const { createClient } = require('@supabase/supabase-js');
const { getSyncService } = require('./enhanced-sync-service');

class AutoSyncService {
    constructor() {
        // Use service role key for admin operations
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
        );
        this.syncService = null;
    }

    /**
     * Initialize sync service connection
     */
    async init() {
        if (!this.syncService) {
            this.syncService = getSyncService();
        }
    }

    /**
     * Perform automatic bidirectional sync on login
     * Detects missing data from both sides and syncs accordingly
     */
    async performAutoSync(userId, userEmail) {
        try {
            await this.init();
            console.log(`🔄 Starting auto-sync for ${userEmail} (${userId})`);

            // Step 1: Get data counts from both sides
            const { sqlite: sqliteCounts, supabase: supabaseCounts } = await this.getDataCounts(userId);
            
            console.log('📊 Data comparison:');
            console.log('   SQLite:', sqliteCounts);
            console.log('   Supabase:', supabaseCounts);

            let syncActions = [];

            // Step 2: Determine sync strategy for each table with conflict resolution
            for (const table of ['topics', 'notes', 'questions', 'practice_sessions', 'user_answers']) {
                const sqliteCount = sqliteCounts[table] || 0;
                const supabaseCount = supabaseCounts[table] || 0;

                if (sqliteCount === 0 && supabaseCount > 0) {
                    // SQLite is empty, pull from Supabase
                    syncActions.push({ action: 'pull', table, reason: 'SQLite empty' });
                } else if (supabaseCount === 0 && sqliteCount > 0) {
                    // Supabase is empty, push to Supabase
                    syncActions.push({ action: 'push', table, reason: 'Supabase empty' });
                } else if (sqliteCount > supabaseCount) {
                    // SQLite has more data - check for conflicts and merge
                    syncActions.push({ action: 'merge_push', table, reason: `SQLite has ${sqliteCount - supabaseCount} more records` });
                } else if (supabaseCount > sqliteCount) {
                    // Supabase has more data - check for conflicts and merge
                    syncActions.push({ action: 'merge_pull', table, reason: `Supabase has ${supabaseCount - sqliteCount} more records` });
                } else if (sqliteCount === supabaseCount && sqliteCount > 0) {
                    // Same count but check for timestamp differences
                    syncActions.push({ action: 'check_timestamps', table, reason: 'Verify data freshness' });
                }
                // If both are 0, no action needed
            }

            console.log('🎯 Sync plan:', syncActions);

            // Step 3: Execute sync actions
            let totalSynced = 0;
            const results = {
                pulled: 0,
                pushed: 0,
                errors: []
            };

            for (const action of syncActions) {
                try {
                    if (action.action === 'pull') {
                        console.log(`⬇️ Pulling ${action.table}: ${action.reason}`);
                        const result = await this.syncService.syncTableFromCloud(action.table, userId);
                        results.pulled += result;
                        totalSynced += result;
                    } else if (action.action === 'push') {
                        console.log(`⬆️ Pushing ${action.table}: ${action.reason}`);
                        const result = await this.syncService.pushTableToCloud(action.table, userId);
                        results.pushed += result;
                        totalSynced += result;
                    } else if (action.action === 'merge_pull') {
                        console.log(`🔄 Merge-pulling ${action.table}: ${action.reason}`);
                        const result = await this.mergeFromCloud(action.table, userId);
                        results.pulled += result;
                        totalSynced += result;
                    } else if (action.action === 'merge_push') {
                        console.log(`🔄 Merge-pushing ${action.table}: ${action.reason}`);
                        const result = await this.mergeToCloud(action.table, userId);
                        results.pushed += result;
                        totalSynced += result;
                    } else if (action.action === 'check_timestamps') {
                        console.log(`🔍 Checking ${action.table}: ${action.reason}`);
                        const result = await this.checkAndSyncTimestamps(action.table, userId);
                        results.pulled += result.pulled;
                        results.pushed += result.pushed;
                        totalSynced += result.total;
                    }
                } catch (error) {
                    console.error(`❌ Failed to sync ${action.table}:`, error.message);
                    results.errors.push({ table: action.table, error: error.message });
                }
            }

            // Step 4: Ensure user profile exists in Supabase
            try {
                await this.ensureUserProfile(userId, userEmail);
            } catch (profileError) {
                console.warn('⚠️ User profile sync failed:', profileError.message);
                results.errors.push({ table: 'user_profile', error: profileError.message });
            }

            console.log(`✅ Auto-sync complete: ${totalSynced} records synced`);
            console.log(`   ⬇️ Pulled: ${results.pulled} records`);
            console.log(`   ⬆️ Pushed: ${results.pushed} records`);
            
            if (results.errors.length > 0) {
                console.warn(`⚠️ ${results.errors.length} sync errors occurred`);
            }

            return {
                success: true,
                totalSynced,
                results,
                syncActions
            };

        } catch (error) {
            console.error('❌ Auto-sync failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get data counts from both SQLite and Supabase
     */
    async getDataCounts(userId) {
        const sqlite3 = require('sqlite3').verbose();
        const path = require('path');
        
        // SQLite counts
        const dbPath = path.join(__dirname, '../../data/study_ai_simplified.db');
        const db = new sqlite3.Database(dbPath);
        
        const sqliteCounts = {};
        
        // Get counts from SQLite (user-specific data only)
        const sqliteQueries = {
            topics: `SELECT COUNT(*) as count FROM topics WHERE user_id = ?`,
            notes: `SELECT COUNT(*) as count FROM notes n 
                   JOIN topics t ON n.topic_id = t.id 
                   WHERE t.user_id = ?`,
            questions: `SELECT COUNT(*) as count FROM questions q 
                       JOIN topics t ON q.topic_id = t.id 
                       WHERE t.user_id = ?`,
            practice_sessions: `SELECT COUNT(*) as count FROM practice_sessions WHERE user_id = ?`,
            user_answers: `SELECT COUNT(*) as count FROM user_answers ua 
                          JOIN practice_sessions ps ON ua.practice_session_id = ps.id 
                          WHERE ps.user_id = ?`
        };

        for (const [table, query] of Object.entries(sqliteQueries)) {
            try {
                const result = await new Promise((resolve, reject) => {
                    db.get(query, [userId], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
                sqliteCounts[table] = result.count;
            } catch (error) {
                console.warn(`⚠️ Failed to get SQLite count for ${table}:`, error.message);
                sqliteCounts[table] = 0;
            }
        }

        db.close();

        // Supabase counts (with RLS filtering)
        const supabaseCounts = {};
        
        try {
            // Query Supabase with explicit user filtering (bypassing RLS with service key)
            // For now, get all user data and count client-side to avoid complex joins
            const supabaseData = {};
            
            // Get topics directly
            const { data: topicsData, error: topicsError } = await this.supabase
                .from('topics')
                .select('id')
                .eq('user_id', userId);
                
            if (topicsError) throw topicsError;
            supabaseCounts.topics = topicsData?.length || 0;
            
            // Get user's topic IDs for filtering other tables
            const userTopicIds = topicsData?.map(t => t.id) || [];
            
            if (userTopicIds.length > 0) {
                // Get notes for user's topics
                const { data: notesData, error: notesError } = await this.supabase
                    .from('notes')
                    .select('id')
                    .in('topic_id', userTopicIds);
                    
                if (!notesError) supabaseCounts.notes = notesData?.length || 0;
                else supabaseCounts.notes = 0;
                
                // Get questions for user's topics  
                const { data: questionsData, error: questionsError } = await this.supabase
                    .from('questions')
                    .select('id')
                    .in('topic_id', userTopicIds);
                    
                if (!questionsError) supabaseCounts.questions = questionsData?.length || 0;
                else supabaseCounts.questions = 0;
            } else {
                supabaseCounts.notes = 0;
                supabaseCounts.questions = 0;
            }
            
            // Get practice sessions directly
            const { data: sessionsData, error: sessionsError } = await this.supabase
                .from('practice_sessions')
                .select('id')
                .eq('user_id', userId);
                
            if (!sessionsError) supabaseCounts.practice_sessions = sessionsData?.length || 0;
            else supabaseCounts.practice_sessions = 0;
            
            // Get user answers for user's sessions
            const sessionIds = sessionsData?.map(s => s.id) || [];
            if (sessionIds.length > 0) {
                const { data: answersData, error: answersError } = await this.supabase
                    .from('user_answers')
                    .select('id')
                    .in('practice_session_id', sessionIds);
                    
                if (!answersError) supabaseCounts.user_answers = answersData?.length || 0;
                else supabaseCounts.user_answers = 0;
            } else {
                supabaseCounts.user_answers = 0;
            }
        } catch (error) {
            console.warn('⚠️ Failed to connect to Supabase for counts:', error.message);
            // Default to 0 for all tables
            for (const table of Object.keys(sqliteCounts)) {
                supabaseCounts[table] = 0;
            }
        }

        return {
            sqlite: sqliteCounts,
            supabase: supabaseCounts
        };
    }

    /**
     * Ensure user profile exists in Supabase
     */
    async ensureUserProfile(userId, userEmail) {
        try {
            // Check if profile exists
            const { data: existingProfile, error: checkError } = await this.supabase
                .from('user_profiles')
                .select('id')
                .eq('id', userId)
                .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows

            if (checkError) {
                console.warn('⚠️ Error checking user profile:', checkError.message);
                return; // Skip profile creation if check fails
            }

            if (!existingProfile) {
                // Create profile using service role (bypasses RLS)
                const { error: insertError } = await this.supabase
                    .from('user_profiles')
                    .insert({
                        id: userId,
                        email: userEmail,
                        subscription_tier: 'free',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (insertError) {
                    console.warn('⚠️ Failed to create user profile:', insertError.message);
                    return; // Don't throw - profile creation is not critical for sync
                }
                console.log('✅ User profile created in Supabase');
            } else {
                console.log('✅ User profile exists in Supabase');
            }
        } catch (error) {
            console.warn('⚠️ User profile operation failed:', error.message);
            // Don't throw - profile creation is not critical for data sync
        }
    }

    /**
     * Quick sync check - just compare counts without full sync
     */
    async checkSyncStatus(userId) {
        try {
            await this.init();
            const { sqlite: sqliteCounts, supabase: supabaseCounts } = await this.getDataCounts(userId);
            
            const differences = {};
            let needsSync = false;

            for (const table of ['topics', 'notes', 'questions', 'practice_sessions']) {
                const sqliteCount = sqliteCounts[table] || 0;
                const supabaseCount = supabaseCounts[table] || 0;
                
                if (sqliteCount !== supabaseCount) {
                    differences[table] = {
                        sqlite: sqliteCount,
                        supabase: supabaseCount,
                        difference: Math.abs(sqliteCount - supabaseCount)
                    };
                    needsSync = true;
                }
            }

            return {
                needsSync,
                differences,
                totalSqlite: Object.values(sqliteCounts).reduce((a, b) => a + b, 0),
                totalSupabase: Object.values(supabaseCounts).reduce((a, b) => a + b, 0)
            };
        } catch (error) {
            console.error('❌ Sync status check failed:', error.message);
            return {
                needsSync: true, // Assume sync needed if check fails
                error: error.message
            };
        }
    }

    /**
     * Merge data from Supabase, avoiding duplicates
     */
    async mergeFromCloud(table, userId) {
        try {
            // Get existing SQLite IDs to avoid duplicates
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');
            const dbPath = path.join(__dirname, '../../data/study_ai_simplified.db');
            const db = new sqlite3.Database(dbPath);

            const existingIds = await new Promise((resolve, reject) => {
                const query = table === 'topics' ? 
                    `SELECT id FROM ${table} WHERE user_id = ?` :
                    table === 'notes' ?
                    `SELECT n.id FROM notes n JOIN topics t ON n.topic_id = t.id WHERE t.user_id = ?` :
                    table === 'questions' ?
                    `SELECT q.id FROM questions q JOIN topics t ON q.topic_id = t.id WHERE t.user_id = ?` :
                    `SELECT id FROM ${table} WHERE user_id = ?`;
                
                db.all(query, [userId], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => row.id));
                });
            });

            db.close();

            // Get cloud data with proper user filtering and excluding already-synced records
            let query = this.supabase.from(table).select('*');
            
            // Add user filtering
            if (table === 'topics' || table === 'practice_sessions') {
                query = query.eq('user_id', userId);
            } else if (table === 'notes' || table === 'questions') {
                // Get user's topic IDs for filtering
                const { data: userTopics, error: topicsError } = await this.supabase
                    .from('topics')
                    .select('id')
                    .eq('user_id', userId);
                    
                if (topicsError) throw topicsError;
                const topicIds = userTopics?.map(t => t.id) || [];
                if (topicIds.length === 0) return 0;
                
                query = query.in('topic_id', topicIds);
            } else if (table === 'user_answers') {
                // Get user's session IDs for filtering
                const { data: userSessions, error: sessionsError } = await this.supabase
                    .from('practice_sessions')
                    .select('id')
                    .eq('user_id', userId);
                    
                if (sessionsError) throw sessionsError;
                const sessionIds = userSessions?.map(s => s.id) || [];
                if (sessionIds.length === 0) return 0;
                
                query = query.in('practice_session_id', sessionIds);
            }
            
            // Exclude already-synced records
            if (existingIds.length > 0) {
                query = query.not('id', 'in', `(${existingIds.map(id => `"${id}"`).join(',')})`);
            }
            
            const { data: cloudRecords, error } = await query.order('created_at', { ascending: true });

            if (error) throw error;
            
            if (!cloudRecords || cloudRecords.length === 0) {
                console.log(`   No new records to merge from ${table}`);
                return 0;
            }

            // Use existing sync service to insert new records
            const result = await this.syncService.syncTableFromCloud(table, userId);
            console.log(`   ✅ Merged ${cloudRecords.length} new records from ${table}`);
            
            return result;
        } catch (error) {
            console.error(`❌ Merge from cloud failed for ${table}:`, error.message);
            return 0;
        }
    }

    /**
     * Merge data to Supabase, avoiding duplicates
     */
    async mergeToCloud(table, userId) {
        try {
            // Get existing Supabase IDs with user filtering
            let query = this.supabase.from(table).select('id');
            
            // Add user filtering
            if (table === 'topics' || table === 'practice_sessions') {
                query = query.eq('user_id', userId);
            } else if (table === 'notes' || table === 'questions') {
                // Get user's topic IDs for filtering
                const { data: userTopics, error: topicsError } = await this.supabase
                    .from('topics')
                    .select('id')
                    .eq('user_id', userId);
                    
                if (topicsError) throw topicsError;
                const topicIds = userTopics?.map(t => t.id) || [];
                if (topicIds.length === 0) return 0;
                
                query = query.in('topic_id', topicIds);
            } else if (table === 'user_answers') {
                // Get user's session IDs for filtering
                const { data: userSessions, error: sessionsError } = await this.supabase
                    .from('practice_sessions')
                    .select('id')
                    .eq('user_id', userId);
                    
                if (sessionsError) throw sessionsError;
                const sessionIds = userSessions?.map(s => s.id) || [];
                if (sessionIds.length === 0) return 0;
                
                query = query.in('practice_session_id', sessionIds);
            }
            
            const { data: existingRecords, error: fetchError } = await query.order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            const existingIds = existingRecords ? existingRecords.map(record => record.id) : [];

            // Get SQLite records that aren't in Supabase
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');
            const dbPath = path.join(__dirname, '../../data/study_ai_simplified.db');
            const db = new sqlite3.Database(dbPath);

            const localRecords = await new Promise((resolve, reject) => {
                const query = table === 'topics' ? 
                    `SELECT * FROM ${table} WHERE user_id = ? AND id NOT IN (${existingIds.map(() => '?').join(',') || 'NULL'})` :
                    table === 'notes' ?
                    `SELECT n.* FROM notes n JOIN topics t ON n.topic_id = t.id WHERE t.user_id = ? AND n.id NOT IN (${existingIds.map(() => '?').join(',') || 'NULL'})` :
                    table === 'questions' ?
                    `SELECT q.* FROM questions q JOIN topics t ON q.topic_id = t.id WHERE t.user_id = ? AND q.id NOT IN (${existingIds.map(() => '?').join(',') || 'NULL'})` :
                    `SELECT * FROM ${table} WHERE user_id = ? AND id NOT IN (${existingIds.map(() => '?').join(',') || 'NULL'})`;
                
                const params = [userId, ...existingIds];
                
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            db.close();

            if (localRecords.length === 0) {
                console.log(`   No new records to push to ${table}`);
                return 0;
            }

            // Insert new records to Supabase
            const { error: insertError } = await this.supabase
                .from(table)
                .insert(localRecords);

            if (insertError) throw insertError;

            console.log(`   ✅ Pushed ${localRecords.length} new records to ${table}`);
            return localRecords.length;
        } catch (error) {
            console.error(`❌ Merge to cloud failed for ${table}:`, error.message);
            return 0;
        }
    }

    /**
     * Check timestamps and sync newer records
     */
    async checkAndSyncTimestamps(table, userId) {
        try {
            console.log(`   🕐 Checking timestamp differences for ${table}...`);
            
            // For now, just do a simple check - this could be enhanced
            // to compare actual timestamps and sync only newer records
            
            // Get last modified times from both sides
            const sqlite3 = require('sqlite3').verbose();
            const path = require('path');
            const dbPath = path.join(__dirname, '../../data/study_ai_simplified.db');
            const db = new sqlite3.Database(dbPath);

            const sqliteLatest = await new Promise((resolve, reject) => {
                const query = table === 'topics' ?
                    `SELECT MAX(created_at) as latest FROM ${table} WHERE user_id = ?` :
                    table === 'notes' ?
                    `SELECT MAX(n.created_at) as latest FROM notes n JOIN topics t ON n.topic_id = t.id WHERE t.user_id = ?` :
                    table === 'questions' ?
                    `SELECT MAX(q.created_at) as latest FROM questions q JOIN topics t ON q.topic_id = t.id WHERE t.user_id = ?` :
                    `SELECT MAX(created_at) as latest FROM ${table} WHERE user_id = ?`;
                
                db.get(query, [userId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.latest || null);
                });
            });

            db.close();

            const { data: supabaseLatest, error } = await this.supabase
                .from(table)
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            const supabaseTime = supabaseLatest?.[0]?.created_at || null;
            
            // Simple comparison - if timestamps are different, trigger a light sync
            if (sqliteLatest && supabaseTime) {
                const sqliteDate = new Date(sqliteLatest);
                const supabaseDate = new Date(supabaseTime);
                
                if (Math.abs(sqliteDate.getTime() - supabaseDate.getTime()) > 60000) { // 1 minute difference
                    console.log(`   ⏰ Timestamp difference detected in ${table}, syncing...`);
                    
                    const pullResult = await this.mergeFromCloud(table, userId);
                    const pushResult = await this.mergeToCloud(table, userId);
                    
                    return {
                        pulled: pullResult,
                        pushed: pushResult,
                        total: pullResult + pushResult
                    };
                }
            }
            
            console.log(`   ✅ ${table} timestamps are in sync`);
            return { pulled: 0, pushed: 0, total: 0 };
        } catch (error) {
            console.error(`❌ Timestamp check failed for ${table}:`, error.message);
            return { pulled: 0, pushed: 0, total: 0 };
        }
    }
}

// Singleton instance
let autoSyncInstance = null;

function getAutoSyncService() {
    if (!autoSyncInstance) {
        autoSyncInstance = new AutoSyncService();
    }
    return autoSyncInstance;
}

module.exports = {
    AutoSyncService,
    getAutoSyncService
};