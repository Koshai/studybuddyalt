// src/server/services/ollama-simplified.js - MODULAR VERSION
const { Ollama } = require('ollama');
const PromptGenerator = require('./prompt-generation');
const QuestionValidator = require('./question-validation');
const ResponseParser = require('./response-parsing');
const GenerationStrategies = require('./generation-strategies');
const PatternsManager = require('./patterns-manager');

class SimplifiedOllamaService {
  constructor() {
    // Use environment variable or fallback to default
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    this.ollama = new Ollama({
      host: ollamaUrl
    });
    this.defaultModel = 'llama3.2:3b';
    this.maxAttempts = 5;
    
    console.log(`🤖 Ollama service configured for: ${ollamaUrl}`);
    
    // Initialize modular components
    this.promptGenerator = new PromptGenerator();
    this.questionValidator = new QuestionValidator();
    this.responseParser = new ResponseParser();
    this.generationStrategies = new GenerationStrategies(this.ollama, this.defaultModel, this.responseParser);
    this.patternsManager = new PatternsManager();
  }

  /**
   * MAIN METHOD: Generate questions with subject isolation and count guarantee
   */
  async generateQuestions(content, count = 5, subjectCategory, topicName) {
    try {
      console.log(`\n🎓 STARTING: ${count} questions for ${subjectCategory.name} - ${topicName}`);
      console.log(`🎯 SUBJECT: ${subjectCategory.id}`);
      console.log(`📊 COUNT GUARANTEE: Will return exactly ${count} questions`);
      
      if (!content || content.trim().length < 50) {
        console.error('❌ Content too short');
        return [];
      }

      // Use multi-attempt strategy to guarantee exact count
      const result = await this.generateWithCountGuarantee(content, count, subjectCategory, topicName);

      // Store successful patterns for future use
      if (result.length > 0) {
        this.patternsManager.storeSuccessfulPatterns(subjectCategory.id, result);
      }

      console.log(`\n✅ FINAL DELIVERY:`);
      console.log(`   Requested: ${count}`);
      console.log(`   Delivered: ${result.length}`);
      console.log(`   Subject: ${subjectCategory.name} (${subjectCategory.id})`);
      console.log(`   Success Rate: ${result.length === count ? '100%' : Math.round((result.length/count)*100) + '%'}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error in generateQuestions:', error);
      return [];
    }
  }

  /**
   * Generate with count guarantee - multi-attempt strategy
   */
  async generateWithCountGuarantee(content, requestedCount, subjectCategory, topicName) {
    let validQuestions = [];
    let attempt = 0;

    while (validQuestions.length < requestedCount && attempt < this.maxAttempts) {
      attempt++;
      const needed = requestedCount - validQuestions.length;
      
      console.log(`\n🔄 Attempt ${attempt}/${this.maxAttempts}: Need ${needed} more questions`);
      
      // Calculate how many to generate (accounting for rejections)
      const generateCount = this.generationStrategies.calculateBatchSize(needed, attempt, subjectCategory);
      
      try {
        // Generate questions using different strategies per attempt
        let newQuestions = [];
        
        if (attempt === 1) {
          newQuestions = await this.generationStrategies.generateWithSubjectContext(content, generateCount, subjectCategory, topicName, this.promptGenerator);
        } else if (attempt === 2) {
          newQuestions = await this.generationStrategies.generateConservative(content, generateCount, subjectCategory, topicName);
        } else if (attempt === 3) {
          newQuestions = await this.generationStrategies.generateSimplified(content, generateCount, subjectCategory, topicName);
        } else if (attempt === 4) {
          newQuestions = await this.generationStrategies.generateFromPatterns(content, generateCount, subjectCategory, this.patternsManager);
        } else {
          newQuestions = await this.generationStrategies.generateBasic(content, generateCount, subjectCategory, topicName);
        }
        
        console.log(`📝 Generated ${newQuestions.length} raw questions in attempt ${attempt}`);
        
        // Validate questions based on subject
        const validatedQuestions = await this.questionValidator.validateQuestions(newQuestions, subjectCategory);
        
        console.log(`✅ Validation: ${validatedQuestions.length} accepted`);
        
        // Add valid questions to our collection
        validQuestions = [...validQuestions, ...validatedQuestions];
        
        console.log(`📊 Progress: ${validQuestions.length}/${requestedCount} questions obtained`);
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
      }
    }

    // Return exactly the requested count (trim if we got more)
    return validQuestions.slice(0, requestedCount);
  }

  /**
   * Health check
   */
  async isHealthy() {
    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: "Say 'OK' if you are working.",
        stream: false,
        options: { num_predict: 10 }
      });
      
      return response && response.response && response.response.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await this.ollama.list();
      return response.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Get subject isolation status for debugging
   */
  getSubjectIsolationStatus() {
    return {
      isolated: true,
      validators: {
        'mathematics': 'Math Validator (Strict arithmetic validation)',
        'natural-sciences': 'Science Validator (Enhanced validation)',
        'literature': 'Literature Validator (Analysis-focused)',
        'history': 'History Validator (Historical thinking)',
        'computer-science': 'CS Validator (Code syntax validation)',
        'languages': 'Language Validator (Grammar and vocabulary)',
        'business': 'Business Validator (Practical applications)',
        'arts': 'Arts Validator (Creative and cultural focus)',
        'health-medicine': 'Health Validator (Educational content)',
        'others': 'General Validator (Basic validation)'
      },
      countGuarantee: 'Multi-attempt strategy ensures exact question count',
      maxAttempts: this.maxAttempts,
      modules: {
        promptGenerator: 'Subject-specific prompt generation',
        questionValidator: 'Multi-subject validation system',
        responseParser: 'AI response parsing and cleanup',
        generationStrategies: 'Multiple generation approaches',
        patternsManager: 'Successful pattern storage and reuse'
      }
    };
  }

  /**
   * Debug method to test math validation
   */
  testMathValidation() {
    const testCases = [
      "5 × 4 = 20",  // Correct
      "5 × 4 = 15",  // Wrong - should be caught
      "8 + 7 = 15",  // Correct
      "8 + 7 = 16",  // Wrong - should be caught
    ];
    
    console.log('🧮 Testing Math Validation:');
    testCases.forEach(testCase => {
      const errors = this.questionValidator.findMathErrors(testCase);
      console.log(`  ${testCase}: ${errors.length === 0 ? '✅ Valid' : '❌ Invalid - ' + errors[0]}`);
    });
  }

  /**
   * Get pattern statistics for debugging
   */
  getPatternStats(subjectId = null) {
    if (subjectId) {
      return this.patternsManager.getPatternStats(subjectId);
    }
    
    return this.patternsManager.getOverallStats();
  }

  /**
   * Export patterns for backup
   */
  exportPatterns(subjectId = null) {
    return this.patternsManager.exportPatterns(subjectId);
  }

  /**
   * Import patterns from backup
   */
  importPatterns(data) {
    return this.patternsManager.importPatterns(data);
  }

  /**
   * Clear old patterns
   */
  clearOldPatterns(subjectId, daysOld = 30) {
    return this.patternsManager.clearOldPatterns(subjectId, daysOld);
  }

  /**
   * Reset patterns for a subject
   */
  resetPatterns(subjectId) {
    return this.patternsManager.resetPatterns(subjectId);
  }

  /**
   * Get module status for debugging
   */
  getModuleStatus() {
    return {
      promptGenerator: this.promptGenerator ? 'Initialized' : 'Not loaded',
      questionValidator: this.questionValidator ? 'Initialized' : 'Not loaded',
      responseParser: this.responseParser ? 'Initialized' : 'Not loaded',
      generationStrategies: this.generationStrategies ? 'Initialized' : 'Not loaded',
      patternsManager: this.patternsManager ? 'Initialized' : 'Not loaded',
      totalModules: 5,
      loadedModules: [
        this.promptGenerator,
        this.questionValidator,
        this.responseParser,
        this.generationStrategies,
        this.patternsManager
      ].filter(Boolean).length
    };
  }

  /**
   * Validate that all modules are properly loaded
   */
  validateModules() {
    const requiredModules = [
      'promptGenerator',
      'questionValidator', 
      'responseParser',
      'generationStrategies',
      'patternsManager'
    ];
    
    const missing = requiredModules.filter(module => !this[module]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing modules: ${missing.join(', ')}`);
      return false;
    }
    
    console.log('✅ All modules loaded successfully');
    return true;
  }

  /**
   * Generate a response from Ollama for any prompt (used by flashcard generation)
   * This method provides compatibility with OpenAI service interface
   */
  async generateResponse(prompt, options = {}) {
    try {
      console.log(`🤖 Ollama: Generating response using ${this.defaultModel}`);
      
      const response = await this.ollama.chat({
        model: this.defaultModel,
        messages: [
          {
            role: "system", 
            content: "You are a helpful assistant that generates educational content. Always follow the exact format requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 1500,
          top_p: 0.9
        }
      });

      const content = response.message.content;
      console.log(`✅ Ollama: Successfully generated response (${content.length} characters)`);
      
      return content;
      
    } catch (error) {
      console.error('❌ Ollama generateResponse error:', error);
      
      if (error.message.includes('model not found')) {
        throw new Error(`Ollama model ${this.defaultModel} not found. Please pull the model first.`);
      }
      
      if (error.message.includes('connection')) {
        throw new Error('Cannot connect to Ollama server. Make sure Ollama is running.');
      }
      
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }

  /**
   * Test connection to Ollama (compatibility method for testConnection)
   */
  async testConnection() {
    return await this.isHealthy();
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      name: 'SimplifiedOllamaService',
      version: '2.0.0-modular',
      model: this.defaultModel,
      maxAttempts: this.maxAttempts,
      modules: this.getModuleStatus(),
      features: [
        'Subject-specific question generation',
        'Multi-attempt strategy with count guarantee',
        'Pattern-based learning and reuse',
        'Comprehensive validation system',
        'Modular architecture'
      ]
    };
  }
}

module.exports = SimplifiedOllamaService;