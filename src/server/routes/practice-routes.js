// src/server/routes/practice-routes.js - Practice session management routes
const express = require('express');
const router = express.Router();

// Import services
const ServiceFactory = require('../services/service-factory');
const authMiddleware = require('../middleware/auth-middleware');
const AnswerEvaluationService = require('../services/answer-evaluation-service');

/**
 * GET /api/practice/topics-with-questions
 * Get all topics that have questions available for practice
 */
router.get('/topics-with-questions', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`🎯 Getting topics with questions for practice, user ${userId}`);
        
        const storage = ServiceFactory.getStorageService();
        
        // Get all user topics
        const allTopics = await storage.getTopicsForUser(userId, 'all');
        
        // Filter topics that have questions and add counts
        const topicsWithQuestions = [];
        for (const topic of allTopics) {
            try {
                const questions = await storage.getQuestionsForUser(userId, topic.id);
                if (questions.length > 0) {
                    // Get subject info
                    const subject = await storage.getSubjectById(topic.subject_id);
                    
                    topicsWithQuestions.push({
                        ...topic,
                        questionsCount: questions.length,
                        subjectId: topic.subject_id,
                        subjectName: subject ? subject.name : 'Unknown Subject',
                        lastPracticeSession: null // TODO: Get from practice sessions when implemented
                    });
                }
            } catch (error) {
                console.warn(`Failed to get questions for topic ${topic.id}:`, error);
            }
        }
        
        console.log(`📚 Found ${topicsWithQuestions.length} topics with questions`);
        res.json(topicsWithQuestions);
    } catch (error) {
        console.error('❌ Get topics with questions error:', error);
        res.status(500).json({
            error: 'Failed to fetch topics with questions',
            details: error.message
        });
    }
});

/**
 * GET /api/practice/stats
 * Get practice session statistics for the current user
 */
router.get('/stats', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`📊 Getting practice stats for user ${userId}`);
        
        const storage = ServiceFactory.getStorageService();
        
        // Get all practice sessions for user
        const sessions = await storage.getAllPracticeSessionsForUser(userId);
        
        // Calculate statistics
        const totalSessions = sessions.length;
        const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions_count || 0), 0);
        const totalCorrect = sessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
        const averageScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        
        // Calculate streak (simplified - consecutive days with sessions)
        const today = new Date();
        const sortedSessions = sessions.sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
        let streak = 0;
        let currentDate = today;
        
        for (const session of sortedSessions) {
            const sessionDate = new Date(session.session_date);
            const daysDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 1) {
                streak++;
                currentDate = sessionDate;
            } else {
                break;
            }
        }
        
        const stats = {
            totalSessions,
            averageScore: Math.round(averageScore),
            totalQuestions,
            totalCorrect,
            totalAnswered: totalQuestions,
            streak,
            lastSession: sortedSessions.length > 0 ? sortedSessions[0].session_date : null
        };
        
        console.log(`📈 Practice stats:`, stats);
        res.json(stats);
    } catch (error) {
        console.error('❌ Get practice stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch practice statistics',
            details: error.message
        });
    }
});

/**
 * POST /api/practice/session
 * Record a completed practice session
 */
router.post('/session', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { topicId, questionsCount, correctAnswers } = req.body;
        const userId = req.user.id;
        
        if (!topicId || questionsCount === undefined || correctAnswers === undefined) {
            return res.status(400).json({ error: 'topicId, questionsCount, and correctAnswers are required' });
        }
        
        console.log(`📝 Recording practice session: ${correctAnswers}/${questionsCount} for topic ${topicId}`);
        
        const storage = ServiceFactory.getStorageService();
        const session = await storage.recordPracticeSession(userId, topicId, questionsCount, correctAnswers);
        
        res.json(session);
    } catch (error) {
        console.error('❌ Record practice session error:', error);
        res.status(500).json({
            error: 'Failed to record practice session',
            details: error.message
        });
    }
});

/**
 * POST /api/practice/evaluate-answer
 * Evaluate a text answer using AI-powered semantic comparison
 */
router.post('/evaluate-answer', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { userAnswer, correctAnswer, question, subject } = req.body;
        
        if (!userAnswer || !correctAnswer || !question) {
            return res.status(400).json({ 
                error: 'userAnswer, correctAnswer, and question are required' 
            });
        }
        
        console.log(`🧠 Evaluating answer: "${userAnswer}" vs "${correctAnswer}"`);
        
        const evaluationService = new AnswerEvaluationService();
        const result = await evaluationService.evaluateTextAnswer(
            userAnswer, 
            correctAnswer, 
            question, 
            subject || 'general'
        );
        
        console.log(`✅ Evaluation result:`, result);
        res.json(result);
        
    } catch (error) {
        console.error('❌ Answer evaluation error:', error);
        res.status(500).json({
            error: 'Failed to evaluate answer',
            details: error.message
        });
    }
});

module.exports = router;