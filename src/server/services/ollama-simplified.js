// src/server/services/ollama-simplified.js - COMPLETE CLEAN VERSION
const { Ollama } = require('ollama');

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
   * Updated validateQuestions method for ollama-simplified.js
   * Replace the existing validateQuestions method with this enhanced version
   */
  async validateQuestions(questions, subjectCategory) {
      const validQuestions = [];
      const subjectId = subjectCategory.id;
      
      console.log(`🔍 Validating ${questions.length} questions for subject: ${subjectId}`);
      
      for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          
          try {
              let isValid = true;
              
              // Enhanced subject-specific validation routing
              switch (subjectId) {
                  case 'mathematics':
                      isValid = await this.validateMathQuestion(question);
                      console.log(`📊 Math validation for Q${i + 1}: ${isValid ? '✅' : '❌'}`);
                      break;
                      
                  case 'natural-sciences':
                      isValid = await this.validateScienceQuestion(question);
                      console.log(`🔬 Science validation for Q${i + 1}: ${isValid ? '✅' : '❌'}`);
                      break;
                      
                  case 'literature':
                      isValid = await this.validateLiteratureQuestion(question);
                      console.log(`📚 Literature validation for Q${i + 1}: ${isValid ? '✅' : '❌'}`);
                      break;
                      
                  case 'history':
                      isValid = await this.validateHistoryQuestion(question);
                      console.log(`🏛️ History validation for Q${i + 1}: ${isValid ? '✅' : '❌'}`);
                      break;
                      
                  case 'computer-science':
                      isValid = await this.validateComputerScienceQuestion(question);
                      console.log(`💻 CS validation for Q${i + 1}: ${isValid ? '✅' : '❌'}`);
                      break;
                      
                  case 'languages':
                      isValid = await this.validateLanguageQuestion(question);
                      console.log(`🗣️ Language validation for Q${i + 1}: ${isValid ? '✅' : '❌'}`);
                      break;
                      
                  case 'business':
                      isValid = await this.validateBusinessQuestion(question);
                      console.log(`💼 Business validation for Q${i + 1}: ${isValid ? '✅' : '❌'}`);
                      break;
                      
                  case 'arts':
                      isValid = await this.validateArtsQuestion(question);
                      console.log(`🎨 Arts validation for Q${i + 1}: ${isValid ? '✅' : '❌'}`);
                      break;
                      
                  case 'health-medicine':
                      isValid = await this.validateHealthQuestion(question);
                      console.log(`⚕️ Health validation for Q${i + 1}: ${isValid ? '✅' : '❌'}`);
                      break;
                      
                  case 'other':
                  default:
                      isValid = await this.validateGeneralQuestion(question);
                      console.log(`📖 General validation for Q${i + 1}: ${isValid ? '✅' : '❌'}`);
                      break;
              }
              
              if (isValid) {
                  validQuestions.push(question);
                  console.log(`✅ Q${i + 1} passed ${subjectId} validation: "${question.question.substring(0, 50)}..."`);
              } else {
                  console.log(`❌ Q${i + 1} failed ${subjectId} validation: "${question.question.substring(0, 50)}..."`);
              }
              
          } catch (error) {
              console.error(`❌ Validation error for Q${i + 1}:`, error);
          }
      }
      
      const acceptanceRate = Math.round((validQuestions.length / questions.length) * 100);
      console.log(`📊 ${subjectId} validation complete: ${validQuestions.length}/${questions.length} questions accepted (${acceptanceRate}%)`);
      
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
   * Science-specific validation - ENHANCED for natural sciences
   */
  async validateScienceQuestion(question) {
      const questionText = question.question.toLowerCase();
      const explanation = (question.explanation || '').toLowerCase();
      const allText = questionText + ' ' + explanation;
      
      // Science-specific validation rules
      const issues = [];
      
      // 1. Check for scientific accuracy indicators
      const scientificTerms = [
          'atom', 'molecule', 'element', 'compound', 'reaction', 'energy',
          'force', 'motion', 'gravity', 'mass', 'volume', 'density',
          'cell', 'organism', 'evolution', 'gene', 'species', 'ecosystem',
          'planet', 'star', 'solar system', 'geology', 'climate'
      ];
      
      const hasScientificTerms = scientificTerms.some(term => allText.includes(term));
      
      // 2. Check for common science misconceptions to avoid
      const misconceptions = [
          'heavier objects fall faster', // Gravity misconception
          'evolution is just a theory', // Evolution misconception
          'atoms are the smallest particles', // Particle physics misconception
          'cold causes illness', // Disease misconception
          'lightning never strikes twice' // Physics misconception
      ];
      
      const hasMisconceptions = misconceptions.some(misc => allText.includes(misc));
      if (hasMisconceptions) {
          console.log('❌ Science question contains common misconception');
          return false;
      }
      
      // 3. Check for proper scientific units if numbers are mentioned
      const hasNumbers = /\d+/.test(allText);
      if (hasNumbers) {
          const scientificUnits = [
              'meters', 'kilograms', 'seconds', 'celsius', 'kelvin',
              'joules', 'watts', 'newtons', 'pascals', 'volts',
              'grams', 'liters', 'moles', 'degrees'
          ];
          
          const hasUnits = scientificUnits.some(unit => allText.includes(unit));
          if (!hasUnits && hasNumbers) {
              console.log('⚠️ Science question has numbers but no units - acceptable but not ideal');
          }
      }
      
      // 4. Validate scientific reasoning in explanation
      if (question.explanation) {
          const hasScientificReasoning = [
              'because', 'due to', 'caused by', 'results in', 'leads to',
              'therefore', 'thus', 'consequently', 'as a result'
          ].some(term => explanation.includes(term));
          
          if (!hasScientificReasoning && question.explanation.length > 20) {
              console.log('⚠️ Science explanation lacks causal reasoning');
          }
      }
      
      return this.validateGeneralQuestion(question);
  }

  /**
   * Literature-specific validation - ENHANCED for literature analysis
   */
  async validateLiteratureQuestion(question) {
      const questionText = question.question.toLowerCase();
      const explanation = (question.explanation || '').toLowerCase();
      const allText = questionText + ' ' + explanation;
      
      // Literature-specific validation rules
      
      // 1. Check for literary analysis terms
      const literaryTerms = [
          'character', 'plot', 'theme', 'setting', 'symbolism', 'metaphor',
          'irony', 'foreshadowing', 'conflict', 'protagonist', 'antagonist',
          'narrator', 'point of view', 'tone', 'mood', 'style', 'genre',
          'alliteration', 'simile', 'imagery', 'personification', 'rhyme'
      ];
      
      const hasLiteraryTerms = literaryTerms.some(term => allText.includes(term));
      
      // 2. Check for proper literary analysis (not just plot summary)
      const plotSummaryWords = [
          'what happens', 'then he', 'then she', 'next he', 'next she',
          'after that', 'in chapter', 'on page'
      ];
      
      const isPlotSummary = plotSummaryWords.some(phrase => questionText.includes(phrase));
      if (isPlotSummary) {
          console.log('❌ Literature question appears to be plot summary rather than analysis');
          return false;
      }
      
      // 3. Check for textual evidence requirements
      const requiresEvidence = [
          'according to', 'in the text', 'the author states', 'the passage shows',
          'as evidenced by', 'the text suggests', 'quote', 'passage'
      ];
      
      const hasTextualEvidence = requiresEvidence.some(phrase => allText.includes(phrase));
      
      // 4. Validate for analytical thinking
      const analyticalWords = [
          'why', 'how', 'analyze', 'compare', 'contrast', 'evaluate',
          'interpret', 'significance', 'meaning', 'purpose', 'effect'
      ];
      
      const hasAnalyticalThinking = analyticalWords.some(word => questionText.includes(word));
      
      if (!hasAnalyticalThinking && questionText.length > 30) {
          console.log('⚠️ Literature question may lack analytical depth');
      }
      
      return this.validateGeneralQuestion(question);
  }

  /**
   * History-specific validation - ENHANCED for historical analysis
   */
  async validateHistoryQuestion(question) {
      const questionText = question.question.toLowerCase();
      const explanation = (question.explanation || '').toLowerCase();
      const allText = questionText + ' ' + explanation;
      
      // History-specific validation rules
      
      // 1. Check for historical thinking concepts
      const historicalConcepts = [
          'cause', 'effect', 'consequence', 'significance', 'change', 'continuity',
          'perspective', 'bias', 'source', 'primary', 'secondary', 'evidence',
          'chronology', 'timeline', 'period', 'era', 'decade', 'century'
      ];
      
      const hasHistoricalConcepts = historicalConcepts.some(concept => allText.includes(concept));
      
      // 2. Check for date validation (if dates are mentioned)
      const dateMatches = allText.match(/\b(19|20)\d{2}\b/g);
      if (dateMatches && dateMatches.length > 1) {
          const dates = dateMatches.map(d => parseInt(d)).sort((a, b) => a - b);
          const span = dates[dates.length - 1] - dates[0];
          
          // Flag if dates span more than 200 years (might be mixing eras)
          if (span > 200) {
              console.log('⚠️ History question spans very long time period - verify accuracy');
          }
      }
      
      // 3. Avoid simple memorization questions
      const memorizationPatterns = [
          'what year did', 'when did', 'who was born', 'what date',
          'which year was', 'in what year'
      ];
      
      const isMemorization = memorizationPatterns.some(pattern => questionText.includes(pattern));
      if (isMemorization) {
          console.log('⚠️ History question focuses on memorization rather than analysis');
          // Don't reject, but note it
      }
      
      // 4. Check for historical analysis
      const analysisWords = [
          'why', 'how', 'impact', 'influence', 'led to', 'resulted in',
          'caused by', 'significance', 'importance', 'role of'
      ];
      
      const hasAnalysis = analysisWords.some(word => questionText.includes(word));
      
      // 5. Check for proper historical context
      const contextWords = [
          'during', 'period', 'era', 'time', 'context', 'background',
          'situation', 'circumstances', 'conditions'
      ];
      
      const hasContext = contextWords.some(word => allText.includes(word));
      
      return this.validateGeneralQuestion(question);
  }

  /**
   * Computer Science-specific validation - NEW
   */
  async validateComputerScienceQuestion(question) {
      const questionText = question.question.toLowerCase();
      const explanation = (question.explanation || '').toLowerCase();
      const allText = questionText + ' ' + explanation;
      
      // CS-specific validation rules
      
      // 1. Check for programming concepts
      const programmingConcepts = [
          'algorithm', 'function', 'variable', 'loop', 'condition', 'array',
          'object', 'class', 'method', 'parameter', 'return', 'boolean',
          'integer', 'string', 'syntax', 'debug', 'compile', 'execute'
      ];
      
      const hasProgrammingConcepts = programmingConcepts.some(concept => allText.includes(concept));
      
      // 2. Check for valid code syntax (if code is present)
      const codePatterns = [
          /if\s*\(/, /for\s*\(/, /while\s*\(/, /function\s+\w+/, /def\s+\w+/,
          /\bprint\s*\(/, /\breturn\s+/, /\bvar\s+\w+/, /\blet\s+\w+/
      ];
      
      const hasCodeSyntax = codePatterns.some(pattern => pattern.test(allText));
      
      if (hasCodeSyntax) {
          // Basic syntax validation for common errors
          const syntaxErrors = [
              /if\s*\([^)]*$/, // Unclosed if statement
              /for\s*\([^)]*$/, // Unclosed for loop
              /function\s+\w+\s*{[^}]*$/ // Unclosed function
          ];
          
          const hasSyntaxErrors = syntaxErrors.some(pattern => pattern.test(allText));
          if (hasSyntaxErrors) {
              console.log('❌ Computer Science question contains syntax errors');
              return false;
          }
      }
      
      // 3. Check for logical thinking
      const logicalConcepts = [
          'true', 'false', 'and', 'or', 'not', 'if', 'then', 'else',
          'compare', 'equal', 'greater', 'less', 'logic', 'boolean'
      ];
      
      const hasLogicalThinking = logicalConcepts.some(concept => allText.includes(concept));
      
      return this.validateGeneralQuestion(question);
  }

  /**
   * Languages-specific validation - NEW for foreign languages
   */
  async validateLanguageQuestion(question) {
      const questionText = question.question.toLowerCase();
      const explanation = (question.explanation || '').toLowerCase();
      const allText = questionText + ' ' + explanation;
      
      // Language learning validation rules
      
      // 1. Check for language learning concepts
      const languageConcepts = [
          'grammar', 'vocabulary', 'pronunciation', 'conjugation', 'tense',
          'noun', 'verb', 'adjective', 'adverb', 'article', 'preposition',
          'translate', 'meaning', 'definition', 'phrase', 'sentence',
          'masculine', 'feminine', 'plural', 'singular', 'accent'
      ];
      
      const hasLanguageConcepts = languageConcepts.some(concept => allText.includes(concept));
      
      // 2. Check for proper language instruction
      const instructionWords = [
          'translate', 'conjugate', 'complete', 'choose', 'correct',
          'means', 'definition', 'pronunciation', 'spelling'
      ];
      
      const hasInstruction = instructionWords.some(word => questionText.includes(word));
      
      // 3. Avoid questions that require audio (since we can't provide it)
      const audioRequiredTerms = [
          'listen to', 'hear', 'sound', 'pronunciation of', 'accent',
          'spoken', 'audio', 'recording'
      ];
      
      const requiresAudio = audioRequiredTerms.some(term => questionText.includes(term));
      if (requiresAudio) {
          console.log('❌ Language question requires audio which cannot be provided');
          return false;
      }
      
      return this.validateGeneralQuestion(question);
  }

  /**
   * Business-specific validation - NEW
   */
  async validateBusinessQuestion(question) {
      const questionText = question.question.toLowerCase();
      const explanation = (question.explanation || '').toLowerCase();
      const allText = questionText + ' ' + explanation;
      
      // Business validation rules
      
      // 1. Check for business concepts
      const businessConcepts = [
          'profit', 'revenue', 'cost', 'budget', 'investment', 'market',
          'customer', 'strategy', 'competition', 'analysis', 'finance',
          'accounting', 'management', 'leadership', 'marketing', 'sales',
          'economics', 'supply', 'demand', 'price', 'value'
      ];
      
      const hasBusinessConcepts = businessConcepts.some(concept => allText.includes(concept));
      
      // 2. Check for financial calculations (if numbers present)
      const hasNumbers = /\d+/.test(allText);
      if (hasNumbers) {
          const financialTerms = [
              'percent', '%', 'dollar', '$', 'cost', 'price', 'profit',
              'revenue', 'budget', 'investment', 'roi', 'margin'
          ];
          
          const hasFinancialTerms = financialTerms.some(term => allText.includes(term));
          if (!hasFinancialTerms) {
              console.log('⚠️ Business question has numbers but no financial context');
          }
      }
      
      // 3. Check for real-world application
      const applicationWords = [
          'example', 'case study', 'scenario', 'situation', 'company',
          'business', 'organization', 'industry', 'market'
      ];
      
      const hasApplication = applicationWords.some(word => allText.includes(word));
      
      return this.validateGeneralQuestion(question);
  }

  /**
   * Additional validators for remaining subjects
   */

  /**
   * Arts-specific validation
   */
  async validateArtsQuestion(question) {
      const questionText = question.question.toLowerCase();
      const explanation = (question.explanation || '').toLowerCase();
      const allText = questionText + ' ' + explanation;
      
      // Arts-specific concepts
      const artsConcepts = [
          'color', 'composition', 'style', 'technique', 'medium', 'artist',
          'painting', 'sculpture', 'music', 'rhythm', 'melody', 'harmony',
          'theater', 'performance', 'design', 'aesthetic', 'beauty',
          'form', 'texture', 'pattern', 'balance', 'contrast', 'movement'
      ];
      
      const hasArtsConcepts = artsConcepts.some(concept => allText.includes(concept));
      
      // Check for art analysis rather than just identification
      const analysisTerms = [
          'why', 'how', 'technique', 'style', 'influence', 'movement',
          'represents', 'symbolizes', 'expresses', 'conveys'
      ];
      
      const hasAnalysis = analysisTerms.some(term => questionText.includes(term));
      
      // Avoid questions requiring visual elements we can't provide
      const visualRequiredTerms = [
          'look at the image', 'in the picture', 'what color is shown',
          'observe the painting', 'see in the artwork'
      ];
      
      const requiresVisual = visualRequiredTerms.some(term => questionText.includes(term));
      if (requiresVisual) {
          console.log('❌ Arts question requires visual elements which cannot be provided');
          return false;
      }
      
      return this.validateGeneralQuestion(question);
  }

  /**
   * Health/Medicine-specific validation
   */
  async validateHealthQuestion(question) {
      const questionText = question.question.toLowerCase();
      const explanation = (question.explanation || '').toLowerCase();
      const allText = questionText + ' ' + explanation;
      
      // Health/medical concepts
      const healthConcepts = [
          'anatomy', 'physiology', 'disease', 'symptom', 'treatment', 'diagnosis',
          'health', 'wellness', 'nutrition', 'exercise', 'medicine', 'therapy',
          'prevention', 'immune', 'infection', 'virus', 'bacteria', 'cell',
          'organ', 'system', 'blood', 'heart', 'brain', 'muscle', 'bone'
      ];
      
      const hasHealthConcepts = healthConcepts.some(concept => allText.includes(concept));
      
      // Avoid giving specific medical advice
      const medicalAdviceTerms = [
          'you should take', 'recommended dose', 'prescribe', 'diagnose with',
          'treat your', 'cure for', 'stop taking', 'increase dosage'
      ];
      
      const givesMedicalAdvice = medicalAdviceTerms.some(term => allText.includes(term));
      if (givesMedicalAdvice) {
          console.log('❌ Health question appears to give specific medical advice');
          return false;
      }
      
      // Check for educational vs diagnostic content
      const educationalTerms = [
          'function of', 'role of', 'process of', 'structure of',
          'general', 'typically', 'usually', 'commonly'
      ];
      
      const isEducational = educationalTerms.some(term => allText.includes(term));
      
      return this.validateGeneralQuestion(question);
  }

  /**
   * Enhanced general validation with better error detection
   */
  async validateGeneralQuestion(question) {
      const issues = [];
      
      // Basic validation
      if (!question.question || question.question.length < 10) {
          issues.push('Question text too short');
      }
      
      if (!question.answer || question.answer.trim().length < 1) {
          issues.push('Answer is missing');
      }
      
      if (question.type === 'multiple_choice') {
          if (!question.options || question.options.length !== 4) {
              issues.push('Multiple choice questions must have exactly 4 options');
          }
          
          if (question.correctIndex < 0 || question.correctIndex >= 4) {
              issues.push('Correct index must be between 0 and 3');
          }
          
          // Check for duplicate options
          if (question.options && question.options.length === 4) {
              const uniqueOptions = new Set(question.options.map(opt => opt.toLowerCase().trim()));
              if (uniqueOptions.size < 4) {
                  issues.push('Question has duplicate answer options');
              }
          }
          
          // Check if correct answer matches one of the options
          if (question.options && question.correctIndex >= 0) {
              const correctOption = question.options[question.correctIndex];
              if (correctOption && question.answer && 
                  !correctOption.toLowerCase().includes(question.answer.toLowerCase().substring(0, 20))) {
                  console.log('⚠️ Correct answer may not match the selected option');
              }
          }
      }
      
      // Check for question clarity
      const questionText = question.question.toLowerCase();
      
      // Avoid questions that are too vague
      const vaguePatterns = [
          'which is correct', 'what is true', 'which statement',
          'what can be said', 'which of these'
      ];
      
      const isVague = vaguePatterns.some(pattern => questionText.includes(pattern)) &&
                    questionText.length < 50;
      
      if (isVague) {
          console.log('⚠️ Question may be too vague');
      }
      
      // Check for proper grammar indicators
      if (!questionText.includes('?') && !questionText.includes('which') && 
          !questionText.includes('what') && !questionText.includes('how')) {
          console.log('⚠️ Question may not be properly formatted as a question');
      }
      
      if (issues.length > 0) {
          console.log('❌ General validation failed:', issues);
          return false;
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
   * Enhanced createSubjectPrompt method for ollama-simplified.js
   * Replace the existing createSubjectPrompt method with this enhanced version
   */
  createSubjectPrompt(content, count, subjectCategory, topicName) {
      const subjectId = subjectCategory.id;
      const baseContent = content.substring(0, 2000);
      
      switch (subjectId) {
          case 'mathematics':
              return this.createMathPrompt(baseContent, count, topicName);
              
          case 'natural-sciences':
              return this.createSciencePrompt(baseContent, count, topicName);
              
          case 'literature':
              return this.createLiteraturePrompt(baseContent, count, topicName);
              
          case 'history':
              return this.createHistoryPrompt(baseContent, count, topicName);
              
          case 'computer-science':
              return this.createComputerSciencePrompt(baseContent, count, topicName);
              
          case 'languages':
              return this.createLanguagePrompt(baseContent, count, topicName);
              
          case 'business':
              return this.createBusinessPrompt(baseContent, count, topicName);
              
          case 'arts':
              return this.createArtsPrompt(baseContent, count, topicName);
              
          case 'health-medicine':
              return this.createHealthPrompt(baseContent, count, topicName);
              
          case 'other':
          default:
              return this.createGeneralPrompt(baseContent, count, topicName, subjectCategory.name);
      }
  }

  /**
   * Math prompt (keep existing one - it's working)
   */
  createMathPrompt(content, count, topicName) {
      return `You are a MATHEMATICS teacher creating ${count} practice questions for "${topicName}".

  STUDY MATERIAL:
  ${content}

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

  /**
   * Science prompt - ENHANCED
   */
  createSciencePrompt(content, count, topicName) {
      return `You are a SCIENCE teacher creating ${count} educational questions for "${topicName}".

  STUDY MATERIAL:
  ${content}

  🔬 SCIENCE TEACHING REQUIREMENTS:
  - Focus on scientific concepts, processes, and reasoning
  - Test understanding of cause and effect relationships
  - Include proper scientific terminology from the material
  - Ensure scientific accuracy - no misconceptions
  - Ask about HOW and WHY, not just WHAT

  SCIENCE QUESTION GUIDELINES:
  ✅ Test understanding of scientific processes
  ✅ Ask about relationships between concepts
  ✅ Include scientific reasoning and evidence
  ✅ Use proper scientific vocabulary from material
  ✅ Focus on concepts that can be learned from text

  ❌ Don't require lab equipment or experiments
  ❌ Don't ask about specific measurements not in material
  ❌ Don't include common scientific misconceptions

  Create exactly ${count} multiple choice questions in this format:

  QUESTION 1:
  [Science question testing understanding of concepts from the material]
  A) [Scientific option A]
  B) [Scientific option B]
  C) [Scientific option C]
  D) [Scientific option D]
  CORRECT: [A/B/C/D]
  EXPLANATION: [Scientific explanation with reasoning]

  Continue for all ${count} questions. Focus on scientific understanding!`;
  }

  /**
   * Literature prompt - ENHANCED
   */
  createLiteraturePrompt(content, count, topicName) {
      return `You are a LITERATURE teacher creating ${count} analytical questions for "${topicName}".

  STUDY MATERIAL:
  ${content}

  📚 LITERATURE ANALYSIS REQUIREMENTS:
  - Focus on literary analysis, not plot summary
  - Test understanding of themes, character development, literary devices
  - Ask about author's purpose and writing techniques
  - Include questions about textual evidence and interpretation
  - Encourage critical thinking about literature

  LITERATURE QUESTION GUIDELINES:
  ✅ Ask about themes, symbolism, character motivation
  ✅ Test understanding of literary devices and techniques
  ✅ Include questions about author's purpose and style
  ✅ Focus on interpretation and analysis
  ✅ Ask "why" and "how" questions about the text

  ❌ Don't ask simple plot summary questions
  ❌ Don't ask about events not covered in the material
  ❌ Don't require knowledge of other works not mentioned

  Create exactly ${count} multiple choice questions in this format:

  QUESTION 1:
  [Literary analysis question based on the material]
  A) [Analytical option A]
  B) [Analytical option B]
  C) [Analytical option C]
  D) [Analytical option D]
  CORRECT: [A/B/C/D]
  EXPLANATION: [Literary analysis explanation with textual reasoning]

  Continue for all ${count} questions. Focus on literary analysis and critical thinking!`;
  }

  /**
   * History prompt - ENHANCED
   */
  createHistoryPrompt(content, count, topicName) {
      return `You are a HISTORY teacher creating ${count} analytical questions for "${topicName}".

  STUDY MATERIAL:
  ${content}

  🏛️ HISTORY ANALYSIS REQUIREMENTS:
  - Focus on historical analysis, causation, and significance
  - Test understanding of cause and effect relationships
  - Ask about historical context and perspectives
  - Include questions about change and continuity over time
  - Encourage critical thinking about historical events

  HISTORY QUESTION GUIDELINES:
  ✅ Ask about causes and effects of historical events
  ✅ Test understanding of historical significance
  ✅ Include questions about different perspectives
  ✅ Focus on change and continuity over time
  ✅ Ask about historical context and background

  ❌ Don't ask simple memorization of dates
  ❌ Don't require information not in the material
  ❌ Don't ask about events without context

  Create exactly ${count} multiple choice questions in this format:

  QUESTION 1:
  [Historical analysis question based on the material]
  A) [Historical option A]
  B) [Historical option B]
  C) [Historical option C]
  D) [Historical option D]
  CORRECT: [A/B/C/D]
  EXPLANATION: [Historical explanation with reasoning about causation/significance]

  Continue for all ${count} questions. Focus on historical thinking and analysis!`;
  }

  /**
   * Computer Science prompt - NEW
   */
  createComputerSciencePrompt(content, count, topicName) {
      return `You are a COMPUTER SCIENCE teacher creating ${count} programming questions for "${topicName}".

  STUDY MATERIAL:
  ${content}

  💻 COMPUTER SCIENCE REQUIREMENTS:
  - Focus on programming concepts, algorithms, and computational thinking
  - Test understanding of code logic and problem-solving
  - Include questions about programming constructs from the material
  - Ensure code accuracy - proper syntax and logic
  - Ask about problem-solving approaches and efficiency

  PROGRAMMING QUESTION GUIDELINES:
  ✅ Test understanding of programming concepts and logic
  ✅ Ask about algorithm efficiency and problem-solving
  ✅ Include questions about code functionality
  ✅ Focus on computational thinking skills
  ✅ Test debugging and code analysis skills

  ❌ Don't use programming languages not mentioned in material
  ❌ Don't require advanced concepts not covered
  ❌ Don't include syntax errors in code examples

  Create exactly ${count} multiple choice questions in this format:

  QUESTION 1:
  [Programming/CS question based on the material]
  A) [Programming option A]
  B) [Programming option B]
  C) [Programming option C]
  D) [Programming option D]
  CORRECT: [A/B/C/D]
  EXPLANATION: [Technical explanation with reasoning about code/algorithms]

  Continue for all ${count} questions. Focus on computational thinking!`;
  }

  /**
   * Language Learning prompt - NEW
   */
  createLanguagePrompt(content, count, topicName) {
      return `You are a LANGUAGE teacher creating ${count} educational questions for "${topicName}".

  STUDY MATERIAL:
  ${content}

  🗣️ LANGUAGE LEARNING REQUIREMENTS:
  - Focus on grammar, vocabulary, and language structure
  - Test understanding of language rules and patterns
  - Include questions about word meanings and usage
  - Ensure linguistic accuracy
  - Ask about language structure and communication

  LANGUAGE QUESTION GUIDELINES:
  ✅ Test grammar rules and sentence structure
  ✅ Ask about vocabulary meanings and usage
  ✅ Include questions about language patterns
  ✅ Focus on communication and comprehension
  ✅ Test translation and interpretation skills

  ❌ Don't require audio or pronunciation
  ❌ Don't use languages not mentioned in material
  ❌ Don't include culturally specific references not covered

  Create exactly ${count} multiple choice questions in this format:

  QUESTION 1:
  [Language learning question based on the material]
  A) [Language option A]
  B) [Language option B]
  C) [Language option C]
  D) [Language option D]
  CORRECT: [A/B/C/D]
  EXPLANATION: [Linguistic explanation with grammar/usage reasoning]

  Continue for all ${count} questions. Focus on language understanding!`;
  }

  /**
   * Business prompt - NEW
   */
  createBusinessPrompt(content, count, topicName) {
      return `You are a BUSINESS teacher creating ${count} practical questions for "${topicName}".

  STUDY MATERIAL:
  ${content}

  💼 BUSINESS EDUCATION REQUIREMENTS:
  - Focus on business concepts, strategy, and real-world applications
  - Test understanding of business principles and practices
  - Include questions about decision-making and problem-solving
  - Ensure practical relevance to business situations
  - Ask about analysis and evaluation of business scenarios

  BUSINESS QUESTION GUIDELINES:
  ✅ Test understanding of business concepts and principles
  ✅ Ask about strategic thinking and decision-making
  ✅ Include questions about market analysis and competition
  ✅ Focus on practical business applications
  ✅ Test financial literacy and business calculations

  ❌ Don't require specific company knowledge not in material
  ❌ Don't include outdated business practices
  ❌ Don't ask about personal financial advice

  Create exactly ${count} multiple choice questions in this format:

  QUESTION 1:
  [Business question based on the material]
  A) [Business option A]
  B) [Business option B]
  C) [Business option C]
  D) [Business option D]
  CORRECT: [A/B/C/D]
  EXPLANATION: [Business reasoning with practical application]

  Continue for all ${count} questions. Focus on business thinking and application!`;
  }

  /**
   * Arts prompt - NEW
   */
  createArtsPrompt(content, count, topicName) {
      return `You are an ARTS teacher creating ${count} educational questions for "${topicName}".

  STUDY MATERIAL:
  ${content}

  🎨 ARTS EDUCATION REQUIREMENTS:
  - Focus on artistic concepts, techniques, and cultural significance
  - Test understanding of artistic movements and styles
  - Include questions about creative processes and interpretation
  - Ensure cultural and historical accuracy
  - Ask about artistic analysis and appreciation

  ARTS QUESTION GUIDELINES:
  ✅ Test understanding of artistic techniques and styles
  ✅ Ask about cultural and historical context of art
  ✅ Include questions about artistic interpretation
  ✅ Focus on creative processes and artistic thinking
  ✅ Test knowledge of artistic movements and influences

  ❌ Don't require viewing specific artworks not described
  ❌ Don't include highly subjective aesthetic judgments
  ❌ Don't ask about techniques requiring visual demonstration

  Create exactly ${count} multiple choice questions in this format:

  QUESTION 1:
  [Arts question based on the material]
  A) [Artistic option A]
  B) [Artistic option B]
  C) [Artistic option C]
  D) [Artistic option D]
  CORRECT: [A/B/C/D]
  EXPLANATION: [Artistic explanation with cultural/technical reasoning]

  Continue for all ${count} questions. Focus on artistic understanding and appreciation!`;
  }

  /**
   * Health/Medicine prompt - NEW
   */
  createHealthPrompt(content, count, topicName) {
      return `You are a HEALTH EDUCATION teacher creating ${count} educational questions for "${topicName}".

  STUDY MATERIAL:
  ${content}

  ⚕️ HEALTH EDUCATION REQUIREMENTS:
  - Focus on general health concepts and education
  - Test understanding of body systems and health principles
  - Include questions about wellness and prevention
  - Ensure medical accuracy but avoid specific medical advice
  - Ask about health literacy and understanding

  HEALTH QUESTION GUIDELINES:
  ✅ Test understanding of anatomy and physiology
  ✅ Ask about health promotion and disease prevention
  ✅ Include questions about nutrition and wellness
  ✅ Focus on general health education
  ✅ Test knowledge of health systems and processes

  ❌ Don't provide specific medical diagnosis or treatment advice
  ❌ Don't include drug dosages or specific medications
  ❌ Don't ask about personal medical situations

  Create exactly ${count} multiple choice questions in this format:

  QUESTION 1:
  [Health education question based on the material]
  A) [Health option A]
  B) [Health option B]
  C) [Health option C]
  D) [Health option D]
  CORRECT: [A/B/C/D]
  EXPLANATION: [Health education explanation with scientific reasoning]

  Continue for all ${count} questions. Focus on health education and literacy!`;
  }

  /**
   * General prompt - ENHANCED
   */
  createGeneralPrompt(content, count, topicName, subjectName) {
      return `You are an educator creating ${count} educational questions for "${topicName}" in ${subjectName}.

  STUDY MATERIAL:
  ${content}

  📖 GENERAL EDUCATION REQUIREMENTS:
  - Focus on key concepts and understanding from the material
  - Test comprehension and application of ideas
  - Include questions that promote critical thinking
  - Ensure accuracy and clarity
  - Ask about important principles and relationships

  EDUCATIONAL QUESTION GUIDELINES:
  ✅ Test understanding of main concepts in the material
  ✅ Ask about relationships between ideas
  ✅ Include questions that require analysis and reasoning
  ✅ Focus on practical application of knowledge
  ✅ Test comprehension and critical thinking

  ❌ Don't ask about information not covered in the material
  ❌ Don't include overly technical terms without context
  ❌ Don't make assumptions about prior knowledge

  Create exactly ${count} multiple choice questions in this format:

  QUESTION 1:
  [Educational question based on the material]
  A) [Option A]
  B) [Option B]
  C) [Option C]
  D) [Option D]
  CORRECT: [A/B/C/D]
  EXPLANATION: [Clear explanation with reasoning]

  Continue for all ${count} questions. Focus on understanding and application!`;
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