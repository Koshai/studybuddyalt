// Enhanced Sync Service for Jaquizy
// Builds on existing hybrid-storage-service.js with full sync capabilities

const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();

class EnhancedSyncService {
    constructor() {
        // Use service role key for server-side operations that bypass RLS
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
        );
        
        // Use existing database path with sqlite3
        const path = require('path');
        const dbPath = path.join(__dirname, '../data/study_ai_simplified.db');
        this.db = new sqlite3.Database(dbPath);
        
        // Tables that need syncing (in dependency order)
        this.syncTables = [
            'topics',
            'notes', 
            'questions',
            'practice_sessions',
            'user_answers',
            'usage_tracking'
        ];
    }

    /**
     * Full sync: Pull all user data from Supabase to SQLite
     * Call this on user login
     */
    async fullSyncFromCloud(userId) {
        console.log(`🔄 Starting full sync for user ${userId}`);
        
        try {
            let syncedCount = 0;
            
            for (const tableName of this.syncTables) {
                const count = await this.syncTableFromCloud(tableName, userId);
                syncedCount += count;
                console.log(`   ✅ ${tableName}: ${count} records`);
            }
            
            console.log(`🎉 Full sync complete: ${syncedCount} total records synced`);
            return { success: true, recordsSynced: syncedCount };
            
        } catch (error) {
            console.error('❌ Full sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Push local changes to Supabase
     * Call this on logout or periodically
     */
    async pushLocalChangesToCloud(userId) {
        console.log(`⬆️ Pushing local changes for user ${userId}`);
        
        try {
            let pushedCount = 0;
            
            for (const tableName of this.syncTables) {
                const count = await this.pushTableToCloud(tableName, userId);
                pushedCount += count;
                if (count > 0) {
                    console.log(`   ⬆️ ${tableName}: ${count} records pushed`);
                }
            }
            
            console.log(`✅ Push complete: ${pushedCount} total records pushed`);
            return { success: true, recordsPushed: pushedCount };
            
        } catch (error) {
            console.error('❌ Push failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sync a specific table from Supabase to SQLite
     */
    async syncTableFromCloud(tableName, userId) {
        // Get records for this user from Supabase with proper filtering
        let query = this.supabase.from(tableName).select('*');
        
        // Add user filtering based on table structure
        if (tableName === 'topics' || tableName === 'practice_sessions') {
            // These tables have direct user_id column
            query = query.eq('user_id', userId);
        } else if (tableName === 'notes' || tableName === 'questions') {
            // These tables are related through topics - need to get user's topic IDs first
            const { data: userTopics, error: topicsError } = await this.supabase
                .from('topics')
                .select('id')
                .eq('user_id', userId);
                
            if (topicsError) throw topicsError;
            
            const topicIds = userTopics?.map(t => t.id) || [];
            if (topicIds.length === 0) {
                return 0; // No topics = no notes/questions
            }
            
            query = query.in('topic_id', topicIds);
        } else if (tableName === 'user_answers') {
            // Related through practice_sessions
            const { data: userSessions, error: sessionsError } = await this.supabase
                .from('practice_sessions')
                .select('id')
                .eq('user_id', userId);
                
            if (sessionsError) throw sessionsError;
            
            const sessionIds = userSessions?.map(s => s.id) || [];
            if (sessionIds.length === 0) {
                return 0; // No sessions = no answers
            }
            
            query = query.in('practice_session_id', sessionIds);
        }
        
        const { data: cloudRecords, error } = await query.order('created_at', { ascending: true });

        if (error) throw error;
        if (!cloudRecords || cloudRecords.length === 0) return 0;

        // Get SQLite table schema to determine which columns actually exist
        const tableInfo = await this.getSQLiteTableSchema(tableName);
        const sqliteColumns = tableInfo.map(col => col.name);
        
        // Filter Supabase columns to only include ones that exist in SQLite
        const availableColumns = Object.keys(cloudRecords[0]).filter(col => sqliteColumns.includes(col));
        
        if (availableColumns.length === 0) {
            console.warn(`⚠️ No matching columns found for table ${tableName}`);
            return 0;
        }
        
        const placeholders = availableColumns.map(() => '?').join(',');
        const columnsList = availableColumns.join(',');
        
        console.log(`   📋 Syncing columns for ${tableName}: ${availableColumns.join(', ')}`);
        
        const insertSql = `INSERT OR REPLACE INTO ${tableName} (${columnsList}) VALUES (${placeholders})`;
        const updateSyncSql = `UPDATE ${tableName} SET last_synced = ? WHERE id = ?`;

        // Insert records one by one (sqlite3 doesn't have transactions like better-sqlite3)
        let insertedCount = 0;
        for (const record of cloudRecords) {
            try {
                const values = availableColumns.map(col => record[col]);
                await new Promise((resolve, reject) => {
                    this.db.run(insertSql, values, function(err) {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                
                // Only update last_synced if the column exists
                if (sqliteColumns.includes('last_synced')) {
                    await new Promise((resolve, reject) => {
                        this.db.run(updateSyncSql, [new Date().toISOString(), record.id], function(err) {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
                insertedCount++;
            } catch (error) {
                console.warn(`⚠️ Failed to insert record ${record.id}:`, error.message);
            }
        }

        return insertedCount;
    }

    /**
     * Get SQLite table schema information
     */
    async getSQLiteTableSchema(tableName) {
        return new Promise((resolve, reject) => {
            this.db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Push local table changes to Supabase
     */
    async pushTableToCloud(tableName, userId) {
        // Get unsynced local records
        const unsyncedRecords = this.db.prepare(`
            SELECT * FROM ${tableName} 
            WHERE last_synced IS NULL 
               OR updated_at > last_synced
               OR last_synced < datetime('now', '-1 hour')
            ORDER BY created_at
        `).all();

        if (unsyncedRecords.length === 0) return 0;

        // Convert SQLite data to Supabase format
        const recordsToSync = unsyncedRecords.map(record => {
            const cleanRecord = { ...record };
            delete cleanRecord.last_synced; // Don't sync this field
            
            // Convert SQLite datetime to PostgreSQL timestamp
            if (cleanRecord.created_at) {
                cleanRecord.created_at = new Date(cleanRecord.created_at).toISOString();
            }
            if (cleanRecord.updated_at) {
                cleanRecord.updated_at = new Date(cleanRecord.updated_at).toISOString();
            }
            
            return cleanRecord;
        });

        // Upsert to Supabase
        const { error } = await this.supabase
            .from(tableName)
            .upsert(recordsToSync, { 
                onConflict: 'id',
                ignoreDuplicates: false 
            });

        if (error) throw error;

        // Mark as synced in SQLite
        const updateSyncStmt = this.db.prepare(`
            UPDATE ${tableName} SET last_synced = ? WHERE id = ?
        `);
        
        const now = new Date().toISOString();
        const markSynced = this.db.transaction(() => {
            for (const record of unsyncedRecords) {
                updateSyncStmt.run(now, record.id);
            }
        });
        
        markSynced();
        return recordsToSync.length;
    }

    /**
     * Create user profile in Supabase if it doesn't exist
     */
    async ensureUserProfile(userData) {
        try {
            const { data: existingProfile } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('email', userData.email)
                .single();

            if (!existingProfile) {
                console.log('📝 Creating user profile in Supabase');
                
                const { data: newProfile, error } = await this.supabase
                    .from('user_profiles')
                    .insert({
                        id: userData.id,
                        email: userData.email,
                        full_name: userData.fullName || userData.firstName,
                        subscription_tier: userData.subscriptionTier || 'free'
                    })
                    .select()
                    .single();

                if (error) throw error;
                return newProfile;
            }
            
            return existingProfile;
        } catch (error) {
            console.error('❌ Error ensuring user profile:', error);
            throw error;
        }
    }

    /**
     * Sync usage data (critical for billing)
     */
    async syncUsageData(userId) {
        console.log('📊 Syncing usage data...');
        
        try {
            // Get local usage data
            const localUsage = this.db.prepare(`
                SELECT * FROM user_usage WHERE user_id = ?
            `).all(userId);

            if (localUsage.length === 0) return { success: true, message: 'No usage data to sync' };

            // Convert to Supabase format and upsert
            const usageRecords = localUsage.map(record => ({
                id: record.id,
                user_id: userId,
                month_year: record.month_year,
                questions_used: record.questions_used || 0,
                storage_used: record.storage_used || 0,
                topics_created: record.topics_created || 0,
                created_at: new Date(record.created_at).toISOString(),
                updated_at: new Date(record.updated_at || record.created_at).toISOString()
            }));

            const { error } = await this.supabase
                .from('usage_tracking')
                .upsert(usageRecords, { onConflict: 'user_id,month_year' });

            if (error) throw error;

            console.log(`✅ Synced ${usageRecords.length} usage records`);
            return { success: true, recordsSynced: usageRecords.length };
            
        } catch (error) {
            console.error('❌ Usage sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get sync status for user
     */
    async getSyncStatus(userId) {
        try {
            const { data, error } = await this.supabase
                .from('user_sync_status')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // Ignore "not found"

            return {
                lastSync: data?.topics_last_sync || null,
                totalTopics: data?.total_topics || 0,
                totalNotes: data?.total_notes || 0,
                totalQuestions: data?.total_questions || 0,
                needsSync: !data?.topics_last_sync || 
                          new Date() - new Date(data.topics_last_sync) > 10 * 60 * 1000 // 10 minutes
            };
        } catch (error) {
            console.error('❌ Error getting sync status:', error);
            return { needsSync: true, error: error.message };
        }
    }

    /**
     * Background sync (called periodically)
     */
    async backgroundSync(userId) {
        console.log('🔄 Background sync starting...');
        
        try {
            // Light sync - only push recent changes
            const result = await this.pushLocalChangesToCloud(userId);
            
            if (result.success) {
                console.log(`✅ Background sync: ${result.recordsPushed} records pushed`);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Background sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Emergency sync - for critical data
     */
    async emergencySync(userId, tableName = null) {
        console.log(`🚨 Emergency sync for user ${userId}`, tableName ? `(${tableName} only)` : '');
        
        const tablesToSync = tableName ? [tableName] : this.syncTables;
        
        try {
            for (const table of tablesToSync) {
                await this.pushTableToCloud(table, userId);
                console.log(`   🚨 Emergency sync: ${table} completed`);
            }
            
            return { success: true, message: 'Emergency sync completed' };
        } catch (error) {
            console.error('❌ Emergency sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Export singleton
let syncService = null;

function getSyncService() {
    if (!syncService) {
        syncService = new EnhancedSyncService();
    }
    return syncService;
}

module.exports = {
    EnhancedSyncService,
    getSyncService
};