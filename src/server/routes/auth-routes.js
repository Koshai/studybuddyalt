// src/server/routes/auth-routes.js
const express = require('express');
const AuthService = require('../services/auth-service');
const authMiddleware = require('../middleware/auth-middleware');
const UsageService = require('../services/usage-service');
const LocalUserService = require('../services/local-user-service');
const AccountSyncService = require('../services/account-sync-service');

const router = express.Router();
const authService = new AuthService();
const usageService = new UsageService();
const localUserService = new LocalUserService();
const accountSyncService = new AccountSyncService();

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

// Manual email confirmation (with optional confirmation code)
router.post('/confirm-email', async (req, res) => {
    try {
        const { email, confirmationCode } = req.body;
        
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is required'
            });
        }
        
        console.log('🔄 Email confirmation request:', email, confirmationCode ? 'with code' : 'manual');
        
        const result = await authService.confirmEmail(email, confirmationCode);
        
        res.json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        console.error('❌ Email confirmation failed:', error.message);
        
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

// Generate new confirmation code
router.post('/generate-confirmation-code', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is required'
            });
        }
        
        console.log('🔄 Generate confirmation code request:', email);
        
        const result = await authService.generateConfirmationCode(email);
        
        res.json({
            status: 'success',
            message: result.message,
            confirmationCode: result.confirmationCode
        });
    } catch (error) {
        console.error('❌ Generate confirmation code failed:', error.message);
        
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

// Resend confirmation email (legacy - kept for compatibility)
router.post('/resend-confirmation', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is required'
            });
        }
        
        console.log('🔄 Resend confirmation request:', email);
        
        const result = await authService.resendConfirmation(email);
        
        res.json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        console.error('❌ Resend confirmation failed:', error.message);
        
        res.status(400).json({
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

// ===============================
// LOCAL/OFFLINE AUTHENTICATION
// ===============================

// Initialize local user system
router.post('/local/init', async (req, res) => {
    try {
        await localUserService.initialize();
        const users = await localUserService.listLocalUsers();
        
        res.json({
            status: 'success',
            message: 'Local user system initialized',
            userCount: users.length,
            initialized: true
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Register local user
router.post('/local/register', async (req, res) => {
    try {
        const { email, firstName, lastName, password } = req.body;
        
        if (!email || !firstName || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email, first name, and password are required'
            });
        }
        
        console.log('🔄 Local registration attempt:', email);
        
        const result = await localUserService.createLocalUser(email, firstName, lastName, password);
        
        if (result.success) {
            console.log('✅ Local registration successful:', email);
            res.status(201).json({
                status: 'success',
                message: 'Local user created successfully',
                user: {
                    id: result.userId,
                    email: result.userProfile.email,
                    firstName: result.userProfile.firstName,
                    lastName: result.userProfile.lastName
                }
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('❌ Local registration failed:', error.message);
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
});

// Login local user
router.post('/local/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required'
            });
        }
        
        console.log('🔄 Local login attempt:', email);
        
        const result = await localUserService.authenticateLocalUser(email, password);
        
        if (result.success) {
            console.log('✅ Local login successful:', email);
            
            // Generate simple session token for local mode
            const sessionToken = require('crypto').randomUUID();
            
            res.json({
                status: 'success',
                message: 'Login successful',
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    isLocalMode: true
                },
                tokens: {
                    access_token: sessionToken,
                    refresh_token: sessionToken,
                    expires_in: 86400 // 24 hours
                }
            });
        } else {
            res.status(401).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        console.error('❌ Local login failed:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// List local users
router.get('/local/users', async (req, res) => {
    try {
        const users = await localUserService.listLocalUsers();
        
        res.json({
            status: 'success',
            users: users.map(user => ({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                lastLogin: user.lastLogin
            }))
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get current local user profile
router.get('/local/profile', async (req, res) => {
    try {
        const currentUser = localUserService.getCurrentUser();
        
        if (!currentUser) {
            return res.status(401).json({
                status: 'error',
                message: 'No local user logged in'
            });
        }
        
        // Get user statistics
        const stats = await localUserService.getUserStats(currentUser.id);
        
        res.json({
            status: 'success',
            user: {
                id: currentUser.id,
                email: currentUser.email,
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                isLocalMode: true,
                createdAt: currentUser.createdAt,
                lastLogin: currentUser.lastLogin
            },
            statistics: stats
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Export local user data
router.get('/local/export/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const exportPath = require('path').join(require('os').tmpdir(), `studybuddy-export-${timestamp}.json`);
        
        const result = await localUserService.exportUserData(userId, exportPath);
        
        if (result.success) {
            res.download(exportPath, `studybuddy-export-${timestamp}.json`, (err) => {
                if (!err) {
                    // Clean up temp file
                    require('fs').unlinkSync(exportPath);
                }
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Logout local user
router.post('/local/logout', async (req, res) => {
    try {
        localUserService.logout();
        
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

// ===============================
// ACCOUNT SYNC FUNCTIONALITY
// ===============================

// Check account sync status
router.get('/sync/status/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        await accountSyncService.initialize();
        const accountStatus = await accountSyncService.findAccountLinks(email);
        
        res.json({
            status: 'success',
            email,
            ...accountStatus,
            syncInProgress: accountSyncService.isSyncInProgress()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Auto-sync user accounts
router.post('/sync/auto', async (req, res) => {
    try {
        const { email, mode = 'bidirectional' } = req.body;
        
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is required'
            });
        }
        
        console.log(`🔄 Auto-sync request for ${email} (${mode})`);
        
        await accountSyncService.initialize();
        const result = await accountSyncService.autoSync(email, mode);
        
        if (result.success) {
            res.json({
                status: 'success',
                message: result.message,
                actions: result.actions
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error || result.message
            });
        }
    } catch (error) {
        console.error('❌ Auto-sync failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Sync cloud user to local (for offline use)
router.post('/sync/cloud-to-local', async (req, res) => {
    try {
        const { cloudUserId, cloudUserData } = req.body;
        
        if (!cloudUserId || !cloudUserData) {
            return res.status(400).json({
                status: 'error',
                message: 'Cloud user ID and data are required'
            });
        }
        
        console.log(`🔄 Syncing cloud user to local: ${cloudUserData.email}`);
        
        await accountSyncService.initialize();
        const result = await accountSyncService.syncCloudUserToLocal(cloudUserId, cloudUserData);
        
        if (result.success) {
            res.json({
                status: 'success',
                message: result.message,
                localUserId: result.localUserId
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        console.error('❌ Cloud to local sync failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Sync local user to cloud (for cross-device access)
router.post('/sync/local-to-cloud', async (req, res) => {
    try {
        const { localUserId } = req.body;
        
        if (!localUserId) {
            return res.status(400).json({
                status: 'error',
                message: 'Local user ID is required'
            });
        }
        
        console.log(`🔄 Syncing local user to cloud: ${localUserId}`);
        
        await accountSyncService.initialize();
        const result = await accountSyncService.syncLocalUserToCloud(localUserId);
        
        if (result.success) {
            res.json({
                status: 'success',
                message: result.message,
                cloudUserId: result.cloudUserId
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        console.error('❌ Local to cloud sync failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get sync log
router.get('/sync/log', async (req, res) => {
    try {
        const syncLog = accountSyncService.getSyncLog();
        
        res.json({
            status: 'success',
            syncLog,
            syncInProgress: accountSyncService.isSyncInProgress()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;