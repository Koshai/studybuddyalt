// src/server/services/question-validation.js
// Handles all question validation logic for different subjects

class QuestionValidator {
  constructor() {
    console.log('✅ QuestionValidator initialized');
  }

  /**
   * Main validation method - routes to subject-specific validators
   */
  async validateQuestions(questions, subjectCategory) {
    const validatedQuestions = [];
    
    console.log(`🔍 Validating ${questions.length} questions for ${subjectCategory.id}`);
    
    for (const question of questions) {
      const isValid = await this.validateSingleQuestion(question, subjectCategory);
      if (isValid) {
        validatedQuestions.push(question);
      }
    }
    
    return validatedQuestions;
  }

  /**
   * Validate a single question based on subject
   */
  async validateSingleQuestion(question, subjectCategory) {
    const subjectId = subjectCategory.id;
    
    try {
      switch (subjectId) {
        case 'mathematics':
          return await this.validateMathQuestion(question);
        case 'natural-sciences':
          return await this.validateScienceQuestion(question);
        case 'literature':
          return await this.validateLiteratureQuestion(question);
        case 'history':
          return await this.validateHistoryQuestion(question);
        case 'computer-science':
          return await this.validateComputerScienceQuestion(question);
        case 'languages':
          return await this.validateLanguageQuestion(question);
        case 'business':
          return await this.validateBusinessQuestion(question);
        case 'arts':
          return await this.validateArtsQuestion(question);
        case 'health-medicine':
          return await this.validateHealthQuestion(question);
        default:
          return await this.validateGeneralQuestion(question);
      }
    } catch (error) {
      console.error('❌ Error validating question:', error);
      return false;
    }
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
}

module.exports = QuestionValidator;