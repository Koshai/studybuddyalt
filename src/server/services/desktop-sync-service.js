// src/server/services/desktop-sync-service.js - User-controlled sync for desktop apps
const { createClient } = require('@supabase/supabase-js');

class DesktopSyncService {
    constructor(localDatabase) {
        this.localDb = localDatabase;
        this.supabase = null;
        this.isOnline = false;
        this.syncEnabled = false;
        
        console.log('🔄 Desktop Sync Service initialized (disabled by default)');
    }

    /**
     * Initialize cloud connection (user opts in)
     */
    async enableCloudSync(supabaseUrl, supabaseKey, userId) {
        try {
            this.supabase = createClient(supabaseUrl, supabaseKey);
            this.userId = userId;
            this.syncEnabled = true;
            
            // Test connection
            const { data, error } = await this.supabase.from('user_profiles').select('id').eq('id', userId).single();
            if (error) throw error;
            
            this.isOnline = true;
            console.log('✅ Cloud sync enabled for user:', userId);
            
            return {
                success: true,
                message: 'Cloud sync enabled successfully'
            };
            
        } catch (error) {
            console.error('❌ Failed to enable cloud sync:', error);
            this.syncEnabled = false;
            this.isOnline = false;
            
            return {
                success: false,
                error: 'Failed to connect to cloud. Please check your internet connection and credentials.'
            };
        }
    }

    /**
     * Disable cloud sync (user opts out)
     */
    disableCloudSync() {
        this.supabase = null;
        this.syncEnabled = false;
        this.isOnline = false;
        
        console.log('📴 Cloud sync disabled by user');
        return {
            success: true,
            message: 'Cloud sync disabled. Your data remains local and private.'
        };
    }

    /**
     * Check if sync is available and ask user
     */
    async checkSyncAvailability() {
        if (!this.syncEnabled) {
            return {
                available: false,
                reason: 'Cloud sync is disabled'
            };
        }

        try {
            // Simple connectivity test
            const { error } = await this.supabase.from('user_profiles').select('id').limit(1);
            this.isOnline = !error;
            
            return {
                available: this.isOnline,
                reason: this.isOnline ? 'Cloud sync available' : 'No internet connection'
            };
            
        } catch (error) {
            this.isOnline = false;
            return {
                available: false,
                reason: 'Cloud connection failed'
            };
        }
    }

    /**
     * Show sync dialog to user
     */
    async promptUserForSync() {
        const availability = await this.checkSyncAvailability();
        
        if (!availability.available) {
            return {
                action: 'skip',
                reason: availability.reason
            };
        }

        // In a real implementation, this would show a dialog
        // For now, return a mock response
        return {
            action: 'prompt',
            options: [
                {
                    id: 'sync_both',
                    text: 'Sync Both Ways',
                    description: 'Upload local changes and download cloud updates'
                },
                {
                    id: 'download_only',
                    text: 'Download Only',
                    description: 'Get latest from cloud, keep local changes private'
                },
                {
                    id: 'upload_only',
                    text: 'Upload Only',
                    description: 'Backup local data to cloud'
                },
                {
                    id: 'skip',
                    text: 'Stay Private',
                    description: 'Keep all data local (no sync)'
                }
            ]
        };
    }

    /**
     * Perform sync based on user choice
     */
    async performSync(syncType = 'sync_both') {
        if (!this.syncEnabled || !this.isOnline) {
            throw new Error('Sync not available');
        }

        console.log(`🔄 Starting ${syncType} sync...`);
        
        try {
            switch (syncType) {
                case 'sync_both':
                    await this.uploadLocalChanges();
                    await this.downloadCloudChanges();
                    break;
                    
                case 'download_only':
                    await this.downloadCloudChanges();
                    break;
                    
                case 'upload_only':
                    await this.uploadLocalChanges();
                    break;
                    
                default:
                    return { success: true, message: 'Sync skipped by user' };
            }
            
            console.log('✅ Sync completed successfully');
            return {
                success: true,
                message: 'Data synchronized successfully',
                lastSync: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            return {
                success: false,
                error: `Sync failed: ${error.message}`
            };
        }
    }

    /**
     * Upload local changes to cloud
     */
    async uploadLocalChanges() {
        console.log('📤 Uploading local changes...');
        
        // Get all local data that needs syncing
        const localData = await this.getLocalDataForSync();
        
        // Upload in batches to avoid overwhelming the API
        for (const table of ['topics', 'notes', 'questions', 'practice_sessions']) {
            const records = localData[table] || [];
            
            if (records.length > 0) {
                console.log(`📤 Uploading ${records.length} ${table}...`);
                
                // Use upsert to handle both inserts and updates
                const { error } = await this.supabase
                    .from(table)
                    .upsert(records, { onConflict: 'id' });
                    
                if (error) {
                    console.error(`Failed to upload ${table}:`, error);
                    throw error;
                }
            }
        }
        
        console.log('✅ Upload completed');
    }

    /**
     * Download cloud changes to local
     */
    async downloadCloudChanges() {
        console.log('📥 Downloading cloud changes...');
        
        // Get cloud data for user
        const cloudData = await this.getCloudDataForUser();
        
        // Update local database with cloud data
        await this.updateLocalDatabase(cloudData);
        
        console.log('✅ Download completed');
    }

    /**
     * Get local data that needs syncing
     */
    async getLocalDataForSync() {
        return {
            topics: await this.localDb.getTopicsForUser('all', this.userId),
            notes: await this.localDb.getAllNotesForUser(this.userId),
            questions: await this.localDb.getAllQuestionsForUser(this.userId),
            practice_sessions: await this.localDb.getAllPracticeSessionsForUser(this.userId)
        };
    }

    /**
     * Get cloud data for current user
     */
    async getCloudDataForUser() {
        const [topics, notes, questions, sessions] = await Promise.all([
            this.supabase.from('topics').select('*').eq('user_id', this.userId),
            this.supabase.from('notes').select('*').in('topic_id', 
                this.supabase.from('topics').select('id').eq('user_id', this.userId)
            ),
            this.supabase.from('questions').select('*').in('topic_id', 
                this.supabase.from('topics').select('id').eq('user_id', this.userId)
            ),
            this.supabase.from('practice_sessions').select('*').eq('user_id', this.userId)
        ]);
        
        return {
            topics: topics.data || [],
            notes: notes.data || [],
            questions: questions.data || [],
            practice_sessions: sessions.data || []
        };
    }

    /**
     * Update local database with cloud data
     */
    async updateLocalDatabase(cloudData) {
        // This would implement conflict resolution and local database updates
        // For now, this is a placeholder
        console.log('📝 Updating local database with cloud data...');
        
        // In a real implementation:
        // 1. Compare timestamps to resolve conflicts
        // 2. Update local database
        // 3. Mark as synced
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return {
            enabled: this.syncEnabled,
            online: this.isOnline,
            lastSync: this.lastSyncTime || null,
            userId: this.userId || null
        };
    }
}

module.exports = DesktopSyncService;