// src/server/services/validators/validation-manager.js - Subject-Specific Validation System

const MathValidator = require('./math-validator');
const ScienceValidator = require('./science-validator');
const LiteratureValidator = require('./literature-validator');
const HistoryValidator = require('./history-validator');
const GeneralValidator = require('./general-validator');

class SubjectValidationManager {
  constructor() {
    this.validators = {
      // Mathematics - Strict arithmetic validation
      'mathematics': new MathValidator(),
      
      // Sciences - Formula and scientific accuracy
      'natural-sciences': new ScienceValidator(),
      
      // Literature - Text analysis and comprehension
      'literature': new LiteratureValidator(),
      
      // History - Facts and chronology
      'history': new HistoryValidator(),
      
      // Other subjects use general validation
      'languages': new GeneralValidator(),
      'arts': new GeneralValidator(),
      'computer-science': new GeneralValidator(),
      'business': new GeneralValidator(),
      'health-medicine': new GeneralValidator(),
      'other': new GeneralValidator()
    };
  }

  /**
   * Get appropriate validator for subject - SUBJECT ISOLATION
   */
  getValidator(subjectId) {
    const validator = this.validators[subjectId];
    if (!validator) {
      console.log(`⚠️ No specific validator for ${subjectId}, using general validator`);
      return this.validators['other'];
    }
    
    console.log(`🎯 Using ${subjectId} validator`);
    return validator;
  }

  /**
   * Validate questions based on subject - ISOLATED BY SUBJECT
   */
  async validateQuestions(questions, subjectCategory) {
    const subjectId = subjectCategory.id || subjectCategory.name?.toLowerCase();
    const validator = this.getValidator(subjectId);
    
    console.log(`🔍 Validating ${questions.length} questions for subject: ${subjectId}`);
    
    const validatedQuestions = [];
    const rejectedQuestions = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      try {
        // Each validator handles its own logic
        const validation = await validator.validateQuestion(question, subjectCategory);
        
        if (validation.isValid) {
          // Apply any subject-specific fixes
          const processedQuestion = await validator.processQuestion(question, subjectCategory);
          validatedQuestions.push(processedQuestion);
          console.log(`✅ Question ${i + 1} passed ${subjectId} validation`);
        } else {
          rejectedQuestions.push({
            question,
            errors: validation.errors,
            warnings: validation.warnings
          });
          console.log(`❌ Question ${i + 1} rejected by ${subjectId} validator:`, validation.errors);
        }
        
      } catch (error) {
        console.error(`❌ Validation error for question ${i + 1}:`, error);
        rejectedQuestions.push({
          question,
          errors: [`Validation failed: ${error.message}`],
          warnings: []
        });
      }
    }
    
    return {
      validQuestions: validatedQuestions,
      rejectedQuestions,
      subjectId,
      validationStats: {
        original: questions.length,
        accepted: validatedQuestions.length,
        rejected: rejectedQuestions.length,
        acceptanceRate: Math.round((validatedQuestions.length / questions.length) * 100)
      }
    };
  }

  /**
   * Get validation requirements for a subject
   */
  getValidationRequirements(subjectId) {
    const requirements = {
      'mathematics': {
        requiresArithmetic: true,
        strictMath: true,
        allowedOperations: ['addition', 'subtraction', 'multiplication', 'division'],
        maxComplexity: 'medium'
      },
      'natural-sciences': {
        requiresFactualAccuracy: true,
        allowsFormulas: true,
        requiresUnits: false,
        maxComplexity: 'high'
      },
      'literature': {
        requiresTextualEvidence: true,
        allowsInterpretation: true,
        requiresQuotes: false,
        maxComplexity: 'high'
      },
      'history': {
        requiresFactualAccuracy: true,
        allowsDateRanges: true,
        requiresChronology: true,
        maxComplexity: 'medium'
      }
    };
    
    return requirements[subjectId] || {
      requiresBasicLogic: true,
      maxComplexity: 'medium'
    };
  }

  /**
   * Check if subject needs special handling
   */
  requiresSpecialValidation(subjectId) {
    const specialSubjects = ['mathematics', 'natural-sciences', 'literature', 'history'];
    return specialSubjects.includes(subjectId);
  }
}

module.exports = SubjectValidationManager;