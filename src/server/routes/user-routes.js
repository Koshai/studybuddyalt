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
        
        console.log(`📊 Calculating usage stats for user ${userId}`);
        
        // Get current month usage
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentMonthStart = new Date(currentMonth + '-01');
        const nextMonth = new Date(currentMonthStart);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Calculate actual usage
        const [allTopics, allQuestions, allNotes] = await Promise.all([
            storage.getTopicsForUser(userId, 'all'),
            storage.getAllQuestionsForUser ? storage.getAllQuestionsForUser(userId) : [],
            storage.getAllNotesForUser(userId)
        ]);
        
        // Filter by current month for monthly limits
        const currentMonthTopics = allTopics.filter(t => 
            new Date(t.created_at) >= currentMonthStart && new Date(t.created_at) < nextMonth
        );
        
        const currentMonthQuestions = allQuestions.filter(q => 
            new Date(q.created_at) >= currentMonthStart && new Date(q.created_at) < nextMonth
        );
        
        // Calculate storage used (rough estimate based on content length)
        const storageUsed = allNotes.reduce((total, note) => {
            return total + (note.content ? note.content.length : 0);
        }, 0);
        
        const usageStats = {
            questions: {
                used: currentMonthQuestions.length,
                limit: req.user.subscriptionTier === 'free' ? 50 : 1500,
                percentage: req.user.subscriptionTier === 'free' 
                    ? Math.round((currentMonthQuestions.length / 50) * 100)
                    : Math.round((currentMonthQuestions.length / 1500) * 100)
            },
            storage: {
                used: storageUsed,
                limit: req.user.subscriptionTier === 'free' ? 100 * 1024 * 1024 : 1024 * 1024 * 1024,
                percentage: req.user.subscriptionTier === 'free'
                    ? Math.round((storageUsed / (100 * 1024 * 1024)) * 100)
                    : Math.round((storageUsed / (1024 * 1024 * 1024)) * 100),
                usedMB: Math.round(storageUsed / (1024 * 1024)),
                limitMB: req.user.subscriptionTier === 'free' ? 100 : 1024
            },
            topics: {
                used: currentMonthTopics.length,
                limit: req.user.subscriptionTier === 'free' ? 3 : 50,
                percentage: req.user.subscriptionTier === 'free'
                    ? Math.round((currentMonthTopics.length / 3) * 100)
                    : Math.round((currentMonthTopics.length / 50) * 100)
            },
            monthYear: currentMonth,
            tier: req.user.subscriptionTier || 'free'
        };
        
        console.log('✅ Usage stats calculated:', {
            questions: `${usageStats.questions.used}/${usageStats.questions.limit}`,
            topics: `${usageStats.topics.used}/${usageStats.topics.limit}`,
            storage: `${usageStats.storage.usedMB}MB/${usageStats.storage.limitMB}MB`
        });
        
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