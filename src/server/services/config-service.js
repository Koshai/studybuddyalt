// src/server/services/config-service.js - Centralized App Configuration Management
const fs = require('fs');
const path = require('path');

class ConfigService {
    constructor() {
        this.configPath = path.join(__dirname, '../../../config/app-config.json');
        this.config = null;
        this.watchers = [];
        this.lastLoaded = null;
        
        this.loadConfig();
        this.setupFileWatcher();
    }

    /**
     * Load configuration from JSON file
     */
    loadConfig() {
        try {
            const configData = fs.readFileSync(this.configPath, 'utf8');
            this.config = JSON.parse(configData);
            this.lastLoaded = new Date();
            
            console.log('✅ App configuration loaded successfully');
            console.log(`📊 Configured tiers: ${Object.keys(this.config.tiers).join(', ')}`);
            console.log(`💰 Ads enabled: ${this.config.monetization.adsEnabled}`);
            console.log(`🔧 Environment: ${this.config.app.environment}`);
            
            // Notify watchers of config change
            this.notifyWatchers();
            
        } catch (error) {
            console.error('❌ Failed to load app configuration:', error.message);
            
            // Use default configuration as fallback
            this.config = this.getDefaultConfig();
        }
    }

    /**
     * Watch for configuration file changes
     */
    setupFileWatcher() {
        if (fs.existsSync(this.configPath)) {
            fs.watchFile(this.configPath, (curr, prev) => {
                console.log('🔄 Configuration file changed, reloading...');
                this.loadConfig();
            });
        }
    }

    /**
     * Get the full configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Get tier configuration
     */
    getTier(tierName) {
        return this.config.tiers[tierName] || this.config.tiers.free;
    }

    /**
     * Get all available tiers
     */
    getAllTiers() {
        return { ...this.config.tiers };
    }

    /**
     * Get limits for a specific tier
     */
    getTierLimits(tierName) {
        const tier = this.getTier(tierName);
        return { ...tier.limits };
    }

    /**
     * Get features for a specific tier
     */
    getTierFeatures(tierName) {
        const tier = this.getTier(tierName);
        return { ...tier.features };
    }

    /**
     * Check if user has reached limit
     */
    hasReachedLimit(tierName, limitType, currentUsage) {
        const limits = this.getTierLimits(tierName);
        const limit = limits[limitType];
        
        // -1 means unlimited
        if (limit === -1) return false;
        
        return currentUsage >= limit;
    }

    /**
     * Get usage percentage for a limit
     */
    getUsagePercentage(tierName, limitType, currentUsage) {
        const limits = this.getTierLimits(tierName);
        const limit = limits[limitType];
        
        // -1 means unlimited
        if (limit === -1) return 0;
        
        return Math.min((currentUsage / limit) * 100, 100);
    }

    /**
     * Check if user should see upgrade prompt
     */
    shouldShowUpgradePrompt(tierName, actionCount = 0) {
        if (tierName !== 'free') return false;
        
        const promptConfig = this.config.monetization.upgradePrompts;
        if (!this.config.ui.showUpgradePrompts) return false;
        
        return actionCount > 0 && actionCount % promptConfig.showAfterActions === 0;
    }

    /**
     * Get ad configuration for tier
     */
    getAdConfig(tierName) {
        const tier = this.getTier(tierName);
        return {
            ...tier.ads,
            providers: this.config.monetization.adProviders,
            enabled: this.config.monetization.adsEnabled && tier.ads.enabled
        };
    }

    /**
     * Get monetization settings
     */
    getMonetizationConfig() {
        return { ...this.config.monetization };
    }

    /**
     * Get UI configuration
     */
    getUIConfig() {
        return { ...this.config.ui };
    }

    /**
     * Get app features
     */
    getAppFeatures() {
        return { ...this.config.app.features };
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(featureName) {
        const features = this.getAppFeatures();
        return features[featureName]?.enabled || false;
    }

    /**
     * Get notification configuration
     */
    getNotificationConfig() {
        return { ...this.config.notifications };
    }

    /**
     * Get maintenance status
     */
    getMaintenanceStatus() {
        return { ...this.config.maintenance };
    }

    /**
     * Update configuration (for admin use)
     */
    updateConfig(updates) {
        try {
            // Deep merge the updates
            this.config = this.deepMerge(this.config, updates);
            
            // Save to file
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            
            console.log('✅ Configuration updated successfully');
            this.lastLoaded = new Date();
            
            // Notify watchers
            this.notifyWatchers();
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Failed to update configuration:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Temporarily override limits (for testing/promotions)
     */
    setTemporaryLimits(tierName, limitOverrides, expiresIn = 3600000) {
        if (!this.temporaryOverrides) {
            this.temporaryOverrides = new Map();
        }
        
        const expiryTime = Date.now() + expiresIn;
        this.temporaryOverrides.set(tierName, {
            limits: limitOverrides,
            expires: expiryTime
        });
        
        console.log(`🔧 Temporary limits set for ${tierName} tier, expires in ${expiresIn / 1000}s`);
        
        // Auto-cleanup expired overrides
        setTimeout(() => {
            if (this.temporaryOverrides.has(tierName)) {
                this.temporaryOverrides.delete(tierName);
                console.log(`🧹 Expired temporary limits cleaned up for ${tierName}`);
            }
        }, expiresIn);
    }

    /**
     * Get effective limits (including temporary overrides)
     */
    getEffectiveLimits(tierName) {
        let limits = this.getTierLimits(tierName);
        
        // Apply temporary overrides if they exist and haven't expired
        if (this.temporaryOverrides && this.temporaryOverrides.has(tierName)) {
            const override = this.temporaryOverrides.get(tierName);
            
            if (Date.now() < override.expires) {
                limits = { ...limits, ...override.limits };
            } else {
                // Clean up expired override
                this.temporaryOverrides.delete(tierName);
            }
        }
        
        return limits;
    }

    /**
     * Add configuration watcher
     */
    addWatcher(callback) {
        this.watchers.push(callback);
    }

    /**
     * Remove configuration watcher
     */
    removeWatcher(callback) {
        const index = this.watchers.indexOf(callback);
        if (index > -1) {
            this.watchers.splice(index, 1);
        }
    }

    /**
     * Notify all watchers of configuration changes
     */
    notifyWatchers() {
        this.watchers.forEach(callback => {
            try {
                callback(this.config);
            } catch (error) {
                console.error('Error notifying config watcher:', error);
            }
        });
    }

    /**
     * Deep merge objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Get default configuration (fallback)
     */
    getDefaultConfig() {
        return {
            app: {
                name: "StudyBuddy",
                version: "1.0.0-beta",
                environment: "development"
            },
            tiers: {
                free: {
                    name: "Free",
                    limits: {
                        questionsPerMonth: 100,
                        topicsPerAccount: 3,
                        storagePerAccount: "50MB"
                    },
                    features: {
                        basicAI: true,
                        offlineMode: false
                    },
                    ads: { enabled: true }
                }
            },
            monetization: {
                adsEnabled: false,
                upgradePrompts: { frequency: "low" }
            },
            ui: {
                showBetaBadge: true,
                showUpgradePrompts: false
            }
        };
    }

    /**
     * Get configuration statistics
     */
    getStats() {
        return {
            lastLoaded: this.lastLoaded,
            tiersCount: Object.keys(this.config.tiers).length,
            featuresEnabled: Object.keys(this.config.app.features).filter(
                key => this.config.app.features[key].enabled
            ).length,
            watchers: this.watchers.length,
            temporaryOverrides: this.temporaryOverrides ? this.temporaryOverrides.size : 0
        };
    }
}

// Singleton instance
let configService = null;

module.exports = {
    ConfigService,
    getInstance: () => {
        if (!configService) {
            configService = new ConfigService();
        }
        return configService;
    }
};