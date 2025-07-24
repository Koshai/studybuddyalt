// src/server/services/ollama.js - UPDATED WITH DOMAIN AWARENESS
const { Ollama } = require('ollama');
const ContentScopeAnalyzer = require('./ai/analyzers/scope');
const DomainPromptGenerator = require('./ai/prompts');
const DomainValidatorManager = require('./ai/validators');

class OllamaService {
  constructor() {
    this.ollama = new Ollama({
      host: 'http://localhost:11434'
    });
    this.defaultModel = 'llama3.2:3b';
    
    // Initialize modular components
    this.scopeAnalyzer = new ContentScopeAnalyzer(this.ollama);
    this.promptGenerator = new DomainPromptGenerator();
    this.validatorManager = new DomainValidatorManager();
  }

  async listModels() {
    try {
      const response = await this.ollama.list();
      return response.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  async pullModel(model) {
    try {
      const response = await this.ollama.pull({ model });
      return response;
    } catch (error) {
      console.error('Error pulling model:', error);
      throw error;
    }
  }

  /**
   * Enhanced domain-aware question generation
   */
  async generateQuestions(content, count = 5, difficulty = 'medium', subject = null, topic = null) {
    try {
      console.log(`🤖 Generating ${count} ${difficulty} questions`);
      console.log(`📚 Subject: ${subject?.name || 'Unknown'}, Topic: ${topic?.name || 'Unknown'}`);
      
      // Check if content is sufficient
      if (!this.scopeAnalyzer.isContentSufficient(content)) {
        console.error('❌ Content insufficient for question generation');
        return [];
      }

      // STEP 1: Analyze content scope and detect domain
      const contentScope = await this.analyzeContentWithDomainDetection(content, subject, topic);
      console.log(`🎯 Domain: ${contentScope.subjectDomain}, Level: ${contentScope.educationalLevel}`);
      
      // STEP 2: Generate domain-specific questions
      const questions = await this.generateDomainSpecificQuestions(content, count, difficulty, contentScope);
      
      // STEP 3: Validate questions
      const validatedQuestions = await this.validateQuestions(questions, contentScope);
      
      if (validatedQuestions.length > 0) {
        console.log(`✅ Generated ${validatedQuestions.length} validated questions`);
        return validatedQuestions;
      }
      
      console.error('❌ No valid questions generated');
      return [];
      
    } catch (error) {
      console.error('❌ Error in generateQuestions:', error);
      return [];
    }
  }

  /**
   * Analyze content with domain detection
   */
  async analyzeContentWithDomainDetection(content, subject, topic) {
    try {
      // Get basic scope analysis
      const basicScope = await this.scopeAnalyzer.analyzeScope(content, subject, topic);
      
      // Enhanced domain detection
      const detectedDomain = this.detectDomain(content, subject, topic);
      
      // Merge analyses
      const enhancedScope = {
        ...basicScope,
        subjectDomain: detectedDomain,
      };
      
      console.log('📊 Content Analysis:', {
        domain: enhancedScope.subjectDomain,
        level: enhancedScope.educationalLevel,
        concepts: enhancedScope.conceptsTaught?.slice(0, 3),
        operations: enhancedScope.operationsShown
      });
      
      return enhancedScope;
      
    } catch (error) {
      console.error('❌ Error in content analysis:', error);
      return this.getDefaultScope(subject, topic);
    }
  }

  /**
   * Simple domain detection
   */
  detectDomain(content, subject, topic) {
    const contentLower = content.toLowerCase();
    const subjectName = (subject?.name || '').toLowerCase();
    const topicName = (topic?.name || '').toLowerCase();
    const allText = `${contentLower} ${subjectName} ${topicName}`;
    
    // Check for mathematics indicators
    if (this.isMathematics(allText)) {
      console.log('🔢 Detected: Mathematics');
      return 'mathematics';
    }
    
    // Check for literature indicators
    if (this.isLiterature(allText)) {
      console.log('📚 Detected: Literature');
      return 'literature';
    }
    
    // Check for computing indicators
    if (this.isComputing(allText)) {
      console.log('💻 Detected: Computing');
      return 'computing';
    }
    
    // Check for chemistry indicators
    if (this.isChemistry(allText)) {
      console.log('🧪 Detected: Chemistry');
      return 'chemistry';
    }
    
    // Check for physics indicators
    if (this.isPhysics(allText)) {
      console.log('⚡ Detected: Physics');
      return 'physics';
    }
    
    // Check for history indicators
    if (this.isHistory(allText)) {
      console.log('🏛️ Detected: History');
      return 'history';
    }
    
    // Check for biology indicators
    if (this.isBiology(allText)) {
      console.log('🧬 Detected: Biology');
      return 'biology';
    }
    
    console.log('📖 Detected: General');
    return 'general';
  }

  // Domain detection helper methods
  isMathematics(text) {
    const mathKeywords = ['math', 'addition', 'subtraction', 'multiplication', 'division', 'equation', 'algebra', 'calculate', 'solve'];
    const mathPatterns = /[\+\-\*\/×÷=]|\d+\s*[\+\-\*\/×÷]\s*\d+/;
    return this.containsKeywords(text, mathKeywords, 1) || mathPatterns.test(text);
  }

  isLiterature(text) {
    const litKeywords = ['literature', 'character', 'plot', 'theme', 'symbolism', 'shakespeare', 'dickens', 'poetry', 'novel', 'stanza'];
    return this.containsKeywords(text, litKeywords, 1) || /".*"/.test(text);
  }

  isComputing(text) {
    const compKeywords = ['programming', 'code', 'algorithm', 'function', 'variable', 'computer', 'software'];
    const codePatterns = /def |function |class |import|for |while |if |else|return/;
    return this.containsKeywords(text, compKeywords, 1) || codePatterns.test(text);
  }

  isChemistry(text) {
    const chemKeywords = ['chemistry', 'chemical', 'reaction', 'element', 'compound', 'acid', 'base', 'molecule'];
    const chemPatterns = /H2O|CO2|NaCl|[A-Z][a-z]?\d*|→|->/;
    return this.containsKeywords(text, chemKeywords, 1) || chemPatterns.test(text);
  }

  isPhysics(text) {
    const physicsKeywords = ['physics', 'force', 'energy', 'motion', 'velocity', 'acceleration', 'mass'];
    const physicsPatterns = /F\s*=|E\s*=|v\s*=|a\s*=/;
    return this.containsKeywords(text, physicsKeywords, 1) || physicsPatterns.test(text);
  }

  isHistory(text) {
    const historyKeywords = ['history', 'war', 'battle', 'revolution', 'century', 'historical'];
    const datePatterns = /\b(1\d{3}|20\d{2})\b/;
    return this.containsKeywords(text, historyKeywords, 1) || datePatterns.test(text);
  }

  isBiology(text) {
    const bioKeywords = ['biology', 'cell', 'organism', 'species', 'evolution', 'dna', 'gene', 'photosynthesis'];
    return this.containsKeywords(text, bioKeywords, 1);
  }

  containsKeywords(text, keywords, minCount) {
    const found = keywords.filter(keyword => text.includes(keyword));
    return found.length >= minCount;
  }

  /**
   * Generate domain-specific questions
   */
  async generateDomainSpecificQuestions(content, count, difficulty, contentScope) {
    try {
      // Use domain-specific prompt generator
      const prompt = this.promptGenerator.createScopedPrompt(content, count, difficulty, contentScope);
      
      console.log(`🎯 Using ${contentScope.subjectDomain} domain prompts`);
      
      // Generate with domain-specific parameters
      const params = this.getDomainGenerationParams(contentScope.subjectDomain);
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔄 Generation attempt ${attempt} of 3`);
        
        const response = await this.ollama.generate({
          model: this.defaultModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: params.temperature,
            top_p: params.top_p,
            num_predict: params.num_predict,
            stop: ["END_QUESTIONS", "SCOPE_VIOLATION:", "ARITHMETIC_ERROR:"]
          }
        });

        if (!response.response || response.response.trim().length === 0) {
          console.log('❌ Empty response from Ollama');
          continue;
        }

        // Check for violations
        if (response.response.includes('SCOPE_VIOLATION') || response.response.includes('ARITHMETIC_ERROR')) {
          console.log('🚫 AI reported violation, adjusting...');
          continue;
        }

        const questions = this.parseMCQResponse(response.response, count);
        
        if (questions.length > 0) {
          console.log(`📝 Generated ${questions.length} questions on attempt ${attempt}`);
          return questions;
        }
        
        console.log(`⚠️ Attempt ${attempt} failed, trying again...`);
        await this.delay(1000);
      }
      
      console.error('❌ All generation attempts failed');
      return [];
      
    } catch (error) {
      console.error('❌ Error in domain generation:', error);
      return [];
    }
  }

  /**
   * Get domain-specific generation parameters
   */
  getDomainGenerationParams(domain) {
    const domainParams = {
      mathematics: {
        temperature: 0.2,  // Very low for accuracy
        top_p: 0.8,
        num_predict: 1200
      },
      literature: {
        temperature: 0.6,  // Higher for creativity
        top_p: 0.9,
        num_predict: 1800
      },
      computing: {
        temperature: 0.3,  // Low for code accuracy
        top_p: 0.85,
        num_predict: 1600
      },
      chemistry: {
        temperature: 0.3,  // Low for formula accuracy
        top_p: 0.85,
        num_predict: 1400
      },
      physics: {
        temperature: 0.4,  // Moderate for problem-solving
        top_p: 0.9,
        num_predict: 1500
      },
      history: {
        temperature: 0.5,  // Balanced for analysis
        top_p: 0.9,
        num_predict: 1600
      },
      biology: {
        temperature: 0.4,  // Moderate for scientific accuracy
        top_p: 0.9,
        num_predict: 1400
      }
    };

    // Default parameters
    const defaultParams = {
      temperature: 0.5,
      top_p: 0.9,
      num_predict: 1500
    };

    return domainParams[domain] || defaultParams;
  }

  /**
   * Validate generated questions
   */
  async validateQuestions(questions, contentScope) {
    const validQuestions = [];
    
    console.log(`🔍 Validating ${questions.length} questions for ${contentScope.subjectDomain} domain`);
    
    for (const question of questions) {
      const validation = this.validatorManager.validateQuestion(question, contentScope);
      
      if (validation.isValid) {
        validQuestions.push(question);
        console.log(`✅ Question validated:`, question.question.substring(0, 50) + '...');
      } else {
        console.log(`🚫 Question rejected:`, validation.errors.join(', '));
        if (validation.warnings.length > 0) {
          console.log(`⚠️  Warnings:`, validation.warnings.join(', '));
        }
      }
    }
    
    return validQuestions;
  }

  /**
   * Get default scope when analysis fails
   */
  getDefaultScope(subject, topic) {
    return {
      educationalLevel: 'middle_school',
      subjectDomain: 'general',
      conceptsTaught: [topic?.name || 'general concepts'],
      operationsShown: ['basic operations'],
      complexityLevel: 'basic',
      numberRange: 'double_digit',
      prerequisites: ['basic knowledge'],
      subjectInfo: {
        id: subject?.id,
        name: subject?.name,
        categoryId: subject?.category_id,
        categoryName: subject?.category_name
      },
      topicInfo: {
        id: topic?.id,
        name: topic?.name,
        description: topic?.description
      }
    };
  }

  // Keep existing parsing methods
  parseMCQResponse(response, expectedCount) {
    const questions = [];
    
    try {
      // Check for violation markers
      if (response.includes('SCOPE_VIOLATION') || response.includes('ARITHMETIC_ERROR')) {
        console.log('🚫 AI reported violation');
        return [];
      }
      
      const questionBlocks = response.split(/QUESTION\s+\d+:/i).filter(block => block.trim());
      
      for (let i = 0; i < questionBlocks.length && questions.length < expectedCount; i++) {
        const block = questionBlocks[i].trim();
        if (!block) continue;
        
        const question = this.parseQuestionBlock(block);
        if (question) {
          questions.push(question);
        }
      }
      
      return questions;
      
    } catch (error) {
      console.error('❌ Error parsing MCQ response:', error);
      return [];
    }
  }

  parseQuestionBlock(block) {
    try {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 6) return null;
      
      let questionText = '';
      let optionStartIndex = -1;
      
      // Find question text
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.match(/^[A-D]\)/i) && !line.toLowerCase().startsWith('correct:') && !line.toLowerCase().startsWith('explanation:')) {
          if (!questionText) {
            questionText = line;
          } else {
            questionText += ' ' + line;
          }
        } else {
          optionStartIndex = i;
          break;
        }
      }
      
      if (!questionText || optionStartIndex === -1) return null;
      
      const options = [];
      let correctAnswer = null;
      let explanation = '';
      
      // Parse options, correct answer, and explanation
      for (let i = optionStartIndex; i < lines.length; i++) {
        const line = lines[i];
        
        const optionMatch = line.match(/^([A-D])\)\s*(.+)$/i);
        if (optionMatch) {
          options.push(optionMatch[2].trim());
          continue;
        }
        
        const correctMatch = line.match(/^CORRECT:\s*([A-D])/i);
        if (correctMatch) {
          const letter = correctMatch[1].toUpperCase();
          correctAnswer = letter.charCodeAt(0) - 65;
          continue;
        }
        
        const explanationMatch = line.match(/^EXPLANATION:\s*(.+)$/i);
        if (explanationMatch) {
          explanation = explanationMatch[1].trim();
          break;
        }
      }
      
      if (options.length < 4 || correctAnswer === null || correctAnswer < 0 || correctAnswer >= options.length) {
        return null;
      }
      
      const finalOptions = options.slice(0, 4);
      const finalExplanation = explanation.trim() || 
        `The correct answer is ${String.fromCharCode(65 + correctAnswer)}. ${finalOptions[correctAnswer]}`;
      
      return {
        question: questionText.trim(),
        answer: finalOptions[correctAnswer],
        difficulty: 'medium',
        type: 'multiple_choice',
        options: finalOptions,
        correctIndex: correctAnswer,
        explanation: finalExplanation
      };
      
    } catch (error) {
      console.error('❌ Error parsing question block:', error);
      return null;
    }
  }

  async isHealthy() {
    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: "Say 'OK' if you are working properly.",
        stream: false,
        options: { num_predict: 10 }
      });
      
      return response && response.response && response.response.trim().length > 0;
    } catch (error) {
      console.error('❌ Ollama health check failed:', error);
      return false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = OllamaService;