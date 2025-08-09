// src/server/routes/topic-routes.js
const express = require('express');
const router = express.Router();

// Import services
const SimplifiedDatabaseService = require('../services/database-simplified');
const authMiddleware = require('../middleware/auth-middleware');

// Initialize services
const db = new SimplifiedDatabaseService();

/**
 * GET /api/topics/:topicId
 * Get topic details with subject information
 */
router.get('/:topicId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const userId = req.user.id;
        
        const topic = await db.getTopicWithSubject(topicId, userId);
        
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        res.json(topic);
    } catch (error) {
        console.error('❌ Get topic error:', error);
        res.status(500).json({
            error: 'Failed to fetch topic',
            details: error.message
        });
    }
});

/**
 * PUT /api/topics/:topicId
 * Update topic details
 */
router.put('/:topicId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const { name, description } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: 'Topic name is required' });
        }

        await db.updateTopic(topicId, userId, name, description);
        
        res.json({
            success: true,
            message: 'Topic updated successfully'
        });
    } catch (error) {
        console.error('❌ Update topic error:', error);
        res.status(500).json({
            error: 'Failed to update topic',
            details: error.message
        });
    }
});

/**
 * DELETE /api/topics/:topicId
 * Delete topic and all associated data
 */
router.delete('/:topicId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const userId = req.user.id;

        await db.deleteTopic(topicId, userId);
        
        res.json({
            success: true,
            message: 'Topic and all associated data deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete topic error:', error);
        res.status(500).json({
            error: 'Failed to delete topic',
            details: error.message
        });
    }
});

/**
 * GET /api/topics/:topicId/stats
 * Get statistics for a specific topic
 */
router.get('/:topicId/stats', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const userId = req.user.id;
        
        const stats = await db.getTopicStats(topicId, userId);
        res.json(stats);
    } catch (error) {
        console.error('❌ Get topic stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch topic statistics',
            details: error.message
        });
    }
});

module.exports = router;