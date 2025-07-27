// src/server/services/ollama-simplified.js
const { Ollama } = require('ollama');

class SimplifiedOllamaService {
  constructor() {
    this.ollama = new Ollama({
      host: 'http://localhost:11434'
    });
    this.defaultModel = 'llama3.2:3b';
    
    // Store successful question patterns for fallback
    this.successfulPatterns = new Map();
  }

  /**
   * Generate questions with simplified approach
   * Subject is KNOWN from user selection, no detection needed
   */
  async generateQuestions(content, count = 5, subjectCategory, topicName) {
    try {
      console.log(`🎓 Generating ${count} questions for ${subjectCategory.name} - ${topicName}`);
      
      if (!content || content.trim().length < 50) {
        console.error('❌ Content too short');
        return [];
      }

      // Try main generation first
      let questions = await this.generateWithSubjectContext(content, count, subjectCategory, topicName);
      
      // If we got some but not enough, use successful patterns to fill the gap
      if (questions.length > 0 && questions.length < count) {
        console.log(`📝 Got ${questions.length}/${count}, using patterns to fill gap`);
        const additionalQuestions = await this.generateFromPatterns(
          content, 
          count - questions.length, 
          subjectCategory, 
          questions
        );
        questions = [...questions, ...additionalQuestions];
      }
      
      // If still no questions, try simplified approach
      if (questions.length === 0) {
        console.log('🔄 Trying simplified generation');
        questions = await this.generateSimplified(content, count, subjectCategory, topicName);
      }

      // Store successful patterns for future use
      if (questions.length > 0) {
        this.storeSuccessfulPatterns(subjectCategory.id, questions);
      }

      console.log(`✅ Final result: ${questions.length} questions generated`);
      return questions.slice(0, count); // Ensure we don't exceed requested count
      
    } catch (error) {
      console.error('❌ Error in generateQuestions:', error);
      return [];
    }
  }

  /**
   * Generate questions with subject-specific teacher prompt
   */
  async generateWithSubjectContext(content, count, subjectCategory, topicName) {
    const teacherPrompt = this.createTeacherPrompt(content, count, subjectCategory, topicName);
    
    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: teacherPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: Math.max(800, count * 120), // Scale with question count
          stop: ["END_QUESTIONS", "---"]
        }
      });

      if (!response.response || response.response.trim().length === 0) {
        return [];
      }

      return this.parseQuestions(response.response, count);
      
    } catch (error) {
      console.error('❌ Subject context generation failed:', error);
      return [];
    }
  }

  /**
   * Create subject-specific teacher prompt
   */
  createTeacherPrompt(content, count, subjectCategory, topicName) {
    const subjectInstructions = this.getSubjectInstructions(subjectCategory);
    
    return `You are a ${subjectCategory.name} teacher creating practice questions for students studying "${topicName}".

STUDY MATERIAL:
${content.substring(0, 2000)}

${subjectInstructions}

Your task: Create exactly ${count} multiple choice questions that test understanding of this material.

TEACHER GUIDELINES:
- Act like a teacher testing student comprehension
- Ask about concepts, facts, and applications from the material
- Make questions clear and educational
- Provide 4 answer choices (A, B, C, D)
- Include brief explanations
- Focus on what students should learn from this content

Format each question exactly like this:

QUESTION 1:
[Your question here]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation]

Create ${count} questions following this format:`;
  }

  /**
   * Get subject-specific instructions for the teacher
   */
  getSubjectInstructions(subjectCategory) {
    const instructions = {
      'mathematics': `
As a MATHEMATICS teacher:
- Focus on calculations, problem-solving, and mathematical concepts
- Include numerical problems and mathematical reasoning
- Test understanding of formulas, procedures, and applications
- Ask "What is...?" "Calculate..." "Solve..." type questions`,

      'natural-sciences': `
As a SCIENCE teacher:
- Focus on scientific processes, facts, and phenomena
- Test understanding of concepts, experiments, and natural laws
- Ask about causes, effects, and scientific explanations
- Include questions about observations and scientific reasoning`,

      'literature': `
As a LITERATURE teacher:
- Focus on characters, themes, plot, and literary analysis
- Test understanding of text meaning and literary devices
- Ask about character motivations, themes, and interpretations
- Include questions about specific details from the text`,

      'history': `
As a HISTORY teacher:
- Focus on historical facts, events, and chronology
- Test understanding of causes, effects, and historical significance
- Ask about specific dates, people, and historical developments
- Include questions about historical context and relationships`,

      'languages': `
As a LANGUAGE teacher:
- Focus on vocabulary, grammar, and language usage
- Test understanding of language rules and communication
- Ask about word meanings, sentence structure, and language patterns
- Include questions about practical language application`,

      'business': `
As a BUSINESS teacher:
- Focus on business concepts, strategies, and economic principles
- Test understanding of business operations and management
- Ask about business decisions, market dynamics, and financial concepts
- Include questions about practical business applications`,

      'computer-science': `
As a COMPUTER SCIENCE teacher:
- Focus on programming concepts, algorithms, and technical knowledge
- Test understanding of code logic and computational thinking
- Ask about programming procedures and technical problem-solving
- Include questions about how technology works`,

      'arts': `
As an ARTS teacher:
- Focus on artistic concepts, techniques, and cultural knowledge
- Test understanding of artistic expressions and cultural context
- Ask about artistic methods, styles, and creative processes
- Include questions about art appreciation and analysis`,

      'health-medicine': `
As a HEALTH teacher:
- Focus on health facts, medical knowledge, and wellness concepts
- Test understanding of body systems and health practices
- Ask about health procedures, medical facts, and wellness strategies
- Include questions about practical health applications`
    };

    return instructions[subjectCategory.id] || instructions['natural-sciences'];
  }

  /**
   * Generate additional questions using successful patterns
   */
  async generateFromPatterns(content, needed, subjectCategory, existingQuestions) {
    const patterns = this.successfulPatterns.get(subjectCategory.id) || [];
    
    if (patterns.length === 0) {
      return [];
    }

    // Use successful question patterns to generate similar ones
    const samplePattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    const patternPrompt = `You are a ${subjectCategory.name} teacher. Based on this study material, create ${needed} more questions similar to this successful example:

STUDY MATERIAL:
${content.substring(0, 1500)}

EXAMPLE SUCCESSFUL QUESTION:
${samplePattern.question}
A) ${samplePattern.options[0]}
B) ${samplePattern.options[1]}
C) ${samplePattern.options[2]}
D) ${samplePattern.options[3]}

Create ${needed} similar questions in the same format:

QUESTION 1:
[Your question here]
A) [Option A]
B) [Option B]
C) [Option C] 
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation]`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: patternPrompt,
        stream: false,
        options: {
          temperature: 0.8, // Slightly higher for variety
          top_p: 0.9,
          num_predict: needed * 120
        }
      });

      return this.parseQuestions(response.response, needed);
      
    } catch (error) {
      console.error('❌ Pattern generation failed:', error);
      return [];
    }
  }

  /**
   * Simplified generation as final fallback
   */
  async generateSimplified(content, count, subjectCategory, topicName) {
    const simplePrompt = `Create ${count} multiple choice questions about "${topicName}" based on this content:

${content.substring(0, 1000)}

Make each question test understanding of the material. Format:

QUESTION 1:
[Question about the content]
A) [Answer choice]
B) [Answer choice]
C) [Answer choice]
D) [Answer choice]
CORRECT: [A/B/C/D]
EXPLANATION: [Brief explanation]

Create ${count} questions:`;

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: simplePrompt,
        stream: false,
        options: {
          temperature: 0.6,
          top_p: 0.85,
          num_predict: count * 100
        }
      });

      return this.parseQuestions(response.response, count);
      
    } catch (error) {
      console.error('❌ Simplified generation failed:', error);
      return [];
    }
  }

  /**
   * Parse questions from response
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
      
      if (lines.length < 6) return null;
      
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
        if (currentSection === 'question' && !line.toLowerCase().startsWith('correct:') && !line.toLowerCase().startsWith('explanation:')) {
          questionText += (questionText ? ' ' : '') + line;
        }
      }
      
      // Validate question
      if (!questionText || options.length !== 4 || correctAnswer === null || correctAnswer < 0 || correctAnswer >= 4) {
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
    
    // Add new patterns, keep only recent ones
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
}

module.exports = SimplifiedOllamaService;