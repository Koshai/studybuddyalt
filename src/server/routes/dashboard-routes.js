// src/server/routes/dashboard-routes.js - Dashboard statistics and data routes
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth-middleware');
const ServiceFactory = require('../services/service-factory');

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for current user
 */
router.get('/stats', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const storage = ServiceFactory.getStorageService();
        
        // Get user's dashboard stats
        const stats = await storage.getDashboardStatsForUser(userId);
        
        res.json({
            success: true,
            stats: stats || {
                total_topics: 0,
                total_questions: 0,
                total_notes: 0,
                total_practice_sessions: 0,
                overall_accuracy: 0
            }
        });
        
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        
        // Return empty stats on error
        res.json({
            success: true,
            stats: {
                total_topics: 0,
                total_questions: 0,
                total_notes: 0,
                total_practice_sessions: 0,
                overall_accuracy: 0
            }
        });
    }
});

/**
 * GET /api/activity/recent
 * Get recent user activity
 */
router.get('/activity/recent', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 5;
        
        // For now, return empty activity since we're focusing on web-only architecture
        res.json({
            success: true,
            activities: []
        });
        
    } catch (error) {
        console.error('❌ Recent activity error:', error);
        res.json({
            success: true,
            activities: []
        });
    }
});

/**
 * GET /api/health/ai
 * Check AI service status
 */
router.get('/health/ai', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const serviceStatus = await ServiceFactory.getServiceStatus();
        
        res.json({
            success: true,
            aiService: {
                available: true, // Simplified for web-only
                primary: 'openai',
                status: 'online'
            }
        });
        
    } catch (error) {
        console.error('❌ AI health check error:', error);
        res.json({
            success: true,
            aiService: {
                available: false,
                primary: 'openai',
                status: 'offline',
                error: error.message
            }
        });
    }
});

/**
 * GET /api/health
 * General health check (different from /api/health)
 */
router.get('/', authMiddleware.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            status: 'healthy',
            user: {
                id: req.user.id,
                tier: req.user.subscriptionTier
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Health check error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;