// src/server/services/validators/literature-validator.js
class LiteratureValidator {
  async validateQuestion(question, subjectCategory) {
    const errors = [];
    const warnings = [];

    // Check for text-based analysis
    if (!this.hasTextualAnalysis(question.question)) {
      warnings.push('Question should focus more on textual analysis');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      subjectSpecific: {
        hasTextualFocus: true,
        analyticalDepth: 'medium'
      }
    };
  }

  hasTextualAnalysis(questionText) {
    const analysisWords = ['analyze', 'interpret', 'character', 'theme', 'author', 'text', 'passage'];
    return analysisWords.some(word => questionText.toLowerCase().includes(word));
  }

  async processQuestion(question, subjectCategory) {
    // Literature-specific processing
    return question;
  }
}

module.exports = LiteratureValidator;