// src/server/services/ai-service-selector.js - Smart AI Service Selection
const OpenAIService = require('./openai-service');
const SimplifiedOllamaService = require('./ollama-simplified');

class AIServiceSelector {
    constructor() {
        this.openaiService = null;
        this.ollamaService = new SimplifiedOllamaService();
        this.lastOpenAICheck = 0;
        this.openaiAvailable = false;
        this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
        
        console.log('🤖 AI Service Selector initialized - Ollama preferred, OpenAI fallback');
    }

    /**
     * Create OpenAI service instance for specific user tier
     */
    createOpenAIService(userTier = 'free') {
        try {
            return new OpenAIService(userTier);
        } catch (error) {
            console.error('❌ Failed to create OpenAI service:', error.message);
            return null;
        }
    }

    /**
     * Check if OpenAI is available and working
     */
    async checkOpenAIAvailability() {
        const now = Date.now();
        
        // Skip check if we checked recently
        if (now - this.lastOpenAICheck < this.checkInterval && this.lastOpenAICheck > 0) {
            return this.openaiAvailable;
        }

        this.lastOpenAICheck = now;

        try {
            // Check if API key is available
            if (!process.env.OPENAI_API_KEY) {
                console.log('⚠️ OpenAI API key not configured');
                this.openaiAvailable = false;
                return false;
            }

            // Create a test service instance
            const testService = this.createOpenAIService('free');
            if (!testService) {
                this.openaiAvailable = false;
                return false;
            }

            // Simple connectivity test - try to get models
            const response = await testService.client.models.list();
            
            if (response && response.data && response.data.length > 0) {
                console.log('✅ OpenAI service is available and responsive');
                this.openaiAvailable = true;
                return true;
            } else {
                console.log('⚠️ OpenAI responded but with no models');
                this.openaiAvailable = false;
                return false;
            }
        } catch (error) {
            console.log('❌ OpenAI service unavailable:', error.message);
            this.openaiAvailable = false;
            return false;
        }
    }

    /**
     * Check if Ollama is available and working
     */
    async checkOllamaAvailability() {
        try {
            // Simple connectivity test
            const models = await this.ollamaService.ollama.list();
            
            if (models && models.models && models.models.length > 0) {
                console.log('✅ Ollama service is available with models:', models.models.map(m => m.name).join(', '));
                return true;
            } else {
                console.log('⚠️ Ollama responded but no models available');
                return false;
            }
        } catch (error) {
            console.log('❌ Ollama service unavailable:', error.message);
            return false;
        }
    }

    /**
     * Get the best available AI service for question generation
     * Priority: Ollama (preferred) -> OpenAI (fallback) -> null
     */
    async getQuestionGenerationService(userTier = 'free') {
        console.log('🔍 Selecting best AI service for question generation...');

        // First preference: Ollama
        const ollamaAvailable = await this.checkOllamaAvailability();
        if (ollamaAvailable) {
            console.log('🎯 Selected: Ollama service (primary choice - local & private)');
            return {
                service: this.ollamaService,
                type: 'ollama',
                capabilities: ['offline', 'local', 'privacy', 'preferred']
            };
        }

        // Fallback: OpenAI
        const openaiAvailable = await this.checkOpenAIAvailability();
        if (openaiAvailable) {
            console.log('🎯 Selected: OpenAI service (fallback - Ollama unavailable)');
            return {
                service: this.createOpenAIService(userTier),
                type: 'openai',
                capabilities: ['high-quality', 'fast', 'reliable', 'fallback']
            };
        }

        // No service available
        console.error('❌ No AI services available for question generation');
        return null;
    }

    /**
     * Generate questions using the best available service
     */
    async generateQuestions(content, count, subjectCategory, topic, userTier = 'free') {
        const serviceInfo = await this.getQuestionGenerationService(userTier);
        
        if (!serviceInfo) {
            throw new Error('No AI services available. Please check your OpenAI configuration or ensure Ollama is running.');
        }

        console.log(`🤖 Generating ${count} questions using ${serviceInfo.type.toUpperCase()}`);
        
        try {
            const questions = await serviceInfo.service.generateQuestions(
                content, 
                count, 
                subjectCategory, 
                topic
            );

            console.log(`✅ Successfully generated ${questions.length} questions using ${serviceInfo.type.toUpperCase()}`);
            return questions;
        } catch (error) {
            console.error(`❌ ${serviceInfo.type.toUpperCase()} generation failed:`, error.message);
            
            // If Ollama failed, try OpenAI as emergency fallback
            if (serviceInfo.type === 'ollama') {
                console.log('🔄 Ollama failed, attempting OpenAI emergency fallback...');
                
                const openaiAvailable = await this.checkOpenAIAvailability();
                if (openaiAvailable) {
                    try {
                        const openaiService = this.createOpenAIService(userTier);
                        const fallbackQuestions = await openaiService.generateQuestions(
                            content, 
                            count, 
                            subjectCategory, 
                            topic
                        );
                        console.log(`✅ Emergency fallback successful: ${fallbackQuestions.length} questions from OpenAI`);
                        return fallbackQuestions;
                    } catch (fallbackError) {
                        console.error('❌ Emergency OpenAI fallback also failed:', fallbackError.message);
                    }
                }
            }
            
            throw error;
        }
    }

    /**
     * Get service status for health checks
     */
    async getServiceStatus() {
        const [openaiStatus, ollamaStatus] = await Promise.allSettled([
            this.checkOpenAIAvailability(),
            this.checkOllamaAvailability()
        ]);

        return {
            ollama: {
                available: ollamaStatus.status === 'fulfilled' && ollamaStatus.value,
                error: ollamaStatus.status === 'rejected' ? ollamaStatus.reason.message : null,
                preferred: true
            },
            openai: {
                available: openaiStatus.status === 'fulfilled' && openaiStatus.value,
                error: openaiStatus.status === 'rejected' ? openaiStatus.reason.message : null,
                fallback: true
            },
            activeService: null
        };
    }

    /**
     * Force refresh service availability checks
     */
    refreshServiceChecks() {
        this.lastOpenAICheck = 0;
        console.log('🔄 AI service availability checks reset');
    }
}

// Export singleton instance
module.exports = new AIServiceSelector();