// src/server/routes/config-routes.js - Configuration Management API
const express = require('express');
const { getInstance: getConfigService } = require('../services/config-service');
const authMiddleware = require('../middleware/auth-middleware');

const router = express.Router();
const configService = getConfigService();

// Public configuration (safe for frontend)
router.get('/public', async (req, res) => {
    try {
        const config = configService.getConfig();
        
        // Return only safe/public configuration
        const publicConfig = {
            app: {
                name: config.app.name,
                version: config.app.version,
                environment: config.app.environment
            },
            tiers: Object.keys(config.tiers).reduce((acc, tierName) => {
                const tier = config.tiers[tierName];
                acc[tierName] = {
                    name: tier.name,
                    price: tier.price,
                    currency: tier.currency,
                    interval: tier.interval,
                    limits: tier.limits,
                    features: Object.keys(tier.features).reduce((featureAcc, featureName) => {
                        // Only expose feature availability, not internal details
                        featureAcc[featureName] = tier.features[featureName];
                        return featureAcc;
                    }, {})
                };
                return acc;
            }, {}),
            ui: {
                showBetaBadge: config.ui.showBetaBadge,
                showUsageLimits: config.ui.showUsageLimits,
                showUpgradePrompts: config.ui.showUpgradePrompts,
                theme: config.ui.theme,
                animations: config.ui.animations
            },
            features: Object.keys(config.app.features).reduce((acc, featureName) => {
                const feature = config.app.features[featureName];
                acc[featureName] = {
                    enabled: feature.enabled,
                    status: feature.status
                };
                return acc;
            }, {}),
            notifications: config.notifications
        };
        
        res.json({
            status: 'success',
            config: publicConfig,
            lastUpdated: configService.lastLoaded
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get tier information
router.get('/tiers', async (req, res) => {
    try {
        const tiers = configService.getAllTiers();
        
        // Remove sensitive information
        const publicTiers = Object.keys(tiers).reduce((acc, tierName) => {
            acc[tierName] = {
                name: tiers[tierName].name,
                price: tiers[tierName].price,
                currency: tiers[tierName].currency,
                interval: tiers[tierName].interval,
                limits: tiers[tierName].limits,
                features: tiers[tierName].features,
                ads: {
                    enabled: tiers[tierName].ads.enabled,
                    frequency: tiers[tierName].ads.frequency
                }
            };
            return acc;
        }, {});
        
        res.json({
            status: 'success',
            tiers: publicTiers
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get specific tier limits
router.get('/tiers/:tierName/limits', async (req, res) => {
    try {
        const { tierName } = req.params;
        const limits = configService.getEffectiveLimits(tierName);
        
        res.json({
            status: 'success',
            tier: tierName,
            limits: limits
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get user's effective configuration
router.get('/user/:userId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // In a real app, you'd get the user's tier from database
        // For now, assume from query parameter or default to free
        const userTier = req.query.tier || req.user?.subscription_tier || 'free';
        
        const tierLimits = configService.getEffectiveLimits(userTier);
        const tierFeatures = configService.getTierFeatures(userTier);
        const adConfig = configService.getAdConfig(userTier);
        const uiConfig = configService.getUIConfig();
        
        res.json({
            status: 'success',
            userId: userId,
            tier: userTier,
            limits: tierLimits,
            features: tierFeatures,
            ads: adConfig,
            ui: uiConfig,
            notifications: configService.getNotificationConfig()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Check if user should see upgrade prompt
router.get('/upgrade-prompt/:userId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const userTier = req.query.tier || 'free';
        const actionCount = parseInt(req.query.actionCount) || 0;
        
        const shouldShow = configService.shouldShowUpgradePrompt(userTier, actionCount);
        const monetizationConfig = configService.getMonetizationConfig();
        
        res.json({
            status: 'success',
            shouldShow: shouldShow,
            actionCount: actionCount,
            upgradePrompts: monetizationConfig.upgradePrompts,
            trialPeriod: monetizationConfig.trialPeriod
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get feature status
router.get('/features', async (req, res) => {
    try {
        const features = configService.getAppFeatures();
        
        res.json({
            status: 'success',
            features: features
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Check specific feature
router.get('/features/:featureName', async (req, res) => {
    try {
        const { featureName } = req.params;
        const isEnabled = configService.isFeatureEnabled(featureName);
        
        res.json({
            status: 'success',
            feature: featureName,
            enabled: isEnabled
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Admin endpoints (require admin authentication)
router.put('/admin/update', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const updates = req.body;
        const result = configService.updateConfig(updates);
        
        if (result.success) {
            res.json({
                status: 'success',
                message: 'Configuration updated successfully'
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Set temporary limits (for promotions/testing)
router.post('/admin/temporary-limits', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const { tierName, limitOverrides, expiresIn = 3600000 } = req.body;
        
        configService.setTemporaryLimits(tierName, limitOverrides, expiresIn);
        
        res.json({
            status: 'success',
            message: `Temporary limits set for ${tierName} tier`,
            expiresIn: expiresIn
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get configuration statistics
router.get('/admin/stats', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const stats = configService.getStats();
        
        res.json({
            status: 'success',
            stats: stats
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get full configuration (admin only)
router.get('/admin/full', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
    try {
        const config = configService.getConfig();
        
        res.json({
            status: 'success',
            config: config
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;