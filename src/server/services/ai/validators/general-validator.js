// src/server/services/validators/general-validator.js
class GeneralValidator {
  async validateQuestion(question, subjectCategory) {
    const errors = [];
    const warnings = [];

    // Basic validation for all other subjects
    if (!question.question || question.question.length < 10) {
      errors.push('Question text too short');
    }

    if (question.type === 'multiple_choice') {
      if (!question.options || question.options.length !== 4) {
        errors.push('Multiple choice questions must have exactly 4 options');
      }
      
      if (question.correctIndex < 0 || question.correctIndex >= 4) {
        errors.push('Invalid correct answer index');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      subjectSpecific: {
        generalValidation: true
      }
    };
  }

  async processQuestion(question, subjectCategory) {
    // General processing - no changes needed
    return question;
  }
}

module.exports = GeneralValidator;