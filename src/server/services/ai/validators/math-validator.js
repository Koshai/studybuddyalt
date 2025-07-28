// src/server/services/math-validator.js - New Math Validation Service

class MathValidator {
  constructor() {
    this.mathOperations = {
      addition: ['+', 'add', 'plus', 'sum', 'total'],
      subtraction: ['-', 'subtract', 'minus', 'difference'],
      multiplication: ['×', '*', 'x', 'multiply', 'times', 'product'],
      division: ['÷', '/', 'divide', 'divided by', 'quotient']
    };
  }

  /**
   * Validate mathematical expressions in questions and explanations
   */
  validateMathContent(question, explanation = '') {
    const errors = [];
    const warnings = [];
    
    try {
      // Check question text
      const questionErrors = this.findMathErrors(question);
      errors.push(...questionErrors);
      
      // Check explanation text
      if (explanation) {
        const explanationErrors = this.findMathErrors(explanation);
        errors.push(...explanationErrors);
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        hasValidMath: true
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: ['Math validation failed'],
        warnings: [],
        hasValidMath: false
      };
    }
  }

  /**
   * Find mathematical errors in text
   */
  findMathErrors(text) {
    const errors = [];
    
    // Find all mathematical expressions
    const expressions = this.extractMathExpressions(text);
    
    for (const expr of expressions) {
      const result = this.validateExpression(expr);
      if (!result.isCorrect) {
        errors.push(`Math error: ${expr.original} - Expected ${result.correctAnswer}, found ${result.claimedAnswer}`);
      }
    }
    
    return errors;
  }

  /**
   * Extract mathematical expressions from text
   */
  extractMathExpressions(text) {
    const expressions = [];
    
    // Patterns to match common math expressions
    const patterns = [
      // "5 x 4 = 15" or "5 × 4 = 15"
      /(\d+)\s*[×x*]\s*(\d+)\s*=\s*(\d+)/gi,
      // "5 + 3 = 8"
      /(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/gi,
      // "10 - 4 = 6"
      /(\d+)\s*-\s*(\d+)\s*=\s*(\d+)/gi,
      // "12 ÷ 3 = 4" or "12 / 3 = 4"
      /(\d+)\s*[÷/]\s*(\d+)\s*=\s*(\d+)/gi
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [original, num1, num2, result] = match;
        expressions.push({
          original: original.trim(),
          operand1: parseInt(num1),
          operand2: parseInt(num2),
          claimedResult: parseInt(result),
          operation: this.detectOperation(original)
        });
      }
    }
    
    return expressions;
  }

  /**
   * Detect the mathematical operation from text
   */
  detectOperation(text) {
    const lowerText = text.toLowerCase();
    
    if (/[×x*]/.test(text) || lowerText.includes('multiply') || lowerText.includes('times')) {
      return 'multiplication';
    }
    if (/\+/.test(text) || lowerText.includes('add') || lowerText.includes('plus')) {
      return 'addition';
    }
    if (/-/.test(text) || lowerText.includes('subtract') || lowerText.includes('minus')) {
      return 'subtraction';
    }
    if (/[÷/]/.test(text) || lowerText.includes('divide')) {
      return 'division';
    }
    
    return 'unknown';
  }

  /**
   * Validate a mathematical expression
   */
  validateExpression(expr) {
    const { operand1, operand2, claimedResult, operation } = expr;
    
    let correctAnswer;
    
    switch (operation) {
      case 'addition':
        correctAnswer = operand1 + operand2;
        break;
      case 'subtraction':
        correctAnswer = operand1 - operand2;
        break;
      case 'multiplication':
        correctAnswer = operand1 * operand2;
        break;
      case 'division':
        correctAnswer = operand2 !== 0 ? operand1 / operand2 : null;
        break;
      default:
        return { isCorrect: true, correctAnswer: claimedResult, claimedAnswer: claimedResult };
    }
    
    const isCorrect = correctAnswer === claimedResult;
    
    return {
      isCorrect,
      correctAnswer,
      claimedAnswer: claimedResult,
      operation,
      operands: [operand1, operand2]
    };
  }

  /**
   * Fix mathematical errors in text
   */
  fixMathErrors(text) {
    let fixedText = text;
    const expressions = this.extractMathExpressions(text);
    
    for (const expr of expressions) {
      const result = this.validateExpression(expr);
      if (!result.isCorrect && result.correctAnswer !== null) {
        // Replace the incorrect answer with the correct one
        const incorrectPattern = new RegExp(
          `${expr.operand1}\\s*[×x*+\\-÷/]\\s*${expr.operand2}\\s*=\\s*${expr.claimedResult}`,
          'gi'
        );
        const operatorSymbol = this.getOperatorSymbol(result.operation);
        const correctExpression = `${expr.operand1} ${operatorSymbol} ${expr.operand2} = ${result.correctAnswer}`;
        
        fixedText = fixedText.replace(incorrectPattern, correctExpression);
      }
    }
    
    return {
      originalText: text,
      fixedText,
      hadErrors: expressions.some(expr => !this.validateExpression(expr).isCorrect),
      corrections: expressions.filter(expr => !this.validateExpression(expr).isCorrect).length
    };
  }

  /**
   * Get proper operator symbol for operation
   */
  getOperatorSymbol(operation) {
    const symbols = {
      addition: '+',
      subtraction: '-',
      multiplication: '×',
      division: '÷'
    };
    return symbols[operation] || '?';
  }

  /**
   * Generate correct mathematical examples
   */
  generateCorrectExample(operation, maxNumber = 20) {
    const num1 = Math.floor(Math.random() * maxNumber) + 1;
    const num2 = Math.floor(Math.random() * maxNumber) + 1;
    
    let result, symbol;
    
    switch (operation) {
      case 'addition':
        result = num1 + num2;
        symbol = '+';
        break;
      case 'subtraction':
        result = Math.max(num1, num2) - Math.min(num1, num2);
        symbol = '-';
        break;
      case 'multiplication':
        result = num1 * num2;
        symbol = '×';
        break;
      case 'division':
        // Ensure clean division
        const divisor = Math.floor(Math.random() * 10) + 1;
        const dividend = divisor * (Math.floor(Math.random() * 10) + 1);
        result = dividend / divisor;
        return `${dividend} ÷ ${divisor} = ${result}`;
      default:
        result = num1 + num2;
        symbol = '+';
    }
    
    return `${Math.max(num1, num2)} ${symbol} ${Math.min(num1, num2)} = ${result}`;
  }
}

module.exports = MathValidator;