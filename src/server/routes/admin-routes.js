// src/server/routes/admin-routes.js
const express = require('express');
const router = express.Router();

// Import services and middleware
const ServiceFactory = require('../services/service-factory');
const authMiddleware = require('../middleware/auth-middleware');

/**
 * POST /api/admin/create-subjects
 * Create/recreate the subjects table with all fixed subjects (Desktop only)
 */
router.post('/create-subjects', 
    authMiddleware.authenticateToken, 
    authMiddleware.requireAdmin, 
    async (req, res) => {
        try {
            const EnvironmentService = require('../services/environment-service');
            
            if (EnvironmentService.isWeb()) {
                return res.json({
                    success: true,
                    message: 'Subjects already exist in Supabase. No action needed for web mode.',
                    subjects_count: 10
                });
            }
            
            console.log('🔧 Admin creating subjects table for desktop...');
            const storage = ServiceFactory.getStorageService();
            
            if (typeof storage.createSubjectsTable === 'function') {
                await storage.createSubjectsTable();
                console.log('✅ Subjects table created successfully');
            }
            
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
            const EnvironmentService = require('../services/environment-service');
            const storage = ServiceFactory.getStorageService();
            
            if (EnvironmentService.isWeb()) {
                // For web mode (Supabase), provide basic connection info
                res.json({
                    success: true,
                    database_info: {
                        type: 'supabase',
                        environment: 'web',
                        status: 'connected',
                        subjects_available: 10,
                        message: 'Using Supabase cloud database'
                    },
                    timestamp: new Date().toISOString()
                });
            } else {
                // For desktop mode (SQLite), get actual database info
                if (typeof storage.getDatabaseInfo === 'function') {
                    const info = await storage.getDatabaseInfo();
                    res.json({
                        success: true,
                        database_info: info,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    res.json({
                        success: true,
                        database_info: {
                            type: 'sqlite',
                            environment: 'desktop',
                            status: 'connected'
                        },
                        timestamp: new Date().toISOString()
                    });
                }
            }
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