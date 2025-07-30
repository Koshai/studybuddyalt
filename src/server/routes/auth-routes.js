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

// Cleanup endpoint for testing (DEVELOPMENT ONLY)
router.post('/cleanup-test-user', async (req, res) => {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return res.status(404).json({ error: 'Not found' });
    }
    
    try {
        const { email, username } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }
        
        console.log(`🧹 Attempting to cleanup user: ${email}`);
        
        let cleanedUp = false;
        
        // Try to get user by email
        try {
            const { data: authUser, error: getUserError } = await authService.supabase.auth.admin.getUserByEmail(email);
            
            if (authUser?.user) {
                console.log(`Found auth user: ${authUser.user.id}`);
                
                // Delete from user_profiles first (foreign key constraints)
                const { error: profileDeleteError } = await authService.supabase
                    .from('user_profiles')
                    .delete()
                    .eq('id', authUser.user.id);
                    
                if (profileDeleteError) {
                    console.log('Profile delete error (might not exist):', profileDeleteError.message);
                }
                
                // Delete from user_usage
                const { error: usageDeleteError } = await authService.supabase
                    .from('user_usage')
                    .delete()
                    .eq('user_id', authUser.user.id);
                    
                if (usageDeleteError) {
                    console.log('Usage delete error (might not exist):', usageDeleteError.message);
                }
                
                // Delete from auth.users
                const { error: authDeleteError } = await authService.supabase.auth.admin.deleteUser(authUser.user.id);
                
                if (authDeleteError) {
                    console.error('Auth delete error:', authDeleteError);
                    throw authDeleteError;
                }
                
                cleanedUp = true;
                console.log(`✅ Successfully cleaned up user: ${email}`);
            }
        } catch (error) {
            console.log('Error during cleanup:', error.message);
            // Continue - user might not exist
        }
        
        // Also try cleanup by username if provided
        if (username && !cleanedUp) {
            try {
                const { data: profileByUsername } = await authService.supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('username', username)
                    .single();
                    
                if (profileByUsername) {
                    // Delete profile
                    await authService.supabase
                        .from('user_profiles')
                        .delete()
                        .eq('id', profileByUsername.id);
                        
                    // Delete usage
                    await authService.supabase
                        .from('user_usage')
                        .delete()
                        .eq('user_id', profileByUsername.id);
                        
                    // Delete auth user
                    await authService.supabase.auth.admin.deleteUser(profileByUsername.id);
                    
                    cleanedUp = true;
                    console.log(`✅ Cleaned up user by username: ${username}`);
                }
            } catch (error) {
                console.log('Username cleanup error:', error.message);
            }
        }
        
        res.json({ 
            success: true, 
            message: cleanedUp ? 'User cleaned up successfully' : 'No user found to cleanup',
            cleanedUp 
        });
        
    } catch (error) {
        console.error('Cleanup endpoint error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Debug endpoint to check user status (DEVELOPMENT ONLY)
router.get('/debug-user/:email', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(404).json({ error: 'Not found' });
    }
    
    try {
        const { email } = req.params;
        
        // Check auth user
        const { data: authUser } = await authService.supabase.auth.admin.getUserByEmail(email);
        
        // Check profile
        let profile = null;
        if (authUser?.user) {
            const { data: profileData } = await authService.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', authUser.user.id)
                .single();
            profile = profileData;
        }
        
        // Check usage
        let usage = null;
        if (authUser?.user) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const { data: usageData } = await authService.supabase
                .from('user_usage')
                .select('*')
                .eq('user_id', authUser.user.id)
                .eq('month_year', currentMonth)
                .single();
            usage = usageData;
        }
        
        res.json({
            email,
            authUser: authUser?.user ? {
                id: authUser.user.id,
                email: authUser.user.email,
                created_at: authUser.user.created_at
            } : null,
            profile: profile,
            usage: usage
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;