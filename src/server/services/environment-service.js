// src/server/services/environment-service.js - Environment Detection Service
class EnvironmentService {
    constructor() {
        this.environment = this.detectEnvironment();
        console.log(`🌍 Environment detected: ${this.environment}`);
    }

    /**
     * Detect if we're running as web app or desktop app
     */
    detectEnvironment() {
        // Check for desktop-specific environment variables
        if (process.env.STUDYBUDDY_MODE === 'desktop') {
            return 'desktop';
        }

        // Check if we're running as an Electron app
        if (process.env.npm_config_user_config && process.env.npm_config_user_config.includes('electron')) {
            return 'desktop';
        }

        // Check for Electron-specific globals
        if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
            return 'desktop';
        }

        // Default to web
        return 'web';
    }

    /**
     * Get current environment
     */
    getEnvironment() {
        return this.environment;
    }

    /**
     * Check if we're running as a web app
     */
    isWeb() {
        return this.environment === 'web';
    }

    /**
     * Check if we're running as a desktop app
     */
    isDesktop() {
        return this.environment === 'desktop';
    }

    /**
     * Get appropriate AI service configuration
     */
    getAIServiceConfig() {
        if (this.isDesktop()) {
            return {
                primary: 'ollama',
                fallback: null, // Desktop should be offline-first
                capabilities: ['offline', 'local', 'privacy', 'unlimited']
            };
        } else {
            return {
                primary: 'openai',
                fallback: 'ollama', // Web can fallback to Ollama if available
                capabilities: ['fast', 'reliable', 'cloud', 'usage_limited']
            };
        }
    }

    /**
     * Get appropriate storage service configuration
     */
    getStorageServiceConfig() {
        if (this.isDesktop()) {
            return {
                primary: 'sqlite',
                fallback: null, // Desktop is fully offline
                syncEnabled: false, // Optional user-controlled sync
                dataLocation: 'local'
            };
        } else {
            return {
                primary: 'supabase',
                fallback: null, // Web uses Supabase only (no SQLite complexity)
                syncEnabled: true, // Always sync in web mode
                dataLocation: 'cloud'
            };
        }
    }

    /**
     * Get feature flags based on environment
     */
    getFeatureFlags() {
        const baseFeatures = {
            noteCreation: true,
            questionGeneration: true,
            practiceMode: true,
            fileUpload: true,
            analytics: true
        };

        if (this.isDesktop()) {
            return {
                ...baseFeatures,
                offlineMode: true,
                cloudSync: false, // Optional user setting
                subscriptionRequired: false, // Desktop can have pro features
                dataExport: true,
                ollamaIntegration: true,
                unlimitedQuestions: true // Desktop can be unlimited
            };
        } else {
            return {
                ...baseFeatures,
                offlineMode: false,
                cloudSync: true,
                subscriptionRequired: true, // Web enforces subscription
                dataExport: true,
                desktopDownload: true, // Web offers desktop download
                usageTracking: true
            };
        }
    }

    /**
     * Force environment (for testing)
     */
    setEnvironment(env) {
        if (env === 'web' || env === 'desktop') {
            this.environment = env;
            console.log(`🔄 Environment forced to: ${env}`);
        }
    }
}

// Export singleton
module.exports = new EnvironmentService();