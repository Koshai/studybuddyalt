// src/server/routes/admin-routes.js
const express = require('express');
const router = express.Router();

// Import services and middleware
const SimplifiedDatabaseService = require('../services/database-simplified');
const authMiddleware = require('../middleware/auth-middleware');

// Initialize services
const db = new SimplifiedDatabaseService();

/**
 * POST /api/admin/create-subjects
 * Create/recreate the subjects table with all fixed subjects
 */
router.post('/create-subjects', 
    authMiddleware.authenticateToken, 
    authMiddleware.requireAdmin, 
    async (req, res) => {
        try {
            console.log('🔧 Admin creating subjects table...');
            
            // Create subjects table and populate with fixed subjects
            await db.createSubjectsTable();
            
            console.log('✅ Subjects table created successfully');
            res.json({
                success: true,
                message: 'Subjects table created with all 10 fixed subjects'
            });
        } catch (error) {
            console.error('❌ Create subjects error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create subjects table',
                details: error.message
            });
        }
    }
);

/**
 * GET /api/admin/database-info
 * Get database table information and counts
 */
router.get('/database-info',
    authMiddleware.authenticateToken,
    authMiddleware.requireAdmin,
    async (req, res) => {
        try {
            const info = await db.getDatabaseInfo();
            res.json({
                success: true,
                database_info: info,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Database info error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get database information',
                details: error.message
            });
        }
    }
);

/**
 * GET /api/admin/auth-test
 * Simple endpoint to test admin authentication
 */
router.get('/auth-test',
    authMiddleware.authenticateToken,
    authMiddleware.requireAdmin,
    (req, res) => {
        res.json({
            success: true,
            message: 'Admin authentication successful',
            user: {
                id: req.user.id,
                email: req.user.email,
                role: 'admin'
            },
            timestamp: new Date().toISOString()
        });
    }
);

module.exports = router;