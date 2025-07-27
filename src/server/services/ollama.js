// src/server/services/ollama.js - FIXED VERSION with proper domain detection and guaranteed question generation

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

  /**
   * Enhanced domain-aware question generation with guaranteed quantity
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

      // STEP 1: Analyze content scope and detect domain (FIXED)
      const contentScope = await this.analyzeContentWithDomainDetection(content, subject, topic);
      console.log(`🎯 Domain: ${contentScope.subjectDomain}, Level: ${contentScope.educationalLevel}`);
      
      // STEP 2: Generate domain-specific questions with fallback strategy
      const questions = await this.generateQuestionsWithFallback(content, count, difficulty, contentScope);
      
      if (questions.length >= count) {
        console.log(`✅ Generated ${questions.length} validated questions`);
        return questions.slice(0, count); // Ensure exact count
      }
      
      console.log(`⚠️ Only generated ${questions.length}/${count} questions, trying fallback strategies...`);
      
      // STEP 3: Fallback strategies to reach target count
      const additionalQuestions = await this.generateAdditionalQuestions(
        content, 
        count - questions.length, 
        difficulty, 
        contentScope
      );
      
      const finalQuestions = [...questions, ...additionalQuestions].slice(0, count);
      console.log(`✅ Final result: ${finalQuestions.length} questions generated`);
      return finalQuestions;
      
    } catch (error) {
      console.error('❌ Error in generateQuestions:', error);
      
      // Emergency fallback: generate simple questions
      return await this.generateEmergencyQuestions(content, count, difficulty, topic);
    }
  }

  /**
   * FIXED: Analyze content with proper domain detection
   */
  async analyzeContentWithDomainDetection(content, subject, topic) {
    try {
      // Get basic scope analysis
      const basicScope = await this.scopeAnalyzer.analyzeScope(content, subject, topic);
      
      // FIXED: Use the domain from scope analysis first, then fallback to detection
      let detectedDomain = basicScope.subjectDomain;
      
      // Only override if scope analysis was unclear
      if (!detectedDomain || detectedDomain === 'general') {
        detectedDomain = this.detectDomain(content, subject, topic);
      }
      
      // Additional validation: if subject has category, prefer that
      if (subject?.category_name) {
        const categoryDomain = this.mapCategoryToDomain(subject.category_name);
        if (categoryDomain) {
          detectedDomain = categoryDomain;
          console.log(`🏷️ Using category-based domain: ${detectedDomain}`);
        }
      }
      
      // Enhanced scope with corrected domain
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
   * Map category names to domains
   */
  mapCategoryToDomain(categoryName) {
    const categoryMapping = {
      'History & Social Studies': 'history',
      'Mathematics': 'mathematics',
      'Natural Sciences': 'physics', // or 'chemistry', 'biology' based on content
      'Literature & Writing': 'literature',
      'Foreign Languages': 'general',
      'Arts & Humanities': 'general',
      'Computer Science': 'computing',
      'Business & Economics': 'general',
      'Health & Medicine': 'biology'
    };
    
    return categoryMapping[categoryName] || null;
  }

  /**
   * Generate questions with multiple fallback strategies
   */
  async generateQuestionsWithFallback(content, count, difficulty, contentScope) {
    const allQuestions = [];
    
    // Strategy 1: Domain-specific generation
    try {
      const domainQuestions = await this.generateDomainSpecificQuestions(
        content, count, difficulty, contentScope
      );
      allQuestions.push(...domainQuestions);
      
      if (allQuestions.length >= count) {
        return allQuestions.slice(0, count);
      }
    } catch (error) {
      console.warn('⚠️ Domain-specific generation failed:', error.message);
    }
    
    // Strategy 2: Relaxed validation
    if (allQuestions.length < count) {
      try {
        const relaxedQuestions = await this.generateWithRelaxedValidation(
          content, count - allQuestions.length, difficulty, contentScope
        );
        allQuestions.push(...relaxedQuestions);
      } catch (error) {
        console.warn('⚠️ Relaxed validation generation failed:', error.message);
      }
    }
    
    // Strategy 3: Generic academic questions
    if (allQuestions.length < count) {
      try {
        const genericQuestions = await this.generateGenericQuestions(
          content, count - allQuestions.length, difficulty
        );
        allQuestions.push(...genericQuestions);
      } catch (error) {
        console.warn('⚠️ Generic generation failed:', error.message);
      }
    }
    
    return allQuestions;
  }

  /**
   * Generate additional questions when primary methods fall short
   */
  async generateAdditionalQuestions(content, remainingCount, difficulty, contentScope) {
    if (remainingCount <= 0) return [];
    
    console.log(`🔄 Generating ${remainingCount} additional questions...`);
    
    // Try different approaches with lower standards
    const strategies = [
      () => this.generateSimpleContentQuestions(content, remainingCount, difficulty),
      () => this.generateBasicComprehensionQuestions(content, remainingCount, difficulty),
      () => this.generateFactualQuestions(content, remainingCount, difficulty)
    ];
    
    for (const strategy of strategies) {
      try {
        const questions = await strategy();
        if (questions.length > 0) {
          console.log(`✅ Generated ${questions.length} additional questions`);
          return questions.slice(0, remainingCount);
        }
      } catch (error) {
        console.warn('⚠️ Strategy failed, trying next...', error.message);
      }
    }
    
    return [];
  }

  /**
   * Generate questions with relaxed validation standards
   */
  async generateWithRelaxedValidation(content, count, difficulty, contentScope) {
    try {
      const prompt = this.createRelaxedPrompt(content, count, difficulty, contentScope);
      
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.8, // Higher creativity
          top_p: 0.95,
          num_predict: 2000
        }
      });

      if (response.response) {
        return this.parseAnyResponse(response.response, count);
      }
      
      return [];
    } catch (error) {
      console.error('❌ Relaxed validation generation failed:', error);
      return [];
    }
  }

  /**
   * Create a more permissive prompt that focuses on quantity
   */
  createRelaxedPrompt(content, count, difficulty, contentScope) {
    return `You are creating ${count} multiple choice questions about this topic. You MUST create exactly ${count} questions, no exceptions.

CONTENT:
${content.substring(0, 1500)}

REQUIREMENTS:
- Create EXACTLY ${count} multiple choice questions
- Each question must have 4 options (A, B, C, D)
- Clearly mark the correct answer
- Questions can be about facts, concepts, or analysis from the content
- Focus on creating the requested quantity over perfect quality

FORMAT (create ${count} questions like this):

QUESTION 1:
[Question about the content]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation]

QUESTION 2:
[Next question]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation]

Continue until you have created all ${count} questions. Do not stop until you reach ${count} questions.`;
  }

  /**
   * Generate simple content-based questions
   */
  async generateSimpleContentQuestions(content, count, difficulty) {
    const prompt = `Create ${count} simple multiple choice questions about this content:

${content.substring(0, 1000)}

Make basic factual questions about what is mentioned in the text. Format each as:

QUESTION [number]:
[Simple question about the content]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
CORRECT: [Letter]
EXPLANATION: [Why this is correct]

Create exactly ${count} questions.`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.6,
          top_p: 0.9,
          num_predict: 1200
        }
      });

      return this.parseAnyResponse(response.response, count);
    } catch (error) {
      console.error('❌ Simple content questions failed:', error);
      return [];
    }
  }

  /**
   * Generate basic comprehension questions
   */
  async generateBasicComprehensionQuestions(content, count, difficulty) {
    const prompt = `Based on this text, create ${count} basic comprehension questions:

${content.substring(0, 800)}

Focus on:
- What is mentioned in the text
- Key facts and details
- Basic understanding

Format: QUESTION [n]: [question] A) B) C) D) CORRECT: [letter]

Create exactly ${count} questions now:`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.5,
          top_p: 0.8,
          num_predict: 1000
        }
      });

      return this.parseAnyResponse(response.response, count);
    } catch (error) {
      return [];
    }
  }

  /**
   * Emergency fallback: generate basic questions
   */
  async generateEmergencyQuestions(content, count, difficulty, topic) {
    console.log('🚨 Using emergency question generation');
    
    const basicQuestions = [];
    const topicName = topic?.name || 'this topic';
    
    // Generate template questions
    for (let i = 0; i < count; i++) {
      basicQuestions.push({
        question: `What is an important concept related to ${topicName}?`,
        answer: `Key concepts from the study material about ${topicName}`,
        difficulty: difficulty,
        type: 'multiple_choice',
        options: [
          `Key concepts from the study material about ${topicName}`,
          `Unrelated information`,
          `Incorrect details`,
          `Random facts`
        ],
        correctIndex: 0,
        explanation: `This question tests basic understanding of ${topicName} based on the provided study materials.`
      });
    }
    
    console.log(`🚨 Generated ${basicQuestions.length} emergency questions`);
    return basicQuestions;
  }

  /**
   * Improved response parser that's more lenient
   */
  parseAnyResponse(response, expectedCount) {
    const questions = [];
    
    try {
      // Split by question markers
      const questionBlocks = response.split(/QUESTION\s+\d+:/i).filter(block => block.trim());
      
      for (let i = 0; i < questionBlocks.length && questions.length < expectedCount; i++) {
        const block = questionBlocks[i].trim();
        if (!block) continue;
        
        const question = this.parseQuestionBlockLenient(block);
        if (question) {
          questions.push(question);
        }
      }
      
      // If we still don't have enough, try alternative parsing
      if (questions.length < expectedCount) {
        const alternativeQuestions = this.parseAlternativeFormat(response, expectedCount - questions.length);
        questions.push(...alternativeQuestions);
      }
      
      return questions.slice(0, expectedCount);
      
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      return questions;
    }
  }

  /**
   * More lenient question block parser
   */
  parseQuestionBlockLenient(block) {
    try {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 4) return null;
      
      let questionText = '';
      const options = [];
      let correctAnswer = null;
      let explanation = '';
      
      for (const line of lines) {
        // Check for options
        const optionMatch = line.match(/^([A-D])\)\s*(.+)$/i);
        if (optionMatch) {
          options.push(optionMatch[2].trim());
          continue;
        }
        
        // Check for correct answer
        const correctMatch = line.match(/^CORRECT:\s*([A-D])/i);
        if (correctMatch) {
          correctAnswer = correctMatch[1].toUpperCase().charCodeAt(0) - 65;
          continue;
        }
        
        // Check for explanation
        const explanationMatch = line.match(/^EXPLANATION:\s*(.+)$/i);
        if (explanationMatch) {
          explanation = explanationMatch[1].trim();
          continue;
        }
        
        // If it's not an option, correct answer, or explanation, it's probably the question
        if (!line.toLowerCase().startsWith('correct:') && 
            !line.toLowerCase().startsWith('explanation:') && 
            !line.match(/^[A-D]\)/i)) {
          if (!questionText) {
            questionText = line;
          } else {
            questionText += ' ' + line;
          }
        }
      }
      
      // Validate we have minimum requirements
      if (!questionText || options.length < 4 || correctAnswer === null) {
        return null;
      }
      
      const finalOptions = options.slice(0, 4);
      const finalExplanation = explanation || `The correct answer is ${String.fromCharCode(65 + correctAnswer)}. ${finalOptions[correctAnswer]}`;
      
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

  /**
   * Try alternative parsing formats
   */
  parseAlternativeFormat(response, neededCount) {
    // Implementation for parsing other possible formats
    // This is a placeholder - you could add more sophisticated parsing here
    return [];
  }

  /**
   * Create mathematics-specific prompt for actual computational questions
   */
  createMathematicsPrompt(content, count, difficulty, contentScope) {
    const { educationalLevel, operationsShown, numberRange } = contentScope;
    
    // Determine number range for questions
    let maxNumber = 10;
    if (numberRange.includes('20')) maxNumber = 20;
    if (numberRange.includes('100')) maxNumber = 100;
    if (educationalLevel === 'elementary') maxNumber = Math.min(maxNumber, 20);
    
    return `You are a mathematics teacher creating COMPUTATIONAL practice problems for ${educationalLevel} students.

STUDY MATERIAL:
${content.substring(0, 1500)}

🔢 MATHEMATICS REQUIREMENTS:
- Educational Level: ${educationalLevel}
- Operations Allowed: ${operationsShown.filter(op => ['addition', 'subtraction', 'multiplication', 'division'].includes(op)).join(', ')}
- Number Range: Use numbers from 1 to ${maxNumber}
- Create ACTUAL MATH PROBLEMS, not questions about teaching methods

✅ CREATE THESE TYPES OF QUESTIONS:
- Direct calculations: "What is 8 + 5?" 
- Simple word problems: "Sarah has 7 apples. She gets 4 more. How many apples does she have?"
- Number facts: "Which number makes this true: 9 + ? = 15"

❌ DO NOT CREATE:
- Questions about "what Year 2 students do"
- Questions about "teaching methods" 
- Meta-questions about the curriculum

${this.getMathDifficultyInstructions(educationalLevel, difficulty, maxNumber)}

Create exactly ${count} multiple choice math problems:

QUESTION 1:
[Math calculation or simple word problem using numbers 1-${maxNumber}]
A) [Number answer]
B) [Number answer] 
C) [Number answer]
D) [Number answer]
CORRECT: [A/B/C/D]
EXPLANATION: [Show the calculation step by step]

QUESTION 2:
[Another math problem]
A) [Number answer]
B) [Number answer]
C) [Number answer] 
D) [Number answer]
CORRECT: [A/B/C/D]
EXPLANATION: [Show the calculation]

Continue for all ${count} questions. Focus on ACTUAL MATH CALCULATIONS.`;
  }

  /**
   * Get math-specific difficulty instructions
   */
  getMathDifficultyInstructions(level, difficulty, maxNumber) {
    if (level === 'elementary') {
      const instructions = {
        easy: `- Use single-digit addition/subtraction (numbers 1-${Math.min(maxNumber, 10)})
- Direct calculations like "3 + 4 = ?" or "8 - 2 = ?"
- Simple one-step word problems`,
        medium: `- Use numbers up to ${maxNumber}
- Mix of addition and subtraction
- Simple word problems with concrete objects (apples, toys, etc.)
- Some "crossing 10" problems if appropriate`,
        hard: `- Use full range up to ${maxNumber}
- Multi-step problems if operations allow
- Word problems requiring more thinking
- Derived facts and number relationships`
      };
      return instructions[difficulty] || instructions.medium;
    }
    
    return `Create ${difficulty} level problems appropriate for ${level} students using numbers up to ${maxNumber}.`;
  }

  /**
   * Create history-specific prompt
   */
  createHistoryPrompt(content, count, difficulty, contentScope) {
    return `You are a history teacher creating questions about historical facts and analysis.

HISTORICAL CONTENT:
${content.substring(0, 1500)}

Create ${count} multiple choice questions that test:
- Specific historical facts from the content
- Chronology and dates mentioned
- Causes and effects of historical events
- Key figures and their roles
- Historical significance

Format each question as:

QUESTION 1:
[Historical question based on the content]
A) [Historical answer option]
B) [Historical answer option]
C) [Historical answer option]
D) [Historical answer option]
CORRECT: [A/B/C/D]
EXPLANATION: [Historical reasoning]

Create exactly ${count} questions about the historical content provided.`;
  }

  /**
   * Create generic academic prompt
   */
  createGenericPrompt(content, count, difficulty, contentScope) {
    return `Create ${count} multiple choice questions based on this academic content:

CONTENT:
${content.substring(0, 1500)}

Create questions that test understanding of the key concepts and facts presented in the material.

Format each as:

QUESTION 1:
[Question about the content]
A) [Answer option]
B) [Answer option]
C) [Answer option]
D) [Answer option]
CORRECT: [A/B/C/D]
EXPLANATION: [Reasoning]

Create exactly ${count} questions.`;
  }
  
  detectDomain(content, subject, topic) {
    const contentLower = content.toLowerCase();
    const subjectName = (subject?.name || '').toLowerCase();
    const topicName = (topic?.name || '').toLowerCase();
    const allText = `${contentLower} ${subjectName} ${topicName}`;
    
    // FIXED: Prioritize subject category first
    if (subject?.category_name) {
      const categoryDomain = this.mapCategoryToDomain(subject.category_name);
      if (categoryDomain) {
        console.log(`🏷️ Domain from category: ${categoryDomain}`);
        return categoryDomain;
      }
    }
    
    // Then check content patterns
    if (this.isHistory(allText)) {
      console.log('🏛️ Detected: History');
      return 'history';
    }
    
    if (this.isMathematics(allText)) {
      console.log('🔢 Detected: Mathematics');
      return 'mathematics';
    }
    
    if (this.isLiterature(allText)) {
      console.log('📚 Detected: Literature');
      return 'literature';
    }
    
    if (this.isComputing(allText)) {
      console.log('💻 Detected: Computing');
      return 'computing';
    }
    
    if (this.isChemistry(allText)) {
      console.log('🧪 Detected: Chemistry');
      return 'chemistry';
    }
    
    if (this.isPhysics(allText)) {
      console.log('⚡ Detected: Physics');
      return 'physics';
    }
    
    if (this.isBiology(allText)) {
      console.log('🧬 Detected: Biology');
      return 'biology';
    }
    
    console.log('📖 Detected: General');
    return 'general';
  }

  // Domain detection helper methods (improved)
  isHistory(text) {
    const historyKeywords = ['history', 'empire', 'war', 'battle', 'dynasty', 'reign', 'century', 'historical', 'ancient', 'medieval', 'mughal', 'sultan', 'kingdom', 'ruler', 'civilization'];
    const strongHistoryPatterns = /\b(empire|dynasty|reign|sultan|emperor|kingdom|civilization|historical)\b/i;
    return this.containsKeywords(text, historyKeywords, 2) || strongHistoryPatterns.test(text) || /\b(1\d{3}|20\d{2})\b/.test(text);
  }

  isMathematics(text) {
    const mathKeywords = ['math', 'mathematics', 'addition', 'subtraction', 'multiplication', 'division', 'equation', 'algebra', 'calculate', 'solve', 'formula', 'arithmetic'];
    const mathPatterns = /[\+\-\*\/×÷=]|\d+\s*[\+\-\*\/×÷]\s*\d+|equation|formula|calculate/i;
    return this.containsKeywords(text, mathKeywords, 2) || mathPatterns.test(text);
  }

  // Domain detection helper methods (improved)
  isHistory(text) {
    const historyKeywords = ['history', 'empire', 'war', 'battle', 'dynasty', 'reign', 'century', 'historical', 'ancient', 'medieval', 'mughal', 'sultan', 'kingdom', 'ruler', 'civilization'];
    const strongHistoryPatterns = /\b(empire|dynasty|reign|sultan|emperor|kingdom|civilization|historical)\b/i;
    return this.containsKeywords(text, historyKeywords, 2) || strongHistoryPatterns.test(text) || /\b(1\d{3}|20\d{2})\b/.test(text);
  }

  isMathematics(text) {
    const mathKeywords = ['math', 'mathematics', 'addition', 'subtraction', 'multiplication', 'division', 'equation', 'algebra', 'calculate', 'solve', 'formula', 'arithmetic', 'number'];
    const mathPatterns = /[\+\-\*\/×÷=]|\d+\s*[\+\-\*\/×÷]\s*\d+|equation|formula|calculate|\b\d+\b/i;
    const strongMathPatterns = /\b(addition|subtraction|multiplication|division|calculate|equation)\b/i;
    return this.containsKeywords(text, mathKeywords, 2) || mathPatterns.test(text) || strongMathPatterns.test(text);
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

  isBiology(text) {
    const bioKeywords = ['biology', 'cell', 'organism', 'species', 'evolution', 'dna', 'gene', 'photosynthesis'];
    return this.containsKeywords(text, bioKeywords, 1);
  }

  /**
   * Validate generated questions
   */
  async validateQuestions(questions, contentScope) {
    const validQuestions = [];
    
    console.log(`🔍 Validating ${questions.length} questions for ${contentScope.subjectDomain} domain`);
    
    for (const question of questions) {
      // For math, do basic validation but be more lenient
      if (contentScope.subjectDomain === 'mathematics') {
        if (this.isValidMathQuestion(question)) {
          validQuestions.push(question);
          console.log(`✅ Math question validated:`, question.question.substring(0, 50) + '...');
        } else {
          console.log(`🚫 Math question rejected:`, question.question.substring(0, 50) + '...');
        }
      } else {
        // For other domains, basic validation
        if (this.isValidQuestion(question)) {
          validQuestions.push(question);
          console.log(`✅ Question validated:`, question.question.substring(0, 50) + '...');
        } else {
          console.log(`🚫 Question rejected:`, question.question.substring(0, 50) + '...');
        }
      }
    }
    
    return validQuestions;
  }

  /**
   * Basic math question validation
   */
  isValidMathQuestion(question) {
    if (!question.question || !question.options || question.options.length !== 4) {
      return false;
    }
    
    // Check if it's actually a math question (has numbers or math operations)
    const hasNumbers = /\d/.test(question.question);
    const hasMathWords = /\b(add|subtract|plus|minus|total|sum|difference|calculate|solve|equals?)\b/i.test(question.question);
    const hasMathSymbols = /[\+\-\*\/=]/.test(question.question);
    
    return hasNumbers || hasMathWords || hasMathSymbols;
  }

  /**
   * Basic question validation
   */
  isValidQuestion(question) {
    return question.question && 
           question.options && 
           question.options.length === 4 && 
           question.correctIndex >= 0 && 
           question.correctIndex < 4;
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

  async listModels() {
    try {
      const response = await this.ollama.list();
      return response.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
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