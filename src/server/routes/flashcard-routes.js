// src/server/routes/flashcard-routes.js - Flashcard API Routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-middleware');
const { validateSchema } = require('../middleware/validation-middleware');
const Joi = require('joi');

// Get database service from app context
const getDatabaseService = (req) => req.app.get('databaseService');

// ===============================
// VALIDATION SCHEMAS
// ===============================

const createFlashcardSetSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional().allow(''),
    subjectId: Joi.string().optional(),
    topicId: Joi.string().optional(),
    isShared: Joi.boolean().default(false)
});

const updateFlashcardSetSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional().allow(''),
    isShared: Joi.boolean().optional()
});

const createFlashcardSchema = Joi.object({
    front: Joi.string().min(1).max(1000).required(),
    back: Joi.string().min(1).max(2000).required(),
    hint: Joi.string().max(500).optional().allow(''),
    difficulty: Joi.number().integer().min(1).max(3).default(1),
    tags: Joi.array().items(Joi.string().max(50)).default([])
});

const updateFlashcardSchema = Joi.object({
    front: Joi.string().min(1).max(1000).optional(),
    back: Joi.string().min(1).max(2000).optional(),
    hint: Joi.string().max(500).optional().allow(''),
    difficulty: Joi.number().integer().min(1).max(3).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional()
});

const recordAnswerSchema = Joi.object({
    isCorrect: Joi.boolean().required(),
    responseTime: Joi.number().integer().min(100).max(300000).required() // 100ms to 5 minutes
});

const recordSessionSchema = Joi.object({
    studyMode: Joi.string().valid('recognition', 'recall', 'rapid_fire', 'spaced_review').required(),
    cardsStudied: Joi.number().integer().min(1).required(),
    cardsCorrect: Joi.number().integer().min(0).required(),
    durationSeconds: Joi.number().integer().min(1).required()
});

// ===============================
// FLASHCARD SET ROUTES
// ===============================

/**
 * GET /api/flashcards/sets - Get all flashcard sets for user
 */
router.get('/sets', authenticateToken, async (req, res) => {
    try {
        const db = getDatabaseService(req);
        const userId = req.user.user_id || req.user.id;
        
        const sets = await db.getFlashcardSets(userId);
        
        console.log(`✅ Retrieved ${sets.length} flashcard sets for user ${userId}`);
        res.json({
            success: true,
            data: sets
        });
    } catch (error) {
        console.error('❌ Error getting flashcard sets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get flashcard sets'
        });
    }
});

/**
 * POST /api/flashcards/sets - Create a new flashcard set
 */
router.post('/sets', 
    authenticateToken, 
    validateSchema(createFlashcardSetSchema),
    async (req, res) => {
        try {
            const db = getDatabaseService(req);
            const userId = req.user.user_id || req.user.id;
            
            const setData = req.body;
            const newSet = await db.createFlashcardSet(userId, setData);
            
            console.log(`✅ Created flashcard set: ${newSet.name} for user ${userId}`);
            res.status(201).json({
                success: true,
                data: newSet
            });
        } catch (error) {
            console.error('❌ Error creating flashcard set:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create flashcard set'
            });
        }
    }
);

/**
 * GET /api/flashcards/sets/:setId - Get specific flashcard set with cards
 */
router.get('/sets/:setId', authenticateToken, async (req, res) => {
    try {
        const db = getDatabaseService(req);
        const userId = req.user.user_id || req.user.id;
        const { setId } = req.params;
        
        const set = await db.getFlashcardSet(setId, userId);
        
        if (!set) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard set not found'
            });
        }
        
        console.log(`✅ Retrieved flashcard set: ${set.name} for user ${userId}`);
        res.json({
            success: true,
            data: set
        });
    } catch (error) {
        console.error('❌ Error getting flashcard set:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get flashcard set'
        });
    }
});

/**
 * PUT /api/flashcards/sets/:setId - Update flashcard set
 */
router.put('/sets/:setId', 
    authenticateToken,
    validateSchema(updateFlashcardSetSchema),
    async (req, res) => {
        try {
            const db = getDatabaseService(req);
            const userId = req.user.user_id || req.user.id;
            const { setId } = req.params;
            
            const updatedSet = await db.updateFlashcardSet(setId, userId, req.body);
            
            if (!updatedSet) {
                return res.status(404).json({
                    success: false,
                    error: 'Flashcard set not found or not owned by user'
                });
            }
            
            console.log(`✅ Updated flashcard set: ${setId} for user ${userId}`);
            res.json({
                success: true,
                data: updatedSet
            });
        } catch (error) {
            console.error('❌ Error updating flashcard set:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update flashcard set'
            });
        }
    }
);

/**
 * DELETE /api/flashcards/sets/:setId - Delete flashcard set
 */
router.delete('/sets/:setId', authenticateToken, async (req, res) => {
    try {
        const db = getDatabaseService(req);
        const userId = req.user.user_id || req.user.id;
        const { setId } = req.params;
        
        const deleted = await db.deleteFlashcardSet(setId, userId);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard set not found or not owned by user'
            });
        }
        
        console.log(`✅ Deleted flashcard set: ${setId} for user ${userId}`);
        res.json({
            success: true,
            message: 'Flashcard set deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting flashcard set:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete flashcard set'
        });
    }
});

// ===============================
// FLASHCARD ROUTES
// ===============================

/**
 * POST /api/flashcards/sets/:setId/cards - Add flashcard to set
 */
router.post('/sets/:setId/cards', 
    authenticateToken,
    validateSchema(createFlashcardSchema),
    async (req, res) => {
        try {
            const db = getDatabaseService(req);
            const userId = req.user.user_id || req.user.id;
            const { setId } = req.params;
            
            const cardData = req.body;
            const newCard = await db.createFlashcard(setId, userId, cardData);
            
            console.log(`✅ Created flashcard in set ${setId} for user ${userId}`);
            res.status(201).json({
                success: true,
                data: newCard
            });
        } catch (error) {
            console.error('❌ Error creating flashcard:', error);
            
            if (error.message.includes('not found') || error.message.includes('not owned')) {
                return res.status(404).json({
                    success: false,
                    error: 'Flashcard set not found or not owned by user'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Failed to create flashcard'
            });
        }
    }
);

/**
 * GET /api/flashcards/sets/:setId/cards - Get all cards in set
 */
router.get('/sets/:setId/cards', authenticateToken, async (req, res) => {
    try {
        const db = getDatabaseService(req);
        const userId = req.user.user_id || req.user.id;
        const { setId } = req.params;
        
        // First verify user has access to this set
        const set = await db.getFlashcardSet(setId, userId);
        if (!set) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard set not found'
            });
        }
        
        const cards = await db.getFlashcardsInSet(setId);
        
        console.log(`✅ Retrieved ${cards.length} flashcards from set ${setId} for user ${userId}`);
        res.json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('❌ Error getting flashcards:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get flashcards'
        });
    }
});

/**
 * PUT /api/flashcards/cards/:cardId - Update flashcard
 */
router.put('/cards/:cardId', 
    authenticateToken,
    validateSchema(updateFlashcardSchema),
    async (req, res) => {
        try {
            const db = getDatabaseService(req);
            const userId = req.user.user_id || req.user.id;
            const { cardId } = req.params;
            
            const updatedCard = await db.updateFlashcard(cardId, userId, req.body);
            
            if (!updatedCard) {
                return res.status(404).json({
                    success: false,
                    error: 'Flashcard not found or not owned by user'
                });
            }
            
            console.log(`✅ Updated flashcard: ${cardId} for user ${userId}`);
            res.json({
                success: true,
                data: updatedCard
            });
        } catch (error) {
            console.error('❌ Error updating flashcard:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update flashcard'
            });
        }
    }
);

/**
 * DELETE /api/flashcards/cards/:cardId - Delete flashcard
 */
router.delete('/cards/:cardId', authenticateToken, async (req, res) => {
    try {
        const db = getDatabaseService(req);
        const userId = req.user.user_id || req.user.id;
        const { cardId } = req.params;
        
        const deleted = await db.deleteFlashcard(cardId, userId);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Flashcard not found or not owned by user'
            });
        }
        
        console.log(`✅ Deleted flashcard: ${cardId} for user ${userId}`);
        res.json({
            success: true,
            message: 'Flashcard deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting flashcard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete flashcard'
        });
    }
});

// ===============================
// STUDY & PROGRESS ROUTES
// ===============================

/**
 * GET /api/flashcards/review - Get cards due for review
 */
router.get('/review', authenticateToken, async (req, res) => {
    try {
        const db = getDatabaseService(req);
        const userId = req.user.user_id || req.user.id;
        const { setId, limit = 20 } = req.query;
        
        const cards = await db.getCardsForReview(userId, setId, parseInt(limit));
        
        console.log(`✅ Retrieved ${cards.length} cards for review for user ${userId}`);
        res.json({
            success: true,
            data: cards
        });
    } catch (error) {
        console.error('❌ Error getting cards for review:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get cards for review'
        });
    }
});

/**
 * POST /api/flashcards/cards/:cardId/answer - Record answer for flashcard
 */
router.post('/cards/:cardId/answer', 
    authenticateToken,
    validateSchema(recordAnswerSchema),
    async (req, res) => {
        try {
            const db = getDatabaseService(req);
            const userId = req.user.user_id || req.user.id;
            const { cardId } = req.params;
            const { isCorrect, responseTime } = req.body;
            
            const updatedProgress = await db.updateCardProgress(userId, cardId, isCorrect, responseTime);
            
            console.log(`✅ Recorded answer for card ${cardId}, user ${userId}: ${isCorrect ? 'correct' : 'incorrect'}`);
            res.json({
                success: true,
                data: updatedProgress
            });
        } catch (error) {
            console.error('❌ Error recording flashcard answer:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to record answer'
            });
        }
    }
);

/**
 * POST /api/flashcards/sessions - Record study session
 */
router.post('/sessions', 
    authenticateToken,
    validateSchema(recordSessionSchema),
    async (req, res) => {
        try {
            const db = getDatabaseService(req);
            const userId = req.user.user_id || req.user.id;
            const { setId, studyMode, cardsStudied, cardsCorrect, durationSeconds } = req.body;
            
            const session = await db.recordFlashcardSession(
                userId, 
                setId, 
                studyMode, 
                cardsStudied, 
                cardsCorrect, 
                durationSeconds
            );
            
            console.log(`✅ Recorded study session for user ${userId}: ${cardsStudied} cards, ${studyMode} mode`);
            res.status(201).json({
                success: true,
                data: session
            });
        } catch (error) {
            console.error('❌ Error recording study session:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to record study session'
            });
        }
    }
);

/**
 * GET /api/flashcards/stats - Get study statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const db = getDatabaseService(req);
        const userId = req.user.user_id || req.user.id;
        const { days = 7 } = req.query;
        
        const stats = await db.getFlashcardStudyStats(userId, parseInt(days));
        
        console.log(`✅ Retrieved study stats for user ${userId} (${days} days)`);
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Error getting study stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get study statistics'
        });
    }
});

/**
 * GET /api/flashcards/cards/:cardId/progress - Get progress for specific card
 */
router.get('/cards/:cardId/progress', authenticateToken, async (req, res) => {
    try {
        const db = getDatabaseService(req);
        const userId = req.user.user_id || req.user.id;
        const { cardId } = req.params;
        
        const progress = await db.getCardProgress(userId, cardId);
        
        console.log(`✅ Retrieved progress for card ${cardId}, user ${userId}`);
        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('❌ Error getting card progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get card progress'
        });
    }
});

module.exports = router;