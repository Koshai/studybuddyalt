// src/server/services/account-sync-service.js - Sync user accounts between online and offline modes
const LocalUserService = require('./local-user-service');
const AuthService = require('./auth-service');
const SimplifiedDatabaseService = require('./database-simplified');
const path = require('path');
const fs = require('fs').promises;

class AccountSyncService {
    constructor() {
        this.localUserService = new LocalUserService();
        this.authService = new AuthService();
        this.syncInProgress = false;
        this.syncLog = [];
    }

    /**
     * Initialize sync service
     */
    async initialize() {
        await this.localUserService.initialize();
        console.log('🔄 Account sync service initialized');
    }

    /**
     * Sync cloud user to local (when going offline)
     */
    async syncCloudUserToLocal(cloudUserId, cloudUserData) {
        try {
            this.syncInProgress = true;
            console.log(`🔄 Syncing cloud user to local: ${cloudUserData.email}`);

            // Check if local user already exists
            const existingUsers = await this.localUserService.listLocalUsers();
            let localUser = existingUsers.find(u => u.syncSettings?.cloudUserId === cloudUserId);

            if (!localUser) {
                // Create new local user linked to cloud account
                console.log('📥 Creating new local user for cloud account');
                
                const result = await this.localUserService.createLocalUser(
                    cloudUserData.email,
                    cloudUserData.firstName || 'User',
                    cloudUserData.lastName || '',
                    this.generateTempPassword() // Temporary password - will be updated
                );

                if (!result.success) {
                    throw new Error(result.error);
                }

                localUser = result.userProfile;
                
                // Link to cloud account
                localUser.syncSettings = {
                    cloudEnabled: true,
                    cloudUserId: cloudUserId,
                    lastSync: new Date().toISOString(),
                    syncMode: 'bidirectional'
                };

                await this.localUserService.saveUserProfile(localUser);
            }

            // Sync cloud data to local database
            await this.syncCloudDataToLocal(cloudUserId, localUser.id);

            this.addSyncLog('success', `Cloud user ${cloudUserData.email} synced to local`);
            console.log(`✅ Cloud user synced to local: ${localUser.id}`);

            return {
                success: true,
                localUserId: localUser.id,
                message: 'User synced successfully'
            };

        } catch (error) {
            this.addSyncLog('error', `Failed to sync cloud user: ${error.message}`);
            console.error('❌ Failed to sync cloud user to local:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync local user to cloud (when going online)
     */
    async syncLocalUserToCloud(localUserId) {
        try {
            this.syncInProgress = true;
            console.log(`🔄 Syncing local user to cloud: ${localUserId}`);

            // Get local user data
            const users = await this.localUserService.listLocalUsers();
            const localUser = users.find(u => u.id === localUserId);

            if (!localUser) {
                throw new Error('Local user not found');
            }

            let cloudUserId = localUser.syncSettings?.cloudUserId;

            if (!cloudUserId) {
                // Create new cloud account
                console.log('📤 Creating new cloud account for local user');
                
                const cloudResult = await this.authService.register({
                    email: localUser.email,
                    password: this.generateTempPassword(),
                    firstName: localUser.firstName,
                    lastName: localUser.lastName,
                    username: localUser.email.split('@')[0] + '_' + Date.now()
                });

                cloudUserId = cloudResult.user.id;

                // Update local user with cloud link
                localUser.syncSettings = {
                    cloudEnabled: true,
                    cloudUserId: cloudUserId,
                    lastSync: new Date().toISOString(),
                    syncMode: 'bidirectional'
                };

                await this.localUserService.saveUserProfile(localUser);
            }

            // Sync local data to cloud
            await this.syncLocalDataToCloud(localUserId, cloudUserId);

            this.addSyncLog('success', `Local user ${localUser.email} synced to cloud`);
            console.log(`✅ Local user synced to cloud: ${cloudUserId}`);

            return {
                success: true,
                cloudUserId: cloudUserId,
                message: 'User synced successfully'
            };

        } catch (error) {
            this.addSyncLog('error', `Failed to sync local user: ${error.message}`);
            console.error('❌ Failed to sync local user to cloud:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync cloud data to local database
     */
    async syncCloudDataToLocal(cloudUserId, localUserId) {
        try {
            console.log('📥 Syncing cloud data to local database...');

            // Get local user database
            const localDb = await this.localUserService.getUserDatabase(localUserId);

            // Fetch cloud data from Supabase
            const cloudData = await this.fetchCloudUserData(cloudUserId);

            // Sync topics
            for (const topic of cloudData.topics) {
                await localDb.insertOrUpdateTopic({
                    ...topic,
                    user_id: localUserId, // Map to local user
                    synced_at: new Date().toISOString()
                });
            }

            // Sync questions
            for (const question of cloudData.questions) {
                await localDb.insertOrUpdateQuestion({
                    ...question,
                    user_id: localUserId,
                    synced_at: new Date().toISOString()
                });
            }

            // Sync notes
            for (const note of cloudData.notes) {
                await localDb.insertOrUpdateNote({
                    ...note,
                    user_id: localUserId,
                    synced_at: new Date().toISOString()
                });
            }

            console.log(`✅ Synced ${cloudData.topics.length} topics, ${cloudData.questions.length} questions, ${cloudData.notes.length} notes`);

        } catch (error) {
            console.error('❌ Failed to sync cloud data to local:', error);
            throw error;
        }
    }

    /**
     * Sync local data to cloud database
     */
    async syncLocalDataToCloud(localUserId, cloudUserId) {
        try {
            console.log('📤 Syncing local data to cloud database...');

            // Get local user database
            const localDb = await this.localUserService.getUserDatabase(localUserId);

            // Get local data
            const topics = await localDb.getTopics();
            const questions = await localDb.getAllQuestions();
            const notes = await localDb.getNotes();

            // Upload to cloud (Supabase)
            await this.uploadLocalDataToCloud(cloudUserId, {
                topics,
                questions,
                notes
            });

            console.log(`✅ Synced ${topics.length} topics, ${questions.length} questions, ${notes.length} notes to cloud`);

        } catch (error) {
            console.error('❌ Failed to sync local data to cloud:', error);
            throw error;
        }
    }

    /**
     * Fetch user data from cloud (Supabase)
     */
    async fetchCloudUserData(cloudUserId) {
        try {
            // Fetch topics
            const { data: topics, error: topicsError } = await this.authService.supabase
                .from('topics')
                .select('*')
                .eq('user_id', cloudUserId);

            if (topicsError) throw topicsError;

            // Fetch questions
            const { data: questions, error: questionsError } = await this.authService.supabase
                .from('questions')
                .select('*')
                .eq('user_id', cloudUserId);

            if (questionsError) throw questionsError;

            // Fetch notes
            const { data: notes, error: notesError } = await this.authService.supabase
                .from('notes')
                .select('*')
                .eq('user_id', cloudUserId);

            if (notesError) throw notesError;

            return {
                topics: topics || [],
                questions: questions || [],
                notes: notes || []
            };

        } catch (error) {
            console.error('❌ Failed to fetch cloud user data:', error);
            throw error;
        }
    }

    /**
     * Upload local data to cloud (Supabase)
     */
    async uploadLocalDataToCloud(cloudUserId, localData) {
        try {
            // Upload topics
            if (localData.topics.length > 0) {
                const topicsToUpload = localData.topics.map(topic => ({
                    ...topic,
                    user_id: cloudUserId // Map to cloud user
                }));

                const { error: topicsError } = await this.authService.supabase
                    .from('topics')
                    .upsert(topicsToUpload);

                if (topicsError) throw topicsError;
            }

            // Upload questions
            if (localData.questions.length > 0) {
                const questionsToUpload = localData.questions.map(question => ({
                    ...question,
                    user_id: cloudUserId
                }));

                const { error: questionsError } = await this.authService.supabase
                    .from('questions')
                    .upsert(questionsToUpload);

                if (questionsError) throw questionsError;
            }

            // Upload notes
            if (localData.notes.length > 0) {
                const notesToUpload = localData.notes.map(note => ({
                    ...note,
                    user_id: cloudUserId
                }));

                const { error: notesError } = await this.authService.supabase
                    .from('notes')
                    .upsert(notesToUpload);

                if (notesError) throw notesError;
            }

        } catch (error) {
            console.error('❌ Failed to upload local data to cloud:', error);
            throw error;
        }
    }

    /**
     * Check for existing account links
     */
    async findAccountLinks(email) {
        try {
            // Check for cloud account
            const { data: cloudUser, error } = await this.authService.supabase.auth.admin.getUserByEmail(email);
            
            // Check for local account
            const localUsers = await this.localUserService.listLocalUsers();
            const localUser = localUsers.find(u => u.email === email);

            return {
                hasCloudAccount: !error && cloudUser?.user,
                hasLocalAccount: !!localUser,
                cloudUserId: cloudUser?.user?.id,
                localUserId: localUser?.id,
                canSync: (!error && cloudUser?.user) || !!localUser
            };

        } catch (error) {
            console.error('❌ Failed to check account links:', error);
            return {
                hasCloudAccount: false,
                hasLocalAccount: false,
                canSync: false,
                error: error.message
            };
        }
    }

    /**
     * Auto-sync process (when switching between online/offline)
     */
    async autoSync(email, mode = 'bidirectional') {
        try {
            console.log(`🔄 Auto-sync initiated for ${email} (${mode})`);

            const accountStatus = await this.findAccountLinks(email);
            
            if (!accountStatus.canSync) {
                return {
                    success: false,
                    message: 'No accounts found to sync'
                };
            }

            let syncResult = { success: true, actions: [] };

            // Sync cloud to local (for offline use)
            if (accountStatus.hasCloudAccount && (!accountStatus.hasLocalAccount || mode === 'cloud_to_local')) {
                const cloudUserData = await this.getCloudUserProfile(accountStatus.cloudUserId);
                const result = await this.syncCloudUserToLocal(accountStatus.cloudUserId, cloudUserData);
                syncResult.actions.push(`Cloud → Local: ${result.success ? 'Success' : 'Failed'}`);
            }

            // Sync local to cloud (for cross-device access)
            if (accountStatus.hasLocalAccount && (!accountStatus.hasCloudAccount || mode === 'local_to_cloud')) {
                const result = await this.syncLocalUserToCloud(accountStatus.localUserId);
                syncResult.actions.push(`Local → Cloud: ${result.success ? 'Success' : 'Failed'}`);
            }

            // Bidirectional sync
            if (accountStatus.hasCloudAccount && accountStatus.hasLocalAccount && mode === 'bidirectional') {
                await this.bidirectionalSync(accountStatus.cloudUserId, accountStatus.localUserId);
                syncResult.actions.push('Bidirectional sync completed');
            }

            return {
                success: true,
                message: 'Auto-sync completed',
                actions: syncResult.actions
            };

        } catch (error) {
            console.error('❌ Auto-sync failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Bidirectional sync (merge data from both sources)
     */
    async bidirectionalSync(cloudUserId, localUserId) {
        // Implementation for smart merging of data
        // This would compare timestamps and merge changes intelligently
        console.log('🔄 Performing bidirectional sync...');
        
        // For now, prefer cloud data over local (can be enhanced)
        await this.syncCloudDataToLocal(cloudUserId, localUserId);
        
        // Then upload any newer local changes
        await this.syncLocalDataToCloud(localUserId, cloudUserId);
    }

    /**
     * Utility methods
     */
    generateTempPassword() {
        return require('crypto').randomBytes(16).toString('hex');
    }

    async getCloudUserProfile(cloudUserId) {
        const { data, error } = await this.authService.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', cloudUserId)
            .single();

        if (error) throw error;
        return data;
    }

    addSyncLog(type, message) {
        this.syncLog.push({
            timestamp: new Date().toISOString(),
            type,
            message
        });

        // Keep only last 100 entries
        if (this.syncLog.length > 100) {
            this.syncLog = this.syncLog.slice(-100);
        }
    }

    getSyncLog() {
        return this.syncLog;
    }

    isSyncInProgress() {
        return this.syncInProgress;
    }
}

module.exports = AccountSyncService;