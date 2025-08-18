// src/server/services/generation-strategies.js
// Handles different question generation strategies and batch size calculations

const QuestionTypeManager = require('./question-type-manager');

class GenerationStrategies {
  constructor(ollama, defaultModel, responseParser) {
    this.ollama = ollama;
    this.defaultModel = defaultModel;
    this.responseParser = responseParser;
    this.questionTypeManager = new QuestionTypeManager();
    console.log('🎯 GenerationStrategies initialized with QuestionTypeManager');
  }

  /**
   * Calculate how many questions to generate accounting for rejections
   */
  calculateBatchSize(needed, attempt, subjectCategory) {
    const subjectId = subjectCategory.id;
    
    // Base multiplier based on subject difficulty
    let multiplier = 1.3; // Default 30% extra
    
    switch (subjectId) {
      case 'mathematics':
        multiplier = 1.5; // Math questions often rejected for arithmetic errors
        break;
      case 'natural-sciences':
        multiplier = 1.4; // Science can have accuracy issues
        break;
      case 'literature':
      case 'history':
        multiplier = 1.3; // Moderate rejection rate
        break;
      default:
        multiplier = 1.2; // Lower rejection rate for general subjects
    }
    
    // Increase multiplier with attempt number
    const attemptMultiplier = 1 + (attempt - 1) * 0.2;
    
    return Math.min(Math.ceil(needed * multiplier * attemptMultiplier), needed * 3);
  }

  /**
   * Generate with subject context (Attempt 1) - Primary strategy with question type distribution
   */
  async generateWithSubjectContext(content, count, subjectCategory, topicName, promptGenerator) {
    const subjectId = subjectCategory.id;
    
    console.log(`🎯 Generating with ${subjectId} context`);
    
    // Get optimal question type distribution for this subject
    const questionTypeSequence = this.questionTypeManager.generateQuestionTypeSequence(subjectId, count);
    console.log(`📊 Using question type sequence for ${subjectId}:`, questionTypeSequence);
    
    const prompt = promptGenerator.createSubjectPrompt(content, count, subjectCategory, topicName, questionTypeSequence);
    
    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: subjectId === 'mathematics' ? 0.3 : 0.7,
          top_p: 0.9,
          num_predict: Math.max(800, count * 150), // Increased for text-based questions
          stop: ["END_QUESTIONS", "---"]
        }
      });

      if (!response.response || response.response.trim().length === 0) {
        return [];
      }

      const questions = this.responseParser.parseQuestions(response.response, count);
      
      // Add question type information to each question
      questions.forEach((question, index) => {
        if (index < questionTypeSequence.length) {
          question.type = questionTypeSequence[index];
          question.subjectOptimized = true;
        }
      });
      
      return questions;
      
    } catch (error) {
      console.error(`❌ ${subjectId} generation failed:`, error);
      return [];
    }
  }

  /**
   * Conservative generation (Attempt 2) - Safer approach
   */
  async generateConservative(content, count, subjectCategory, topicName) {
    console.log('🔒 Using conservative generation approach');
    
    const conservativePrompt = `Create ${count} basic educational questions about "${topicName}" for ${subjectCategory.name}.

STUDY MATERIAL:
${content.substring(0, 1500)}

Requirements:
- Make questions simple and clear
- Test basic understanding from the material
- Avoid complex calculations or interpretations
- Use straightforward language
- Ensure all information comes from the provided material

Format each question as:

QUESTION 1:
[Clear question based on the material]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Simple explanation]

Create exactly ${count} questions following this format.`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: conservativePrompt,
        stream: false,
        options: {
          temperature: 0.4, // Lower temperature for more conservative generation
          top_p: 0.8,
          num_predict: count * 100,
          stop: ["END_QUESTIONS", "---"]
        }
      });

      return this.responseParser.parseQuestions(response.response, count);
      
    } catch (error) {
      console.error('❌ Conservative generation failed:', error);
      return [];
    }
  }

  /**
   * Simplified generation (Attempt 3) - Most basic approach
   */
  async generateSimplified(content, count, subjectCategory, topicName) {
    console.log('📝 Using simplified generation');
    
    const prompt = `Based on this material about "${topicName}", create ${count} basic questions:

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
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.7,
          num_predict: count * 80
        }
      });

      return this.responseParser.parseQuestions(response.response, count);
    } catch (error) {
      console.error('❌ Simplified generation failed:', error);
      return [];
    }
  }

  /**
   * Generate from successful patterns (Attempt 4) - Pattern matching
   */
  async generateFromPatterns(content, count, subjectCategory, patternsManager) {
    console.log('🔄 Using pattern-based generation');
    
    const patterns = patternsManager.getSuccessfulPatterns(subjectCategory.id);
    
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

      return this.responseParser.parseQuestions(response.response, count);
    } catch (error) {
      console.error('❌ Pattern generation failed:', error);
      return [];
    }
  }

  /**
   * Basic generation (Attempt 5) - Final fallback
   */
  async generateBasic(content, count, subjectCategory, topicName) {
    console.log('🔧 Using basic generation as final attempt');
    
    return this.responseParser.createBasicQuestions(content, count, subjectCategory, topicName);
  }

  /**
   * Generate questions using different temperature settings
   */
  async generateWithTemperature(content, count, subjectCategory, topicName, temperature = 0.7) {
    console.log(`🌡️ Generating with temperature: ${temperature}`);
    
    const basicPrompt = `Create ${count} multiple choice questions about "${topicName}" for ${subjectCategory.name}.

STUDY MATERIAL:
${content.substring(0, 1200)}

Create questions that test understanding of the key concepts in this material.

QUESTION 1:
[Question about the material]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation]

Continue for ${count} questions.`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: basicPrompt,
        stream: false,
        options: {
          temperature: temperature,
          top_p: 0.9,
          num_predict: count * 120
        }
      });

      return this.responseParser.parseQuestions(response.response, count);
    } catch (error) {
      console.error(`❌ Temperature ${temperature} generation failed:`, error);
      return [];
    }
  }

  /**
   * Generate focused questions on specific topics
   */
  async generateFocused(content, count, subjectCategory, topicName, focusKeywords = []) {
    console.log(`🎯 Generating focused questions on: ${focusKeywords.join(', ')}`);
    
    const keywordContext = focusKeywords.length > 0 
      ? `Focus particularly on these concepts: ${focusKeywords.join(', ')}.`
      : '';
    
    const focusedPrompt = `Create ${count} multiple choice questions about "${topicName}" for ${subjectCategory.name}.

STUDY MATERIAL:
${content.substring(0, 1000)}

${keywordContext}

Create questions that thoroughly test understanding of the key concepts.

QUESTION 1:
[Focused question testing understanding]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Clear explanation]

Continue for ${count} questions, ensuring each tests important concepts from the material.`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: focusedPrompt,
        stream: false,
        options: {
          temperature: 0.6,
          top_p: 0.9,
          num_predict: count * 130
        }
      });

      return this.responseParser.parseQuestions(response.response, count);
    } catch (error) {
      console.error('❌ Focused generation failed:', error);
      return [];
    }
  }

  /**
   * Generate questions with specific difficulty level
   */
  async generateWithDifficulty(content, count, subjectCategory, topicName, difficulty = 'medium') {
    console.log(`📊 Generating ${difficulty} difficulty questions`);
    
    let difficultyGuidance = '';
    let temperature = 0.7;
    
    switch (difficulty.toLowerCase()) {
      case 'easy':
        difficultyGuidance = 'Make questions straightforward and test basic recall of information from the material.';
        temperature = 0.4;
        break;
      case 'medium':
        difficultyGuidance = 'Create questions that test understanding and application of concepts from the material.';
        temperature = 0.7;
        break;
      case 'hard':
        difficultyGuidance = 'Design questions that require analysis, synthesis, and deeper thinking about the material.';
        temperature = 0.8;
        break;
    }
    
    const difficultyPrompt = `Create ${count} ${difficulty} difficulty multiple choice questions about "${topicName}" for ${subjectCategory.name}.

STUDY MATERIAL:
${content.substring(0, 1200)}

DIFFICULTY GUIDANCE: ${difficultyGuidance}

QUESTION 1:
[${difficulty} difficulty question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Clear explanation appropriate for ${difficulty} level]

Continue for ${count} questions at ${difficulty} difficulty level.`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: difficultyPrompt,
        stream: false,
        options: {
          temperature: temperature,
          top_p: 0.9,
          num_predict: count * 140
        }
      });

      return this.responseParser.parseQuestions(response.response, count);
    } catch (error) {
      console.error(`❌ ${difficulty} difficulty generation failed:`, error);
      return [];
    }
  }

  /**
   * Get strategy name for logging
   */
  getStrategyName(attemptNumber) {
    switch (attemptNumber) {
      case 1: return 'Subject-Specific Context';
      case 2: return 'Conservative Approach';
      case 3: return 'Simplified Generation';
      case 4: return 'Pattern-Based';
      case 5: return 'Basic Fallback';
      default: return 'Unknown Strategy';
    }
  }

  /**
   * Estimate generation success rate for a subject
   */
  estimateSuccessRate(subjectCategory, attempt = 1) {
    const subjectId = subjectCategory.id;
    let baseRate = 0.7; // 70% default success rate
    
    switch (subjectId) {
      case 'mathematics':
        baseRate = 0.6; // Lower due to arithmetic validation
        break;
      case 'natural-sciences':
        baseRate = 0.65; // Moderate due to accuracy requirements
        break;
      case 'literature':
      case 'history':
        baseRate = 0.7; // Good success rate
        break;
      case 'computer-science':
        baseRate = 0.65; // Syntax validation challenges
        break;
      default:
        baseRate = 0.75; // Higher for general subjects
    }
    
    // Success rate decreases with attempt number (fallback strategies)
    const attemptPenalty = (attempt - 1) * 0.1;
    return Math.max(0.3, baseRate - attemptPenalty);
  }
}

module.exports = GenerationStrategies;