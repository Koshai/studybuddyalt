// src/frontend/js/sync-client.js - Sync Client for Web (Stub for compatibility)

// Web-only version - no sync needed since everything is cloud-based
class SyncClient {
    constructor() {
        this.isWebMode = true;
        this.syncEnabled = false;
        console.log('🌐 Web Sync Client loaded (no sync needed for web-only mode)');
    }

    // Stub methods for compatibility with desktop components
    async getSyncStatus() {
        return {
            success: true,
            status: {
                enabled: false,
                lastSync: null,
                pendingChanges: 0,
                mode: 'web-only'
            }
        };
    }

    async checkOfflineStatus() {
        return {
            online: navigator.onLine,
            mode: 'web-only',
            syncRequired: false
        };
    }

    // No-op methods for web mode
    async enableSync() {
        console.log('ℹ️ Sync not available in web mode');
        return { success: false, reason: 'Web mode uses direct cloud storage' };
    }

    async disableSync() {
        return { success: true, reason: 'Already in web-only mode' };
    }

    async performSync() {
        return { success: true, reason: 'No sync needed in web mode' };
    }
}

// Create global sync client instance
window.syncClient = new SyncClient();

console.log('✅ Sync Client stub loaded for web-only mode');