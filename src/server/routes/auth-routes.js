// src/server/routes/auth-routes.js
const express = require('express');
const AuthService = require('../services/auth-service');
const authMiddleware = require('../middleware/auth-middleware');
const UsageService = require('../services/usage-service');

const router = express.Router();
const authService = new AuthService();
const usageService = new UsageService();

// Test route to check if auth service is working
router.get('/test', async (req, res) => {
    try {
        res.json({
            status: 'success',
            message: 'Auth service is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        console.log('🔄 Registration attempt:', { email: req.body.email, username: req.body.username });
        
        const result = await authService.register(req.body);
        
        console.log('✅ Registration successful:', result.user.email);
        
        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            user: result.user,
            tokens: result.tokens
        });
    } catch (error) {
        console.error('❌ Registration failed:', error.message);
        
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        console.log('🔄 Login attempt:', req.body.email);
        
        const result = await authService.login(req.body.email, req.body.password);
        
        console.log('✅ Login successful:', result.user.email);
        
        res.json({
            status: 'success',
            message: 'Login successful',
            user: result.user,
            tokens: result.tokens
        });
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        
        res.status(401).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get current user profile (protected route)
router.get('/profile', authMiddleware.authenticateToken, async (req, res) => {
    try {
        console.log('🔄 Profile request for user:', req.user.id);
        
        const usage = await usageService.getUsageStats(req.user.id);
        
        res.json({
            status: 'success',
            user: req.user,
            usage: usage
        });
    } catch (error) {
        console.error('❌ Profile fetch failed:', error.message);
        
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Update user profile (protected route)
router.put('/profile', authMiddleware.authenticateToken, async (req, res) => {
    try {
        console.log('🔄 Profile update for user:', req.user.id);
        
        const updatedProfile = await authService.updateUserProfile(req.user.id, req.body);
        
        res.json({
            status: 'success',
            message: 'Profile updated successfully',
            user: updatedProfile
        });
    } catch (error) {
        console.error('❌ Profile update failed:', error.message);
        
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({
                status: 'error',
                message: 'Refresh token required'
            });
        }
        
        const tokens = await authService.refreshToken(refreshToken);
        
        res.json({
            status: 'success',
            tokens: tokens
        });
    } catch (error) {
        console.error('❌ Token refresh failed:', error.message);
        
        res.status(401).json({
            status: 'error',
            message: error.message
        });
    }
});

// Logout user
router.post('/logout', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        await authService.logout(refreshToken);
        
        res.json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Test protected route with subscription check
router.get('/pro-feature', 
    authMiddleware.authenticateToken,
    authMiddleware.requireSubscription('pro'),
    (req, res) => {
        res.json({
            status: 'success',
            message: 'This is a Pro-only feature!',
            user: req.user
        });
    }
);

module.exports = router;