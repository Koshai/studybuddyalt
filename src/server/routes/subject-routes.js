// src/server/routes/subject-routes.js
const express = require('express');
const router = express.Router();

// Import services
const ServiceFactory = require('../services/service-factory');
const authMiddleware = require('../middleware/auth-middleware');

/**
 * GET /api/subjects
 * Get all available subjects (fixed list)
 */
router.get('/', async (req, res) => {
    try {
        const storage = ServiceFactory.getStorageService();
        const subjects = await storage.getSubjects();
        res.json(subjects);
    } catch (error) {
        console.error('❌ Get subjects error:', error);
        res.status(500).json({
            error: 'Failed to fetch subjects',
            details: error.message
        });
    }
});

/**
 * GET /api/subjects/:subjectId
 * Get specific subject by ID
 */
router.get('/:subjectId', async (req, res) => {
    try {
        const { subjectId } = req.params;
        const storage = ServiceFactory.getStorageService();
        const subject = await storage.getSubjectById(subjectId);
        
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        
        res.json(subject);
    } catch (error) {
        console.error('❌ Get subject error:', error);
        res.status(500).json({
            error: 'Failed to fetch subject',
            details: error.message
        });
    }
});

/**
 * GET /api/subjects/:subjectId/topics
 * Get topics for a specific subject (requires authentication)
 */
router.get('/:subjectId/topics', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { subjectId } = req.params;
        const userId = req.user.id;
        
        console.log(`🔍 Getting topics for subject ${subjectId}, user ${userId}`);
        
        const storage = ServiceFactory.getStorageService();
        const topics = await storage.getTopicsForUser(userId, subjectId);
        res.json(topics);
    } catch (error) {
        console.error('❌ Get topics for subject error:', error);
        res.status(500).json({
            error: 'Failed to fetch topics for subject',
            details: error.message
        });
    }
});

/**
 * POST /api/subjects/:subjectId/topics
 * Create new topic under a subject (requires authentication)
 */
router.post('/:subjectId/topics', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { name, description } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: 'Topic name is required' });
        }

        console.log(`📝 Creating topic "${name}" for subject ${subjectId}, user ${userId}`);

        const storage = ServiceFactory.getStorageService();
        const topic = await storage.createTopic(userId, subjectId, name, description || '');
        res.status(201).json({
            success: true,
            topic: topic,
            message: `Topic "${name}" created successfully`
        });
    } catch (error) {
        console.error('❌ Create topic error:', error);
        res.status(500).json({
            error: 'Failed to create topic',
            details: error.message
        });
    }
});

/**
 * GET /api/subjects/stats
 * Get subject-wise statistics (requires authentication)
 */
router.get('/stats', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const storage = ServiceFactory.getStorageService();
        const stats = await storage.getSubjectStatsForUser(userId);
        res.json(stats);
    } catch (error) {
        console.error('❌ Get subject stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch subject statistics',
            details: error.message
        });
    }
});

module.exports = router;