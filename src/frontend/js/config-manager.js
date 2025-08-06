// src/frontend/js/config-manager.js - Frontend Configuration Manager
class ConfigManager {
    constructor() {
        this.config = null;
        this.userConfig = null;
        this.lastFetched = null;
        this.cache = new Map();
        
        // Load initial config
        this.loadConfig();
    }

    /**
     * Load public configuration from server
     */
    async loadConfig() {
        try {
            const response = await fetch('/api/config/public');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.config = data.config;
                this.lastFetched = new Date();
                
                console.log('✅ Configuration loaded:', this.config.app.name, this.config.app.version);
                
                // Trigger config loaded event
                this.triggerConfigLoaded();
            }
        } catch (error) {
            console.error('❌ Failed to load configuration:', error);
            
            // Use fallback configuration
            this.config = this.getFallbackConfig();
        }
    }

    /**
     * Load user-specific configuration
     */
    async loadUserConfig(userId, userTier = 'free') {
        try {
            const response = await fetch(`/api/config/user/${userId}?tier=${userTier}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.userConfig = data;
                console.log(`✅ User configuration loaded for ${userTier} tier`);
            }
        } catch (error) {
            console.error('❌ Failed to load user configuration:', error);
        }
    }

    /**
     * Get tier information
     */
    getTiers() {
        return this.config?.tiers || {};
    }

    /**
     * Get specific tier configuration
     */
    getTier(tierName) {
        return this.config?.tiers?.[tierName] || this.config?.tiers?.free;
    }

    /**
     * Get tier limits
     */
    getTierLimits(tierName) {
        const tier = this.getTier(tierName);
        return tier?.limits || {};
    }

    /**
     * Get tier features
     */
    getTierFeatures(tierName) {
        const tier = this.getTier(tierName);
        return tier?.features || {};
    }

    /**
     * Get user's effective limits
     */
    getUserLimits() {
        return this.userConfig?.limits || this.getTierLimits('free');
    }

    /**
     * Get user's effective features
     */
    getUserFeatures() {
        return this.userConfig?.features || this.getTierFeatures('free');
    }

    /**
     * Check if user has feature
     */
    hasFeature(featureName) {
        const features = this.getUserFeatures();
        return features[featureName] === true;
    }

    /**
     * Get usage limit for specific type
     */
    getLimit(limitType) {
        const limits = this.getUserLimits();
        return limits[limitType] || 0;
    }

    /**
     * Check if feature is enabled globally
     */
    isFeatureEnabled(featureName) {
        return this.config?.features?.[featureName]?.enabled || false;
    }

    /**
     * Get feature status
     */
    getFeatureStatus(featureName) {
        return this.config?.features?.[featureName]?.status || 'stable';
    }

    /**
     * Get ad configuration
     */
    getAdConfig() {
        return this.userConfig?.ads || { enabled: false };
    }

    /**
     * Should show upgrade prompt
     */
    async shouldShowUpgradePrompt(actionCount = 0) {
        try {
            const userId = this.getCurrentUserId();
            const userTier = this.getCurrentUserTier();
            
            const response = await fetch(`/api/config/upgrade-prompt/${userId}?tier=${userTier}&actionCount=${actionCount}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            const data = await response.json();
            return data.shouldShow === true;
            
        } catch (error) {
            console.error('Failed to check upgrade prompt:', error);
            return false;
        }
    }

    /**
     * Get full configuration
     */
    getConfig() {
        return this.config;
    }

    /**
     * Get UI configuration
     */
    getUIConfig() {
        return this.config?.ui || {};
    }

    /**
     * Get notification configuration
     */
    getNotificationConfig() {
        return this.config?.notifications || {};
    }

    /**
     * Get app information
     */
    getAppInfo() {
        return this.config?.app || { name: 'StudyBuddy', version: '1.0.0' };
    }

    /**
     * Format limits for display
     */
    formatLimit(value, type = 'number') {
        if (value === -1) return 'Unlimited';
        
        switch (type) {
            case 'storage':
                if (typeof value === 'string') return value;
                const gb = value / (1024 * 1024 * 1024);
                const mb = value / (1024 * 1024);
                return gb >= 1 ? `${gb}GB` : `${mb}MB`;
            case 'number':
            default:
                return value.toLocaleString();
        }
    }

    /**
     * Get formatted tier comparison
     */
    getTierComparison() {
        const tiers = this.getTiers();
        const comparison = {};
        
        Object.keys(tiers).forEach(tierName => {
            const tier = tiers[tierName];
            comparison[tierName] = {
                name: tier.name,
                price: tier.price || 0,
                currency: tier.currency || 'USD',
                limits: {
                    questions: this.formatLimit(tier.limits.questionsPerMonth),
                    topics: this.formatLimit(tier.limits.topicsPerAccount),
                    storage: this.formatLimit(tier.limits.storagePerAccount, 'storage')
                },
                features: tier.features,
                ads: !tier.ads.enabled
            };
        });
        
        return comparison;
    }

    /**
     * Helper methods
     */
    getCurrentUserId() {
        return window.store?.state?.user?.id || null;
    }

    getCurrentUserTier() {
        return window.store?.state?.subscriptionTier || 'free';
    }

    /**
     * Trigger config loaded event
     */
    triggerConfigLoaded() {
        const event = new CustomEvent('configLoaded', { 
            detail: { config: this.config } 
        });
        window.dispatchEvent(event);
    }

    /**
     * Get fallback configuration
     */
    getFallbackConfig() {
        return {
            app: {
                name: 'StudyBuddy',
                version: '1.0.0-beta',
                environment: 'development'
            },
            tiers: {
                free: {
                    name: 'Free',
                    price: 0,
                    limits: {
                        questionsPerMonth: 100,
                        topicsPerAccount: 3,
                        storagePerAccount: '50MB'
                    },
                    features: {
                        basicAI: true,
                        offlineMode: false
                    },
                    ads: { enabled: true }
                }
            },
            ui: {
                showBetaBadge: true,
                showUpgradePrompts: false
            },
            features: {
                offlineMode: { enabled: true, status: 'alpha' }
            }
        };
    }

    /**
     * Refresh configuration
     */
    async refresh() {
        await this.loadConfig();
        
        const userId = this.getCurrentUserId();
        const userTier = this.getCurrentUserTier();
        
        if (userId) {
            await this.loadUserConfig(userId, userTier);
        }
    }

    /**
     * Get configuration stats
     */
    getStats() {
        return {
            lastFetched: this.lastFetched,
            hasConfig: !!this.config,
            hasUserConfig: !!this.userConfig,
            tiersCount: Object.keys(this.getTiers()).length
        };
    }
}

// Create singleton instance
window.configManager = new ConfigManager();

console.log('✅ Configuration manager initialized');

// Auto-refresh config when user logs in
window.addEventListener('userLoggedIn', (event) => {
    const user = event.detail.user;
    window.configManager.loadUserConfig(user.id, user.subscription_tier || 'free');
});

// Auto-refresh config periodically (every 5 minutes)
setInterval(() => {
    window.configManager.refresh();
}, 5 * 60 * 1000);