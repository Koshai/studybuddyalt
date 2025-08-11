// src/server/services/response-parsing.js
// Handles parsing AI responses into structured question objects

class ResponseParser {
  constructor() {
    console.log('🔍 ResponseParser initialized');
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
   * Create basic questions from content sentences (fallback method)
   */
  createBasicQuestions(content, count, subjectCategory, topicName) {
    console.log('🔧 Using basic question creation from content');
    
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
   * Alternative parsing for simplified responses
   */
  parseSimpleQuestions(response, expectedCount) {
    const questions = [];
    
    try {
      // Try multiple parsing patterns
      const patterns = [
        /QUESTION\s+\d+:/gi,
        /Question\s*\d*:?/gi,
        /\d+\./g
      ];
      
      let questionBlocks = [];
      
      for (const pattern of patterns) {
        questionBlocks = response.split(pattern).filter(block => block.trim());
        if (questionBlocks.length >= expectedCount) {
          break;
        }
      }
      
      for (let i = 0; i < Math.min(questionBlocks.length, expectedCount); i++) {
        const question = this.parseFlexibleQuestionBlock(questionBlocks[i].trim());
        if (question) {
          questions.push(question);
        }
      }
      
      return questions;
      
    } catch (error) {
      console.error('❌ Error in simple parsing:', error);
      return [];
    }
  }

  /**
   * More flexible question block parsing for simpler formats
   */
  parseFlexibleQuestionBlock(block) {
    try {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 4) {
        return null;
      }
      
      let questionText = '';
      let options = [];
      let correctIndex = 0;
      let explanation = '';
      
      // Extract question text (usually first few lines)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line is an option
        const optionMatch = line.match(/^([A-D])\)\s*(.+)$/i);
        if (optionMatch) {
          options.push(optionMatch[2].trim());
          continue;
        }
        
        // Check if this is correct answer indicator
        if (line.toLowerCase().includes('correct') && line.includes(':')) {
          const correctMatch = line.match(/([A-D])/i);
          if (correctMatch) {
            const letter = correctMatch[1].toUpperCase();
            correctIndex = letter.charCodeAt(0) - 65;
          }
          continue;
        }
        
        // Check if this is explanation
        if (line.toLowerCase().includes('explanation') && line.includes(':')) {
          explanation = line.replace(/explanation:?/i, '').trim();
          continue;
        }
        
        // Otherwise, it's likely part of the question
        if (options.length === 0 && !line.toLowerCase().includes('correct') && 
            !line.toLowerCase().includes('explanation')) {
          questionText += (questionText ? ' ' : '') + line;
        }
      }
      
      // Validate structure
      if (!questionText || options.length !== 4 || correctIndex < 0 || correctIndex >= 4) {
        return null;
      }
      
      return {
        question: questionText.trim(),
        answer: options[correctIndex],
        type: 'multiple_choice',
        options: options,
        correctIndex: correctIndex,
        explanation: explanation || `The correct answer is ${String.fromCharCode(65 + correctIndex)}. ${options[correctIndex]}`
      };
      
    } catch (error) {
      console.error('❌ Error in flexible parsing:', error);
      return null;
    }
  }

  /**
   * Extract key information from content for question generation
   */
  extractKeyPoints(content, maxPoints = 10) {
    try {
      const sentences = content.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30)
        .slice(0, maxPoints);
        
      return sentences.map(sentence => ({
        text: sentence,
        keywords: this.extractKeywords(sentence)
      }));
      
    } catch (error) {
      console.error('❌ Error extracting key points:', error);
      return [];
    }
  }

  /**
   * Extract keywords from a sentence
   */
  extractKeywords(sentence) {
    try {
      // Remove common words and extract meaningful terms
      const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
        'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
        'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'
      ]);
      
      return sentence.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word))
        .slice(0, 5); // Top 5 keywords per sentence
        
    } catch (error) {
      console.error('❌ Error extracting keywords:', error);
      return [];
    }
  }

  /**
   * Validate parsed question structure
   */
  validateQuestionStructure(question) {
    const issues = [];
    
    if (!question.question || typeof question.question !== 'string') {
      issues.push('Missing or invalid question text');
    }
    
    if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
      issues.push('Invalid options array');
    }
    
    if (typeof question.correctIndex !== 'number' || question.correctIndex < 0 || question.correctIndex >= 4) {
      issues.push('Invalid correct index');
    }
    
    if (!question.answer || typeof question.answer !== 'string') {
      issues.push('Missing or invalid answer');
    }
    
    if (question.type !== 'multiple_choice') {
      issues.push('Invalid question type');
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Clean and normalize question text
   */
  cleanQuestionText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*$/, '$1') // Ensure proper ending punctuation
      .replace(/^[^\w]*/, '') // Remove leading non-word characters
      .trim();
  }

  /**
   * Clean and normalize option text
   */
  cleanOptionText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .trim()
      .replace(/^[A-D]\)\s*/, '') // Remove option prefix if present
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

module.exports = ResponseParser;