// src/server/routes/topic-routes.js
const express = require('express');
const router = express.Router();

// Import services
const ServiceFactory = require('../services/service-factory');
const authMiddleware = require('../middleware/auth-middleware');

/**
 * GET /api/topics/:topicId
 * Get topic details with subject information
 */
router.get('/:topicId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const userId = req.user.id;
        
        const storage = ServiceFactory.getStorageService();
        const topic = await storage.getTopicById(topicId);
        
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

        const storage = ServiceFactory.getStorageService();
        await storage.updateTopic(topicId, userId, name, description);
        
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

        const storage = ServiceFactory.getStorageService();
        await storage.deleteTopic(topicId, userId);
        
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
 * GET /api/topics/:topicId/questions
 * Get all questions for a specific topic
 */
router.get('/:topicId/questions', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const userId = req.user.id;
        
        const storage = ServiceFactory.getStorageService();
        const questions = await storage.getQuestionsForUser(userId, topicId);
        
        console.log(`📝 Retrieved ${questions.length} questions for topic ${topicId}`);
        res.json(questions);
    } catch (error) {
        console.error('❌ Get topic questions error:', error);
        res.status(500).json({
            error: 'Failed to fetch questions for topic',
            details: error.message
        });
    }
});

/**
 * GET /api/topics/:topicId/notes
 * Get all notes for a specific topic
 */
router.get('/:topicId/notes', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const userId = req.user.id;
        
        const storage = ServiceFactory.getStorageService();
        const notes = await storage.getNotesForUser(userId, topicId);
        
        console.log(`📄 Retrieved ${notes.length} notes for topic ${topicId}`);
        res.json(notes);
    } catch (error) {
        console.error('❌ Get topic notes error:', error);
        res.status(500).json({
            error: 'Failed to fetch notes for topic',
            details: error.message
        });
    }
});

/**
 * GET /api/topics/:topicId/random-questions
 * Get random questions for practice from a specific topic
 */
router.get('/:topicId/random-questions', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const userId = req.user.id;
        const count = parseInt(req.query.count) || 5;
        
        const storage = ServiceFactory.getStorageService();
        const questions = await storage.getRandomQuestionsForUser(userId, topicId, count);
        
        console.log(`🎲 Retrieved ${questions.length} random questions for topic ${topicId}`);
        res.json(questions);
    } catch (error) {
        console.error('❌ Get random questions error:', error);
        res.status(500).json({
            error: 'Failed to fetch random questions for topic',
            details: error.message
        });
    }
});

/**
 * POST /api/topics/:topicId/generate-questions-openai
 * Generate questions for a topic using OpenAI
 */
router.post('/:topicId/generate-questions-openai', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { topicId } = req.params;
        const { count = 5, subjectCategory, topic } = req.body;
        const userId = req.user.id;
        
        console.log(`🤖 Generating ${count} questions for topic ${topicId} using OpenAI`);
        
        const ServiceFactory = require('../services/service-factory');
        const aiService = ServiceFactory.getAIService();
        
        // Get topic and notes for context
        const storage = ServiceFactory.getStorageService();
        const topicData = await storage.getTopicById(topicId);
        const notes = await storage.getNotesForUser(userId, topicId);
        
        if (!topicData) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        if (notes.length === 0) {
            return res.status(400).json({ error: 'No study materials found for this topic. Please upload some materials first.' });
        }
        
        // Combine all notes content for AI generation
        const combinedContent = notes.map(note => note.content).join('\n\n---\n\n');
        
        // Get subject info for context
        const subject = await storage.getSubjectById(topicData.subject_id);
        
        // Generate questions using AI service
        const questions = await aiService.generateQuestions(
            combinedContent,
            count,
            subject,
            topicData.name
        );
        
        // Save questions to database
        const savedQuestions = [];
        for (const questionData of questions) {
            try {
                const savedQuestion = await storage.createQuestion(userId, topicId, questionData);
                savedQuestions.push(savedQuestion);
            } catch (error) {
                console.warn('Failed to save question:', error);
            }
        }
        
        console.log(`✅ Generated and saved ${savedQuestions.length} questions`);
        res.json(savedQuestions);
    } catch (error) {
        console.error('❌ Generate questions error:', error);
        res.status(500).json({
            error: 'Failed to generate questions',
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
        
        const storage = ServiceFactory.getStorageService();
        
        // Get basic counts for this topic
        const [questions, notes] = await Promise.all([
            storage.getQuestionsForUser(userId, topicId),
            storage.getNotesForUser(userId, topicId)
        ]);
        
        const stats = {
            question_count: questions.length,
            note_count: notes.length,
            topic_id: topicId
        };
        
        console.log(`📊 Topic ${topicId} stats:`, stats);
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