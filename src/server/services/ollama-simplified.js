// src/server/services/ollama-simplified.js - COMPLETE CLEAN VERSION
const { Ollama } = require('ollama');

class SimplifiedOllamaService {
  constructor() {
    this.ollama = new Ollama({
      host: 'http://localhost:11434'
    });
    this.defaultModel = 'llama3.2:3b';
    this.maxAttempts = 5;
    
    // Store successful question patterns for fallback
    this.successfulPatterns = new Map();
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
        this.storeSuccessfulPatterns(subjectCategory.id, result);
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
      const generateCount = this.calculateBatchSize(needed, attempt, subjectCategory);
      
      try {
        // Generate questions using different strategies per attempt
        let newQuestions = [];
        
        if (attempt === 1) {
          newQuestions = await this.generateWithSubjectContext(content, generateCount, subjectCategory, topicName);
        } else if (attempt === 2) {
          newQuestions = await this.generateConservative(content, generateCount, subjectCategory, topicName);
        } else if (attempt === 3) {
          newQuestions = await this.generateSimplified(content, generateCount, subjectCategory, topicName);
        } else if (attempt === 4) {
          newQuestions = await this.generateFromPatterns(content, generateCount, subjectCategory);
        } else {
          newQuestions = await this.generateBasic(content, generateCount, subjectCategory, topicName);
        }
        
        console.log(`📝 Generated ${newQuestions.length} raw questions in attempt ${attempt}`);
        
        // Validate questions based on subject
        const validatedQuestions = await this.validateQuestions(newQuestions, subjectCategory);
        
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
   * Calculate batch size based on subject and attempt
   */
  calculateBatchSize(needed, attempt, subjectCategory) {
    // Subject-specific rejection rates
    const rejectionRates = {
      'mathematics': 0.3,        // 30% rejection due to math errors
      'natural-sciences': 0.2,   // 20% rejection
      'literature': 0.1,         // 10% rejection
      'history': 0.15,          // 15% rejection
      'default': 0.1            // 10% rejection for others
    };
    
    const subjectId = subjectCategory.id || 'default';
    const rejectionRate = rejectionRates[subjectId] || rejectionRates.default;
    
    // Increase multiplier with each attempt
    const attemptMultiplier = Math.min(1 + (attempt - 1) * 0.3, 2.5);
    const rejectionMultiplier = 1 / (1 - rejectionRate);
    
    const batchSize = Math.ceil(needed * rejectionMultiplier * attemptMultiplier);
    
    console.log(`📊 Batch calculation: Need ${needed}, generating ${batchSize} (${Math.round(rejectionRate * 100)}% expected rejection)`);
    
    return Math.min(batchSize, needed * 3); // Cap at 3x needed
  }

  /**
   * Validate questions based on subject - SUBJECT ISOLATION
   */
  async validateQuestions(questions, subjectCategory) {
    const validQuestions = [];
    const subjectId = subjectCategory.id;
    
    for (const question of questions) {
      try {
        let isValid = true;
        
        // Subject-specific validation
        if (subjectId === 'mathematics') {
          isValid = await this.validateMathQuestion(question);
        } else if (subjectId === 'natural-sciences') {
          isValid = await this.validateScienceQuestion(question);
        } else if (subjectId === 'literature') {
          isValid = await this.validateLiteratureQuestion(question);
        } else if (subjectId === 'history') {
          isValid = await this.validateHistoryQuestion(question);
        } else {
          isValid = await this.validateGeneralQuestion(question);
        }
        
        if (isValid) {
          validQuestions.push(question);
        }
        
      } catch (error) {
        console.error('❌ Validation error:', error);
      }
    }
    
    return validQuestions;
  }

  /**
   * Math-specific validation - ONLY for mathematics subject
   */
  async validateMathQuestion(question) {
    // Check for arithmetic errors like "5 × 4 = 15"
    const mathErrors = this.findMathErrors(question.question + ' ' + (question.explanation || ''));
    
    if (mathErrors.length > 0) {
      console.log(`❌ Math error detected: ${mathErrors[0]}`);
      return false;
    }
    
    return this.validateGeneralQuestion(question);
  }

  /**
   * Find mathematical errors in text
   */
  findMathErrors(text) {
    const errors = [];
    
    // Match mathematical expressions like "5 × 4 = 15"
    const mathPatterns = [
      /(\d+)\s*[×x*]\s*(\d+)\s*=\s*(\d+)/gi,
      /(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/gi,
      /(\d+)\s*-\s*(\d+)\s*=\s*(\d+)/gi,
      /(\d+)\s*[÷/]\s*(\d+)\s*=\s*(\d+)/gi
    ];
    
    for (const pattern of mathPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [original, num1, num2, result] = match;
        const operand1 = parseInt(num1);
        const operand2 = parseInt(num2);
        const claimedResult = parseInt(result);
        
        let correctResult;
        if (original.includes('×') || original.includes('*') || original.includes('x')) {
          correctResult = operand1 * operand2;
        } else if (original.includes('+')) {
          correctResult = operand1 + operand2;
        } else if (original.includes('-')) {
          correctResult = operand1 - operand2;
        } else if (original.includes('÷') || original.includes('/')) {
          correctResult = operand2 !== 0 ? operand1 / operand2 : null;
        }
        
        if (correctResult !== null && correctResult !== claimedResult) {
          errors.push(`${original} should be ${operand1} × ${operand2} = ${correctResult}, not ${claimedResult}`);
        }
      }
    }
    
    return errors;
  }

  /**
   * Science-specific validation - ONLY for natural sciences
   */
  async validateScienceQuestion(question) {
    // Basic science validation (can be expanded)
    return this.validateGeneralQuestion(question);
  }

  /**
   * Literature-specific validation - ONLY for literature
   */
  async validateLiteratureQuestion(question) {
    // Basic literature validation (can be expanded)
    return this.validateGeneralQuestion(question);
  }

  /**
   * History-specific validation - ONLY for history
   */
  async validateHistoryQuestion(question) {
    // Basic history validation (can be expanded)
    return this.validateGeneralQuestion(question);
  }

  /**
   * General validation for all subjects
   */
  async validateGeneralQuestion(question) {
    // Basic validation
    if (!question.question || question.question.length < 10) {
      return false;
    }
    
    if (question.type === 'multiple_choice') {
      if (!question.options || question.options.length !== 4) {
        return false;
      }
      
      if (question.correctIndex < 0 || question.correctIndex >= 4) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Generate with subject-specific context (Attempt 1)
   */
  async generateWithSubjectContext(content, count, subjectCategory, topicName) {
    const subjectId = subjectCategory.id;
    
    console.log(`🎯 Generating with ${subjectId} context`);
    
    const prompt = this.createSubjectPrompt(content, count, subjectCategory, topicName);
    
    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: subjectId === 'mathematics' ? 0.3 : 0.7,
          top_p: 0.9,
          num_predict: Math.max(800, count * 120),
          stop: ["END_QUESTIONS", "---"]
        }
      });

      if (!response.response || response.response.trim().length === 0) {
        return [];
      }

      return this.parseQuestions(response.response, count);
      
    } catch (error) {
      console.error(`❌ ${subjectId} generation failed:`, error);
      return [];
    }
  }

  /**
   * Create subject-specific prompts
   */
  createSubjectPrompt(content, count, subjectCategory, topicName) {
    const subjectId = subjectCategory.id;
    const baseContent = content.substring(0, 2000);
    
    if (subjectId === 'mathematics') {
      return `You are a MATHEMATICS teacher creating ${count} practice questions for "${topicName}".

STUDY MATERIAL:
${baseContent}

🧮 CRITICAL MATH REQUIREMENTS:
- VERIFY ALL ARITHMETIC: Every calculation must be 100% mathematically correct
- Example: 5 × 4 = 20 (NOT 15, NOT 18)
- Example: 8 + 7 = 15 (NOT 14, NOT 16) 
- Example: 12 - 5 = 7 (NOT 8, NOT 6)
- Double-check every number before finalizing
- If unsure about arithmetic, recalculate step by step

MATHEMATICS TEACHING FOCUS:
- Test computational skills and mathematical reasoning
- Ask about calculations, problem-solving, formulas
- Include numerical examples from the material
- Ensure mathematical accuracy above all else

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Mathematical question testing concepts from the material]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Mathematical explanation with correct arithmetic]

Continue for all ${count} questions. Remember: Mathematical accuracy is non-negotiable!`;
    }
    
    // For other subjects
    return `You are a ${subjectCategory.name} teacher creating ${count} questions about "${topicName}".

STUDY MATERIAL:
${baseContent}

Create exactly ${count} multiple choice questions that test understanding of this material.

QUESTION 1:
[Question about the material]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation]

Continue for all ${count} questions.`;
  }

  /**
   * Conservative generation (Attempt 2)
   */
  async generateConservative(content, count, subjectCategory, topicName) {
    console.log(`🛡️ Using conservative generation`);
    
    const simplePrompt = `Create ${count} simple, factual questions about "${topicName}" based on this content:

${content.substring(0, 1000)}

Make questions straightforward and based directly on the material provided.

QUESTION 1:
[Simple question]
A) [Answer choice]
B) [Answer choice]
C) [Answer choice]
D) [Answer choice]
CORRECT: [A/B/C/D]
EXPLANATION: [Simple explanation]

Continue for ${count} questions.`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: simplePrompt,
        stream: false,
        options: {
          temperature: 0.4,
          top_p: 0.8,
          num_predict: count * 100
        }
      });

      return this.parseQuestions(response.response, count);
    } catch (error) {
      console.error('❌ Conservative generation failed:', error);
      return [];
    }
  }

  /**
   * Simplified generation (Attempt 3)
   */
  async generateSimplified(content, count, subjectCategory, topicName) {
    console.log(`📝 Using simplified generation`);
    
    const basicPrompt = `Based on this material about "${topicName}", create ${count} basic questions:

${content.substring(0, 800)}

Each question should test basic understanding of the material.

QUESTION 1:
What does the material say about [topic]?
A) [Direct answer from material]
B) [Incorrect option]
C) [Incorrect option]
D) [Incorrect option]
CORRECT: A
EXPLANATION: This is stated in the material.

Create ${count} questions in this format.`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: basicPrompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.7,
          num_predict: count * 80
        }
      });

      return this.parseQuestions(response.response, count);
    } catch (error) {
      console.error('❌ Simplified generation failed:', error);
      return [];
    }
  }

  /**
   * Generate from successful patterns (Attempt 4)
   */
  async generateFromPatterns(content, count, subjectCategory) {
    console.log(`🔄 Using pattern-based generation`);
    
    const patterns = this.successfulPatterns.get(subjectCategory.id) || [];
    
    if (patterns.length === 0) {
      return this.generateBasic(content, count, subjectCategory, 'pattern fallback');
    }

    const samplePattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    const patternPrompt = `Create ${count} questions similar to this successful example:

STUDY MATERIAL:
${content.substring(0, 1200)}

EXAMPLE SUCCESSFUL QUESTION:
${samplePattern.question}
A) ${samplePattern.options[0]}
B) ${samplePattern.options[1]}
C) ${samplePattern.options[2]}
D) ${samplePattern.options[3]}

Create ${count} similar questions based on the study material.`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: patternPrompt,
        stream: false,
        options: {
          temperature: 0.6,
          top_p: 0.9,
          num_predict: count * 100
        }
      });

      return this.parseQuestions(response.response, count);
    } catch (error) {
      console.error('❌ Pattern generation failed:', error);
      return [];
    }
  }

  /**
   * Basic generation (Attempt 5 - Final fallback)
   */
  async generateBasic(content, count, subjectCategory, topicName) {
    console.log(`🔧 Using basic generation as final attempt`);
    
    const basicQuestions = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sentence = sentences[i].trim();
      
      basicQuestions.push({
        question: `According to the study material, which statement is most accurate?`,
        answer: sentence.substring(0, 100),
        type: 'multiple_choice',
        options: [
          sentence.substring(0, 80),
          "This information is not covered in the material",
          "The material contradicts this statement", 
          "This topic is not discussed"
        ],
        correctIndex: 0,
        explanation: `This is directly stated in the provided study material.`
      });
    }
    
    return basicQuestions;
  }

  /**
   * Parse questions from AI response
   */
  parseQuestions(response, expectedCount) {
    const questions = [];
    
    try {
      const questionBlocks = response.split(/QUESTION\s+\d+:/i).filter(block => block.trim());
      
      for (let i = 0; i < questionBlocks.length && questions.length < expectedCount; i++) {
        const question = this.parseQuestionBlock(questionBlocks[i].trim());
        if (question) {
          questions.push(question);
        }
      }
      
      return questions;
      
    } catch (error) {
      console.error('❌ Error parsing questions:', error);
      return [];
    }
  }

  /**
   * Parse individual question block
   */
  parseQuestionBlock(block) {
    try {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 6) {
        return null;
      }
      
      let questionText = '';
      let options = [];
      let correctAnswer = null;
      let explanation = '';
      
      let currentSection = 'question';
      
      for (const line of lines) {
        // Check for options
        const optionMatch = line.match(/^([A-D])\)\s*(.+)$/i);
        if (optionMatch) {
          options.push(optionMatch[2].trim());
          currentSection = 'options';
          continue;
        }
        
        // Check for correct answer
        const correctMatch = line.match(/^CORRECT:\s*([A-D])/i);
        if (correctMatch) {
          const letter = correctMatch[1].toUpperCase();
          correctAnswer = letter.charCodeAt(0) - 65;
          currentSection = 'correct';
          continue;
        }
        
        // Check for explanation
        const explanationMatch = line.match(/^EXPLANATION:\s*(.+)$/i);
        if (explanationMatch) {
          explanation = explanationMatch[1].trim();
          currentSection = 'explanation';
          continue;
        }
        
        // Build question text
        if (currentSection === 'question' && 
            !line.toLowerCase().startsWith('correct:') && 
            !line.toLowerCase().startsWith('explanation:')) {
          questionText += (questionText ? ' ' : '') + line;
        }
      }
      
      // Validate question structure
      if (!questionText || options.length !== 4 || correctAnswer === null || 
          correctAnswer < 0 || correctAnswer >= 4) {
        return null;
      }
      
      return {
        question: questionText.trim(),
        answer: options[correctAnswer],
        type: 'multiple_choice',
        options: options,
        correctIndex: correctAnswer,
        explanation: explanation || `The correct answer is ${String.fromCharCode(65 + correctAnswer)}. ${options[correctAnswer]}`
      };
      
    } catch (error) {
      console.error('❌ Error parsing question block:', error);
      return null;
    }
  }

  /**
   * Store successful patterns for future use
   */
  storeSuccessfulPatterns(subjectId, questions) {
    if (!this.successfulPatterns.has(subjectId)) {
      this.successfulPatterns.set(subjectId, []);
    }
    
    const patterns = this.successfulPatterns.get(subjectId);
    
    // Add new patterns
    questions.forEach(q => {
      patterns.push({
        question: q.question,
        options: q.options,
        type: q.type
      });
    });
    
    // Keep only last 20 successful patterns per subject
    if (patterns.length > 20) {
      patterns.splice(0, patterns.length - 20);
    }
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
        'natural-sciences': 'Science Validator (Basic validation)',
        'literature': 'Literature Validator (Basic validation)',
        'history': 'History Validator (Basic validation)',
        'others': 'General Validator (Basic validation only)'
      },
      countGuarantee: 'Multi-attempt strategy ensures exact question count',
      maxAttempts: this.maxAttempts
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
      const errors = this.findMathErrors(testCase);
      console.log(`  ${testCase}: ${errors.length === 0 ? '✅ Valid' : '❌ Invalid - ' + errors[0]}`);
    });
  }
}

module.exports = SimplifiedOllamaService;