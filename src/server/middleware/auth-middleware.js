// src/server/middleware/auth-middleware.js
const AuthService = require('../services/auth-service');

class AuthMiddleware {
    constructor() {
        this.authService = new AuthService();
    }

    authenticateToken = async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

            if (!token) {
                return res.status(401).json({ error: 'Access token required' });
            }

            const decoded = await this.authService.verifyToken(token);
            const userProfile = await this.authService.getUserProfile(decoded.userId);

            req.user = userProfile;
            next();

        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
    };

    requireSubscription = (requiredTier) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const tierLevels = { free: 1, pro: 2 };
            const userLevel = tierLevels[req.user.subscriptionTier] || 0;
            const requiredLevel = tierLevels[requiredTier] || 0;

            if (userLevel < requiredLevel) {
                return res.status(403).json({ 
                    error: 'Subscription upgrade required',
                    requiredTier,
                    currentTier: req.user.subscriptionTier
                });
            }

            next();
        };
    };

    optionalAuth = async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (token) {
                const decoded = await this.authService.verifyToken(token);
                const userProfile = await this.authService.getUserProfile(decoded.userId);
                req.user = userProfile;
            }

            next();

        } catch (error) {
            // For optional auth, we continue without user if token is invalid
            next();
        }
    };

    requireAdmin = (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // For now, check if user email is in admin list or has admin role
        // In production, you'd have a proper admin role system
        const adminEmails = [
            'admin@studybuddy.com',
            'syed.r.akbar@gmail.com' // Your email for testing
        ];

        const isAdmin = adminEmails.includes(req.user.email) || req.user.role === 'admin';

        if (!isAdmin) {
            return res.status(403).json({ 
                error: 'Admin access required',
                message: 'This endpoint requires administrator privileges'
            });
        }

        next();
    };
}

module.exports = new AuthMiddleware();