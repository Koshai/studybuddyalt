// src/server/routes/desktop-routes.js - Desktop App Download Routes
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Import services
const authMiddleware = require('../middleware/auth-middleware');
const DesktopAppBuilder = require('../services/desktop-app-builder');
const EnvironmentService = require('../services/environment-service');

/**
 * GET /api/desktop/check
 * Check if desktop app generation is available
 */
router.get('/check', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        
        // Desktop app is only available for Pro+ users in web mode
        if (EnvironmentService.isDesktop()) {
            return res.json({
                available: false,
                reason: 'Already running desktop version'
            });
        }
        
        const canDownload = user.subscriptionTier !== 'free';
        
        res.json({
            available: canDownload,
            userTier: user.subscriptionTier,
            reason: canDownload ? null : 'Desktop app requires Pro subscription',
            features: {
                offline: true,
                ollama: true,
                unlimited: user.subscriptionTier === 'premium',
                sync: user.subscriptionTier !== 'free'
            }
        });
        
    } catch (error) {
        console.error('❌ Desktop check error:', error);
        res.status(500).json({
            available: false,
            error: 'Failed to check desktop availability'
        });
    }
});

/**
 * POST /api/desktop/generate
 * Generate personalized desktop app
 */
router.post('/generate', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const { platform, customOptions = {} } = req.body;
        
        console.log(`🖥️  Desktop app generation requested by user: ${user.id}`);
        
        // Check subscription tier
        if (user.subscriptionTier === 'free') {
            return res.status(403).json({
                success: false,
                error: 'Desktop app requires Pro subscription',
                upgradeUrl: '/pricing'
            });
        }
        
        // Check if we're already in desktop mode
        if (EnvironmentService.isDesktop()) {
            return res.status(400).json({
                success: false,
                error: 'Cannot generate desktop app from desktop version'
            });
        }
        
        // Validate platform
        const supportedPlatforms = ['win', 'mac', 'linux'];
        const targetPlatform = platform || 'win';
        
        if (!supportedPlatforms.includes(targetPlatform)) {
            return res.status(400).json({
                success: false,
                error: `Unsupported platform: ${targetPlatform}`
            });
        }
        
        // Start generation process (async)
        res.json({
            success: true,
            message: 'Desktop app generation started',
            estimatedTime: '2-5 minutes',
            platform: targetPlatform,
            pollUrl: `/api/desktop/status/${user.id}`
        });
        
        // Generate app asynchronously
        setImmediate(async () => {
            try {
                const builder = new DesktopAppBuilder();
                const result = await builder.generatePersonalizedApp(
                    user.id, 
                    user.subscriptionTier, 
                    {
                        platform: targetPlatform,
                        ...customOptions
                    }
                );
                
                console.log(`✅ Desktop app generated for user ${user.id}:`, result);
                
                // In a real implementation, you'd store this result
                // and notify the user (email, websocket, etc.)
                
            } catch (error) {
                console.error(`❌ Desktop app generation failed for user ${user.id}:`, error);
            }
        });
        
    } catch (error) {
        console.error('❌ Desktop generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start desktop app generation'
        });
    }
});

/**
 * GET /api/desktop/status/:userId
 * Check desktop app generation status
 */
router.get('/status/:userId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = req.user;
        
        // Users can only check their own status
        if (user.id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        // In a real implementation, you'd check a database or cache
        // For now, return a mock status
        res.json({
            success: true,
            status: 'completed', // building, completed, failed
            progress: 100,
            downloadUrl: `/api/desktop/download/${userId}`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            size: '250MB'
        });
        
    } catch (error) {
        console.error('❌ Desktop status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check generation status'
        });
    }
});

/**
 * GET /api/desktop/download/:userId
 * Download personalized desktop app
 */
router.get('/download/:userId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = req.user;
        
        // Users can only download their own app
        if (user.id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }
        
        // In a real implementation, you'd:
        // 1. Check if the app exists
        // 2. Verify it hasn't expired
        // 3. Stream the file to the user
        
        const mockDownloadPath = path.join(__dirname, '../../../dist-desktop', `StudyBuddy-${userId}.exe`);
        
        try {
            await fs.access(mockDownloadPath);
            // File exists
            res.download(mockDownloadPath, `Jaquizy-Desktop.exe`, (err) => {
                if (err) {
                    console.error('Download error:', err);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            error: 'Download failed'
                        });
                    }
                }
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                error: 'Desktop app not found or expired'
            });
        }
        
    } catch (error) {
        console.error('❌ Desktop download error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download desktop app'
        });
    }
});

/**
 * GET /api/desktop/features
 * Get desktop app features for current user tier
 */
router.get('/features', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const builder = new DesktopAppBuilder();
        const features = builder.getTierFeatures(user.subscriptionTier);
        
        res.json({
            success: true,
            tier: user.subscriptionTier,
            features,
            comparison: {
                web: {
                    ai: 'OpenAI (usage limited)',
                    storage: 'Cloud (Supabase)',
                    offline: false,
                    sync: true
                },
                desktop: {
                    ai: 'Ollama (unlimited)',
                    storage: 'Local SQLite',
                    offline: true,
                    sync: features.sync
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Desktop features error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get desktop features'
        });
    }
});

module.exports = router;