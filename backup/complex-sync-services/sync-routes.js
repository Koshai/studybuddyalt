// Sync Routes - API endpoints for database synchronization
const express = require('express');
const { getSyncService } = require('../services/enhanced-sync-service');
const authMiddleware = require('../middleware/auth-middleware');

const router = express.Router();

/**
 * GET /api/sync/status
 * Get sync status for authenticated user
 */
router.get('/status', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { getAutoSyncService } = require('../services/auto-sync-service');
        const autoSyncService = getAutoSyncService();
        
        const status = await autoSyncService.checkSyncStatus(req.user.id);
        
        res.json({
            success: true,
            status: {
                ...status,
                userId: req.user.id,
                userEmail: req.user.email,
                lastChecked: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Sync status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get sync status'
        });
    }
});

/**
 * POST /api/sync/auto
 * Trigger intelligent auto-sync manually
 */
router.post('/auto', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { getAutoSyncService } = require('../services/auto-sync-service');
        const autoSyncService = getAutoSyncService();
        
        console.log(`🔄 Manual auto-sync requested by ${req.user.email}`);
        
        const result = await autoSyncService.performAutoSync(req.user.id, req.user.email);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Auto-sync completed: ${result.totalSynced} records synchronized`,
                totalSynced: result.totalSynced,
                results: result.results,
                syncActions: result.syncActions,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Manual auto-sync error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform auto-sync'
        });
    }
});

/**
 * POST /api/sync/pull
 * Pull all user data from Supabase to local SQLite
 * Called on login
 */
router.post('/pull', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const syncService = getSyncService();
        
        console.log(`🔄 Full sync requested for user ${req.user.email}`);
        
        // Ensure user profile exists in Supabase
        await syncService.ensureUserProfile({
            id: req.user.id,
            email: req.user.email,
            fullName: req.user.firstName,
            subscriptionTier: req.user.subscriptionTier || 'free'
        });
        
        // Pull all data from cloud
        const result = await syncService.fullSyncFromCloud(req.user.id);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Synced ${result.recordsSynced} records from cloud`,
                recordsSynced: result.recordsSynced,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Sync pull error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync from cloud'
        });
    }
});

/**
 * POST /api/sync/push
 * Push local changes to Supabase
 * Called on logout or manual sync
 */
router.post('/push', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const syncService = getSyncService();
        
        console.log(`⬆️ Push sync requested for user ${req.user.email}`);
        
        const result = await syncService.pushLocalChangesToCloud(req.user.id);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Pushed ${result.recordsPushed} records to cloud`,
                recordsPushed: result.recordsPushed,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Sync push error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to push to cloud'
        });
    }
});

/**
 * POST /api/sync/usage
 * Sync usage data specifically (critical for billing)
 */
router.post('/usage', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const syncService = getSyncService();
        const result = await syncService.syncUsageData(req.user.id);
        
        res.json({
            success: result.success,
            message: result.message || `Synced usage data`,
            recordsSynced: result.recordsSynced || 0,
            error: result.error
        });
    } catch (error) {
        console.error('❌ Usage sync error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync usage data'
        });
    }
});

/**
 * POST /api/sync/background
 * Background sync - lightweight push of recent changes
 */
router.post('/background', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const syncService = getSyncService();
        const result = await syncService.backgroundSync(req.user.id);
        
        res.json({
            success: result.success,
            recordsPushed: result.recordsPushed || 0,
            error: result.error,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Background sync error:', error);
        res.status(500).json({
            success: false,
            error: 'Background sync failed'
        });
    }
});

/**
 * POST /api/sync/emergency
 * Emergency sync for critical situations
 */
router.post('/emergency', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { tableName } = req.body;
        const syncService = getSyncService();
        
        console.log(`🚨 Emergency sync requested by ${req.user.email}`, tableName ? `for ${tableName}` : '');
        
        const result = await syncService.emergencySync(req.user.id, tableName);
        
        res.json({
            success: result.success,
            message: result.message,
            error: result.error,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Emergency sync error:', error);
        res.status(500).json({
            success: false,
            error: 'Emergency sync failed'
        });
    }
});

/**
 * GET /api/sync/test
 * Test sync connectivity (development only)
 */
router.get('/test', authMiddleware.authenticateToken, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }
    
    try {
        const syncService = getSyncService();
        const { createClient } = require('@supabase/supabase-js');
        
        // Test Supabase connection
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        const { data: testData, error } = await supabase
            .from('subjects')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'Sync service is working',
            supabaseConnected: true,
            testQuery: 'subjects table accessible',
            user: {
                id: req.user.id,
                email: req.user.email
            }
        });
    } catch (error) {
        console.error('❌ Sync test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            supabaseConnected: false
        });
    }
});

module.exports = router;