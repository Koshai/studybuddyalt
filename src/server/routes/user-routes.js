// src/server/routes/user-routes.js - User data and statistics routes
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth-middleware');
const ServiceFactory = require('../services/service-factory');

/**
 * GET /api/user/usage
 * Get current user's usage statistics
 */
router.get('/usage', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const storage = ServiceFactory.getStorageService();
        
        // Get current month usage
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        // For now, return mock data since we're using web-only architecture
        const usageStats = {
            questionsUsed: 0,
            questionsLimit: req.user.subscriptionTier === 'free' ? 50 : 1000,
            storageUsed: 0,
            storageLimit: req.user.subscriptionTier === 'free' ? 100 * 1024 * 1024 : 1024 * 1024 * 1024, // 100MB for free, 1GB for pro
            topicsCreated: 0,
            monthYear: currentMonth,
            tier: req.user.subscriptionTier
        };
        
        res.json(usageStats);
        
    } catch (error) {
        console.error('❌ Get usage error:', error);
        res.status(500).json({
            error: 'Failed to fetch usage statistics',
            details: error.message
        });
    }
});

/**
 * GET /api/user/profile
 * Get current user's profile (handled by auth routes, but adding fallback)
 */
router.get('/profile', authMiddleware.authenticateToken, async (req, res) => {
    try {
        res.json({
            id: req.user.id,
            email: req.user.email,
            subscriptionTier: req.user.subscriptionTier || 'free',
            subscriptionStatus: req.user.subscriptionStatus || 'active'
        });
        
    } catch (error) {
        console.error('❌ Get profile error:', error);
        res.status(500).json({
            error: 'Failed to fetch user profile',
            details: error.message
        });
    }
});

module.exports = router;