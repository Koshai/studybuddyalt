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
 * POST /api/upload-simplified - Upload file to topic
 */
router.post('/upload-simplified', 
    authenticateToken,
    upload.single('file'),
    async (req, res) => {
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
            
            // Verify topic exists and user has access
            const topic = await db.getTopicById(topicId);
            if (!topic) {
                return res.status(404).json({
                    success: false,
                    error: 'Topic not found'
                });
            }
            
            if (topic.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied to this topic'
                });
            }
            
            // Upload file using storage service
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