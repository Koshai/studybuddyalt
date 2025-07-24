// src/server/services/ai/validators/index.js
// Simple validator manager for different domains

const MathQuestionValidator = require('./math');

class DomainValidatorManager {
  constructor() {
    this.mathValidator = new MathQuestionValidator();
  }

  validateQuestion(question, contentScope) {
    const domain = contentScope.subjectDomain || 'general';
    
    // Use math validator for mathematics
    if (domain === 'mathematics') {
      return this.mathValidator.validateQuestion(question, contentScope);
    }
    
    // For other domains, use general validation for now
    return this.validateGeneralQuestion(question, contentScope);
  }

  /**
   * General question validation for non-math domains
   */
  validateGeneralQuestion(question, contentScope) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      domain: contentScope.subjectDomain || 'general'
    };

    // Basic validation
    if (!question.question || question.question.trim().length < 10) {
      result.errors.push('Question text is too short');
    }
    
    if (!question.answer || question.answer.trim().length < 1) {
      result.errors.push('Answer is missing');
    }
    
    if (question.type === 'multiple_choice') {
      if (!question.options || question.options.length !== 4) {
        result.errors.push('Multiple choice questions must have exactly 4 options');
      }
      
      if (question.correctIndex < 0 || question.correctIndex >= 4) {
        result.errors.push('Correct index must be between 0 and 3');
      }
    }

    // Check if question relates to covered concepts
    const concepts = contentScope.conceptsTaught || [];
    const questionText = question.question.toLowerCase();
    
    const relatedConcepts = concepts.filter(concept => 
      questionText.includes(concept.toLowerCase()) ||
      concept.toLowerCase().includes(questionText.split(' ')[0])
    );
    
    if (relatedConcepts.length === 0 && concepts.length > 0) {
      result.warnings.push('Question may not relate to concepts covered in the material');
    }

    // Check educational level appropriateness
    if (contentScope.educationalLevel === 'elementary') {
      const complexWords = ['analyze', 'evaluate', 'synthesize', 'compare', 'contrast'];
      const hasComplexWords = complexWords.some(word => questionText.includes(word));
      
      if (hasComplexWords) {
        result.warnings.push('Question may use vocabulary too advanced for elementary level');
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }
}

module.exports = DomainValidatorManager;