// src/server/services/ai/validators/math.js
// Mathematics Question Validator - Ensures math questions stay within scope

class MathQuestionValidator {
  constructor() {
    this.operationPatterns = {
      addition: ['+', 'add', 'sum', 'plus', 'total'],
      subtraction: ['-', 'subtract', 'minus', 'difference', 'take away'],
      multiplication: ['×', '*', 'multiply', 'times', 'product'],
      division: ['÷', '/', 'divide', 'divided by', 'quotient'],
      fractions: ['/', 'fraction', 'half', 'quarter', 'third'],
      decimals: ['.', 'decimal', 'point'],
      percentages: ['%', 'percent', 'percentage']
    };
  }

  /**
   * Validate a math question against content scope
   */
  validateQuestion(question, contentScope) {
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Extract mathematical content from question
      const mathContent = this.extractMathContent(question);
      
      // Validate operations
      this.validateOperations(mathContent, contentScope, validationResult);
      
      // Validate numerical complexity
      this.validateNumericalComplexity(mathContent, contentScope, validationResult);
      
      // Validate answer correctness (CRITICAL for fixing 7+9=18 errors)
      this.validateAnswerCorrectness(question, validationResult);
      
      // Validate educational level appropriateness
      this.validateEducationalLevel(mathContent, contentScope, validationResult);
      
      // Final validity check
      validationResult.isValid = validationResult.errors.length === 0;
      
      return validationResult;
      
    } catch (error) {
      console.error('❌ Error validating math question:', error);
      validationResult.isValid = false;
      validationResult.errors.push('Validation error occurred');
      return validationResult;
    }
  }

  /**
   * Extract mathematical content from question
   */
  extractMathContent(question) {
    const questionText = question.question.toLowerCase();
    const answerText = question.answer.toLowerCase();
    const allOptions = question.options ? question.options.join(' ').toLowerCase() : '';
    
    const fullText = `${questionText} ${answerText} ${allOptions}`;
    
    return {
      text: fullText,
      numbers: this.extractNumbers(fullText),
      operations: this.detectOperations(fullText),
      hasWordProblem: this.isWordProblem(questionText),
      complexity: this.assessComplexity(fullText)
    };
  }

  /**
   * Extract numbers from text
   */
  extractNumbers(text) {
    const numberMatches = text.match(/\b\d+(\.\d+)?\b/g);
    if (!numberMatches) return [];
    
    return numberMatches.map(num => ({
      value: parseFloat(num),
      isDecimal: num.includes('.'),
      digitCount: num.replace('.', '').length
    }));
  }

  /**
   * Detect mathematical operations in text
   */
  detectOperations(text) {
    const detectedOps = [];
    
    for (const [operation, patterns] of Object.entries(this.operationPatterns)) {
      for (const pattern of patterns) {
        if (text.includes(pattern)) {
          detectedOps.push(operation);
          break;
        }
      }
    }
    
    return [...new Set(detectedOps)]; // Remove duplicates
  }

  /**
   * Check if question is a word problem
   */
  isWordProblem(questionText) {
    const wordProblemIndicators = [
      'john has', 'mary bought', 'there are', 'if you have',
      'a farmer', 'a store', 'students in', 'books on',
      'apples in', 'cookies in', 'how many', 'how much'
    ];
    
    return wordProblemIndicators.some(indicator => 
      questionText.includes(indicator)
    );
  }

  /**
   * Assess mathematical complexity
   */
  assessComplexity(text) {
    let complexity = 0;
    
    // Multi-step problems
    if (text.includes('then') || text.includes('after') || text.includes('next')) {
      complexity += 2;
    }
    
    // Multiple operations
    const operations = this.detectOperations(text);
    if (operations.length > 1) {
      complexity += operations.length;
    }
    
    // Large numbers
    const numbers = this.extractNumbers(text);
    const maxNumber = Math.max(...numbers.map(n => n.value), 0);
    if (maxNumber > 100) complexity += 2;
    if (maxNumber > 1000) complexity += 3;
    
    // Decimals or fractions
    if (operations.includes('decimals') || operations.includes('fractions')) {
      complexity += 2;
    }
    
    return complexity;
  }

  /**
   * Validate operations against allowed scope
   */
  validateOperations(mathContent, contentScope, result) {
    const allowedOps = contentScope.operationsShown || [];
    const detectedOps = mathContent.operations;
    
    for (const operation of detectedOps) {
      const isAllowed = allowedOps.some(allowed => 
        allowed.toLowerCase().includes(operation) || 
        operation.includes(allowed.toLowerCase())
      );
      
      if (!isAllowed) {
        result.errors.push(
          `Question uses ${operation} but content only covers: ${allowedOps.join(', ')}`
        );
      }
    }
  }

  /**
   * Validate numerical complexity
   */
  validateNumericalComplexity(mathContent, contentScope, result) {
    const numbers = mathContent.numbers;
    if (numbers.length === 0) return;
    
    const maxNumber = Math.max(...numbers.map(n => n.value));
    const levelConstraints = this.getNumberConstraints(contentScope.educationalLevel);
    
    if (maxNumber > levelConstraints.maxNumber) {
      result.errors.push(
        `Numbers too large for ${contentScope.educationalLevel}: ${maxNumber} > ${levelConstraints.maxNumber}`
      );
    }
  }

  /**
   * Get number constraints for educational level
   */
  getNumberConstraints(level) {
    const constraints = {
      elementary: {
        maxNumber: 20,
        maxDigits: 2,
        allowDecimals: false
      },
      middle_school: {
        maxNumber: 100,
        maxDigits: 3,
        allowDecimals: true
      },
      high_school: {
        maxNumber: 10000,
        maxDigits: 5,
        allowDecimals: true
      },
      college: {
        maxNumber: Infinity,
        maxDigits: Infinity,
        allowDecimals: true
      }
    };
    
    return constraints[level] || constraints.middle_school;
  }

  /**
   * CRITICAL: Validate answer correctness (fixes 7+9=18 errors)
   */
  validateAnswerCorrectness(question, result) {
    if (question.type !== 'multiple_choice') return;
    
    try {
      // Extract mathematical expression and verify
      const questionText = question.question;
      const correctAnswer = question.answer;
      
      // Simple arithmetic validation
      const mathExpression = this.extractSimpleExpression(questionText);
      if (mathExpression) {
        const calculatedAnswer = this.evaluateExpression(mathExpression);
        const providedAnswer = this.extractNumberFromAnswer(correctAnswer);
        
        if (calculatedAnswer !== null && providedAnswer !== null) {
          if (Math.abs(calculatedAnswer - providedAnswer) > 0.01) {
            result.errors.push(
              `ARITHMETIC ERROR: Expected ${calculatedAnswer}, got ${providedAnswer}`
            );
          }
        }
      }
      
    } catch (error) {
      result.warnings.push('Could not verify answer correctness');
    }
  }

  /**
   * Extract simple mathematical expression (like "7 + 9")
   */
  extractSimpleExpression(text) {
    // Match expressions like "7 + 9", "15 - 8", etc.
    const patterns = [
      { regex: /(\d+)\s*\+\s*(\d+)/, operation: 'add' },
      { regex: /(\d+)\s*-\s*(\d+)/, operation: 'subtract' },
      { regex: /(\d+)\s*\*\s*(\d+)/, operation: 'multiply' },
      { regex: /(\d+)\s*×\s*(\d+)/, operation: 'multiply' },
      { regex: /(\d+)\s*\/\s*(\d+)/, operation: 'divide' },
      { regex: /(\d+)\s*÷\s*(\d+)/, operation: 'divide' }
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        return {
          operation: pattern.operation,
          operand1: parseInt(match[1]),
          operand2: parseInt(match[2])
        };
      }
    }
    
    return null;
  }

  /**
   * Evaluate simple mathematical expression
   */
  evaluateExpression(expr) {
    try {
      switch (expr.operation) {
        case 'add':
          return expr.operand1 + expr.operand2;
        case 'subtract':
          return expr.operand1 - expr.operand2;
        case 'multiply':
          return expr.operand1 * expr.operand2;
        case 'divide':
          return expr.operand2 !== 0 ? expr.operand1 / expr.operand2 : null;
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract number from answer text
   */
  extractNumberFromAnswer(answerText) {
    const numberMatch = answerText.match(/\b(\d+(?:\.\d+)?)\b/);
    return numberMatch ? parseFloat(numberMatch[1]) : null;
  }

  /**
   * Validate educational level appropriateness
   */
  validateEducationalLevel(mathContent, contentScope, result) {
    const level = contentScope.educationalLevel;
    const complexity = mathContent.complexity;
    
    const complexityLimits = {
      elementary: 2,
      middle_school: 4,
      high_school: 6,
      college: Infinity
    };
    
    const limit = complexityLimits[level] || complexityLimits.middle_school;
    
    if (complexity > limit) {
      result.warnings.push(
        `Question complexity (${complexity}) may be too high for ${level} level (limit: ${limit})`
      );
    }
  }
}

module.exports = MathQuestionValidator;