// sync-client.js - Frontend sync utilities
window.SyncClient = {
    
    /**
     * Get sync status from server
     */
    async getSyncStatus() {
        try {
            const response = await fetch('/api/sync/status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Failed to get sync status:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Manually trigger full sync from cloud
     */
    async pullFromCloud() {
        try {
            console.log('🔄 Pulling data from cloud...');
            
            const response = await fetch('/api/sync/pull', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Sync complete:', result.message);
                
                // Refresh the current view to show synced data
                if (window.store && window.store.refreshCurrentView) {
                    window.store.refreshCurrentView();
                }
                
                // Show success notification
                if (window.store && window.store.showNotification) {
                    window.store.showNotification(
                        `Synced ${result.recordsSynced} records from cloud`, 
                        'success'
                    );
                }
            } else {
                throw new Error(result.error);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Failed to pull from cloud:', error);
            
            if (window.store && window.store.showNotification) {
                window.store.showNotification(
                    'Sync failed: ' + error.message, 
                    'error'
                );
            }
            
            return { success: false, error: error.message };
        }
    },

    /**
     * Push local changes to cloud
     */
    async pushToCloud() {
        try {
            console.log('⬆️ Pushing local changes to cloud...');
            
            const response = await fetch('/api/sync/push', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Push complete:', result.message);
                
                // Show success notification if records were pushed
                if (result.recordsPushed > 0 && window.store && window.store.showNotification) {
                    window.store.showNotification(
                        `Backed up ${result.recordsPushed} records to cloud`, 
                        'success'
                    );
                }
            } else {
                throw new Error(result.error);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Failed to push to cloud:', error);
            
            if (window.store && window.store.showNotification) {
                window.store.showNotification(
                    'Backup failed: ' + error.message, 
                    'error'
                );
            }
            
            return { success: false, error: error.message };
        }
    },

    /**
     * Background sync (lightweight)
     */
    async backgroundSync() {
        try {
            const response = await fetch('/api/sync/background', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success && result.recordsPushed > 0) {
                console.log(`🔄 Background sync: ${result.recordsPushed} records backed up`);
            }
            
            return result;
        } catch (error) {
            console.warn('⚠️ Background sync failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Emergency sync for critical situations
     */
    async emergencySync(tableName = null) {
        try {
            console.log('🚨 Emergency sync triggered', tableName ? `for ${tableName}` : '');
            
            const response = await fetch('/api/sync/emergency', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tableName })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Emergency sync complete');
                
                if (window.store && window.store.showNotification) {
                    window.store.showNotification(
                        'Emergency backup completed', 
                        'success'
                    );
                }
            } else {
                throw new Error(result.error);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Emergency sync failed:', error);
            
            if (window.store && window.store.showNotification) {
                window.store.showNotification(
                    'Emergency backup failed: ' + error.message, 
                    'error'
                );
            }
            
            return { success: false, error: error.message };
        }
    },

    /**
     * Start periodic background sync
     */
    startPeriodicSync() {
        // Only sync if user is authenticated and online
        const syncInterval = 5 * 60 * 1000; // 5 minutes
        
        const doPeriodicSync = async () => {
            if (window.store && window.store.state.isAuthenticated && navigator.onLine) {
                await this.backgroundSync();
            }
        };
        
        // Initial sync after 30 seconds
        setTimeout(doPeriodicSync, 30000);
        
        // Then every 5 minutes
        setInterval(doPeriodicSync, syncInterval);
        
        console.log('🔄 Periodic sync started (every 5 minutes)');
    },

    /**
     * Sync on app events
     */
    setupEventSyncing() {
        // Sync before page unload (user leaving/closing app)
        window.addEventListener('beforeunload', () => {
            // Use sendBeacon for reliability during page unload
            if (navigator.sendBeacon && window.store && window.store.state.isAuthenticated) {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    navigator.sendBeacon('/api/sync/background', JSON.stringify({
                        headers: { 'Authorization': `Bearer ${token}` }
                    }));
                }
            }
        });

        // Sync when coming back online
        window.addEventListener('online', async () => {
            console.log('🌐 Connection restored - syncing...');
            await this.backgroundSync();
        });

        // Sync on focus (when user returns to tab)
        let lastFocusSync = Date.now();
        window.addEventListener('focus', async () => {
            const now = Date.now();
            // Only sync if it's been more than 2 minutes since last focus sync
            if (now - lastFocusSync > 2 * 60 * 1000) {
                lastFocusSync = now;
                await this.backgroundSync();
            }
        });

        console.log('✅ Event-based syncing enabled');
    },

    /**
     * Show sync status to user
     */
    async showSyncStatus() {
        const status = await this.getSyncStatus();
        
        if (status.success) {
            const message = status.status.needsSync 
                ? 'Your data needs syncing with the cloud'
                : 'Your data is up to date';
            
            if (window.store && window.store.showNotification) {
                window.store.showNotification(message, status.status.needsSync ? 'warning' : 'success');
            }
            
            return status.status;
        } else {
            if (window.store && window.store.showNotification) {
                window.store.showNotification('Could not check sync status', 'error');
            }
            
            return null;
        }
    },

    /**
     * Initialize sync client
     */
    init() {
        console.log('🔄 Initializing sync client...');
        
        // Start periodic sync
        this.startPeriodicSync();
        
        // Setup event-based syncing
        this.setupEventSyncing();
        
        console.log('✅ Sync client initialized');
    }
};

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to let other systems initialize first
    setTimeout(() => {
        window.SyncClient.init();
    }, 2000);
});