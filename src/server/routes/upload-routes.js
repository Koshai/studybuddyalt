// src/server/routes/upload-routes.js - File Upload Routes

const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth-middleware');
const ServiceFactory = require('../services/service-factory');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory for processing
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1 // Only one file at a time
    },
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
    }
});

/**
 * GET /api/upload-test - Test if upload route is accessible
 */
router.get('/upload-test', (req, res) => {
    console.log('🧪 Upload test endpoint hit');
    res.json({ 
        success: true, 
        message: 'Upload route is accessible',
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/upload-debug - Debug upload without auth
 */
router.post('/upload-debug', 
    upload.single('file'),
    async (req, res) => {
        try {
            console.log('🐛 DEBUG: File upload request received (no auth)');
            console.log('🐛 DEBUG: Request body:', { topicId: req.body.topicId, hasFile: !!req.file });
            
            // Mock user and topic for testing (need to be valid UUIDs for notes table)
            const { v4: uuidv4 } = require('uuid');
            const userId = uuidv4(); // Generate a valid UUID for testing
            const topicId = uuidv4(); // Generate a valid UUID for testing
            const file = req.file;
            
            console.log('🐛 DEBUG: File details:', {
                originalName: file?.originalname,
                size: file?.size,
                mimeType: file?.mimetype
            });
            
            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }
            
            // Get storage service and upload
            const db = ServiceFactory.getStorageService();
            
            console.log('🐛 DEBUG: About to call db.uploadFile...');
            console.log('🐛 DEBUG: Using UUIDs:', { userId, topicId });
            
            // Test database connection first
            console.log('🧪 Testing database connection...');
            try {
                const { data: testData, error: testError } = await db.supabase
                    .from('notes')
                    .select('*')
                    .limit(1);
                console.log('🧪 Database test result:', { 
                    hasData: !!testData, 
                    dataLength: testData?.length || 0,
                    error: testError || 'No error'
                });
                if (testError) {
                    console.error('🧪 Database test error details:', testError);
                }
            } catch (testErr) {
                console.error('🧪 Database test exception:', testErr);
            }
            
            const uploadResult = await db.uploadFile(
                userId,
                topicId, 
                file.buffer,
                file.originalname
            );
            
            console.log('🐛 DEBUG: Upload completed:', uploadResult);
            
            res.status(201).json({
                success: true,
                data: uploadResult,
                message: 'Debug upload successful'
            });
            
        } catch (error) {
            console.error('🐛 DEBUG: Upload error:', error);
            res.status(500).json({
                success: false,
                error: 'Debug upload failed',
                details: error.message
            });
        }
    }
);

/**
 * POST /api/upload-simplified - Upload file to topic
 */
router.post('/upload-simplified', 
    //authenticateToken,  // Temporarily disabled for testing
    upload.single('file'),
    async (req, res) => {
        // Mock user for testing
        req.user = { user_id: 'test-user-123' };
        try {
            console.log('📤 File upload request received');
            console.log('📊 Request body:', { topicId: req.body.topicId, hasFile: !!req.file });
            console.log('📊 User:', { userId: req.user?.user_id || req.user?.id });
            
            // Validate required fields
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }
            
            if (!req.body.topicId) {
                return res.status(400).json({
                    success: false,
                    error: 'Topic ID is required'
                });
            }
            
            const db = ServiceFactory.getStorageService();
            const userId = req.user.user_id || req.user.id;
            const topicId = req.body.topicId;
            const file = req.file;
            
            console.log('📁 File details:', {
                originalName: file.originalname,
                size: file.size,
                mimeType: file.mimetype
            });
            
            // Verify topic exists and user has access (mocked for testing)
            console.log('📍 Skipping topic validation for testing...');
            const topic = { user_id: userId, id: topicId }; // Mock topic
            
            // Upload file using storage service
            console.log('🚀 About to call db.uploadFile...');
            console.log('🚀 Parameters:', {
                userId: userId,
                topicId: topicId,
                bufferSize: file.buffer.length,
                filename: file.originalname
            });
            
            const uploadResult = await db.uploadFile(
                userId,
                topicId, 
                file.buffer,
                file.originalname
            );
            
            console.log('✅ File uploaded successfully:', {
                fileId: uploadResult.id,
                filename: uploadResult.filename,
                size: uploadResult.size
            });
            
            res.status(201).json({
                success: true,
                data: uploadResult,
                message: 'File uploaded successfully'
            });
            
        } catch (error) {
            console.error('❌ File upload error:', error);
            
            // Handle specific errors
            if (error.message.includes('not allowed')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error: 'File too large (maximum 50MB)'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'File upload failed',
                details: error.message
            });
        }
    }
);

module.exports = router;