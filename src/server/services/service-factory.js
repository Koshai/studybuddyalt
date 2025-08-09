// src/server/services/service-factory.js - Service Factory for Web vs Desktop
const EnvironmentService = require('./environment-service');

// AI Services
const OpenAIService = require('./openai-service');
const SimplifiedOllamaService = require('./ollama-simplified');

// Storage Services  
const WebStorageService = require('./web-storage-service');
const SimplifiedDatabaseService = require('./database-simplified');

// Auth Services
const AuthService = require('./auth-service');

class ServiceFactory {
    constructor() {
        this.environment = EnvironmentService.getEnvironment();
        this.services = {};
        
        console.log(`🏭 Service Factory initialized for ${this.environment} environment`);
    }

    /**
     * Get AI Service based on environment
     */
    getAIService(userTier = 'free') {
        if (EnvironmentService.isDesktop()) {
            // Desktop: Ollama-only for privacy and offline capability
            if (!this.services.ollamaService) {
                console.log('🤖 Creating desktop AI service: Ollama-only');
                this.services.ollamaService = new SimplifiedOllamaService();
            }
            return this.services.ollamaService;
        } else {
            // Web: OpenAI primary, Ollama fallback if available
            if (!this.services.openaiService) {
                console.log('🤖 Creating web AI service: OpenAI primary');
                this.services.openaiService = new OpenAIService(userTier);
            }
            return this.services.openaiService;
        }
    }

    /**
     * Get fallback AI service for web mode
     */
    async getFallbackAIService() {
        if (EnvironmentService.isWeb()) {
            try {
                if (!this.services.ollamaFallback) {
                    this.services.ollamaFallback = new SimplifiedOllamaService();
                }
                // Test if Ollama is available
                await this.services.ollamaFallback.ollama.list();
                return this.services.ollamaFallback;
            } catch (error) {
                console.log('⚠️ Ollama fallback not available:', error.message);
                return null;
            }
        }
        return null;
    }

    /**
     * Get Storage Service based on environment
     */
    getStorageService() {
        if (!this.services.storageService) {
            if (EnvironmentService.isDesktop()) {
                // Desktop: SQLite-only for offline capability
                console.log('💾 Creating desktop storage service: SQLite-only');
                this.services.storageService = new SimplifiedDatabaseService();
            } else {
                // Web: Supabase-only (no SQLite complexity)
                console.log('💾 Creating web storage service: Supabase-only');
                this.services.storageService = new WebStorageService();
            }
        }
        
        return this.services.storageService;
    }

    /**
     * Get Auth Service based on environment
     */
    getAuthService() {
        if (!this.services.authService) {
            if (EnvironmentService.isDesktop()) {
                // Desktop: Local auth with optional cloud linking
                console.log('🔐 Creating desktop auth service: Local + optional cloud');
                // For now, use the same auth service but we'll modify behavior
                this.services.authService = new AuthService();
            } else {
                // Web: Full Supabase auth
                console.log('🔐 Creating web auth service: Supabase auth');
                this.services.authService = new AuthService();
            }
        }
        
        return this.services.authService;
    }

    /**
     * Get all services configured for current environment
     */
    getAllServices() {
        return {
            ai: this.getAIService(),
            storage: this.getStorageService(),
            auth: this.getAuthService(),
            environment: EnvironmentService
        };
    }

    /**
     * Generate questions using appropriate AI service
     */
    async generateQuestions(content, count, subjectCategory, topic, userTier = 'free') {
        if (EnvironmentService.isDesktop()) {
            // Desktop: Use Ollama directly
            const aiService = this.getAIService(userTier);
            return await aiService.generateQuestions(content, count, subjectCategory, topic);
        } else {
            // Web: OpenAI primary, Ollama fallback
            try {
                const aiService = this.getAIService(userTier);
                return await aiService.generateQuestions(content, count, subjectCategory, topic);
            } catch (error) {
                console.log('🔄 OpenAI failed, trying Ollama fallback...');
                const fallbackService = await this.getFallbackAIService();
                if (fallbackService) {
                    return await fallbackService.generateQuestions(content, count, subjectCategory, topic);
                }
                throw error;
            }
        }
    }

    /**
     * Initialize database based on environment
     */
    async initializeDatabase() {
        const storage = this.getStorageService();
        
        if (typeof storage.init === 'function') {
            await storage.init();
            console.log(`✅ ${EnvironmentService.getEnvironment()} database initialized`);
        }
        
        return storage;
    }

    /**
     * Get service health status
     */
    async getServiceStatus() {
        const services = this.getAllServices();
        const status = {
            environment: EnvironmentService.getEnvironment(),
            services: {}
        };

        // Check AI service status
        try {
            if (EnvironmentService.isDesktop()) {
                // Check Ollama availability
                const models = await services.ai.ollama.list();
                status.services.ai = {
                    type: 'ollama',
                    available: true,
                    models: models.models?.length || 0
                };
            } else {
                // Check AI selector status
                const aiStatus = await services.ai.getServiceStatus();
                status.services.ai = aiStatus;
            }
        } catch (error) {
            status.services.ai = {
                available: false,
                error: error.message
            };
        }

        // Check storage service status
        try {
            if (EnvironmentService.isDesktop()) {
                // Check SQLite
                const dbConnected = await services.storage.testConnection();
                status.services.storage = {
                    type: 'sqlite',
                    available: dbConnected
                };
            } else {
                // Check hybrid storage
                status.services.storage = services.storage.getConnectionStatus();
            }
        } catch (error) {
            status.services.storage = {
                available: false,
                error: error.message
            };
        }

        return status;
    }
}

// Export singleton
module.exports = new ServiceFactory();