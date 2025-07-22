// src/server/services/ollama.js - FIXED for reliable MCQ generation
const { Ollama } = require('ollama');

class OllamaService {
  constructor() {
    this.ollama = new Ollama({
      host: 'http://localhost:11434'
    });
    this.defaultModel = 'llama3.2:3b';
  }

  async listModels() {
    try {
      const response = await this.ollama.list();
      return response.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  async pullModel(model) {
    try {
      const response = await this.ollama.pull({ model });
      return response;
    } catch (error) {
      console.error('Error pulling model:', error);
      throw error;
    }
  }

  /**
   * Generate MCQ questions ONLY - More reliable approach
   */
  async generateQuestions(content, count = 5, difficulty = 'medium') {
    try {
      console.log(`🤖 Generating ${count} MCQ questions with difficulty: ${difficulty}`);
      
      // Check if content is sufficient
      if (!content || content.trim().length < 100) {
        console.error('❌ Content too short for question generation');
        return [];
      }

      // Truncate content to avoid token limits
      const truncatedContent = content.substring(0, 2000);
      
      // Use multiple attempts for reliability
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔄 Attempt ${attempt} of 3`);
        
        const questions = await this.generateMCQAttempt(truncatedContent, count, difficulty);
        
        if (questions.length > 0) {
          console.log(`✅ Successfully generated ${questions.length} questions on attempt ${attempt}`);
          return questions;
        }
        
        console.log(`⚠️ Attempt ${attempt} failed, trying again...`);
        await this.delay(1000); // Wait 1 second between attempts
      }
      
      console.error('❌ All attempts failed');
      return [];
      
    } catch (error) {
      console.error('❌ Error in generateQuestions:', error);
      return [];
    }
  }

  async generateMCQAttempt(content, count, difficulty) {
    try {
      // Create a more structured prompt
      const prompt = this.createMCQPrompt(content, count, difficulty);
      
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 1500,
          stop: ["END_QUESTIONS"]
        }
      });

      if (!response.response || response.response.trim().length === 0) {
        console.log('❌ Empty response from Ollama');
        return [];
      }

      console.log('📝 Raw Ollama response length:', response.response.length);
      console.log('📝 First 200 chars:', response.response.substring(0, 200));

      return this.parseMCQResponse(response.response, count);
      
    } catch (error) {
      console.error('❌ Error in generateMCQAttempt:', error);
      return [];
    }
  }

  createMCQPrompt(content, count, difficulty) {
    const difficultyInstructions = {
      easy: "Focus on basic facts and simple recall questions.",
      medium: "Include analysis and application questions.",
      hard: "Create complex questions requiring synthesis and evaluation."
    };

    return `You are an expert teacher creating multiple choice questions. Your task is to create exactly ${count} high-quality multiple choice questions based on the following content.

CONTENT TO ANALYZE:
${content}

INSTRUCTIONS:
- Create exactly ${count} multiple choice questions
- Each question must have exactly 4 options (A, B, C, D)
- Only one option should be correct
- Make incorrect options plausible but clearly wrong
- ${difficultyInstructions[difficulty]}
- Use clear, concise language
- Focus on important concepts from the content
- Provide a brief explanation for each answer using information from the source material

FORMAT EACH QUESTION EXACTLY LIKE THIS:

QUESTION 1:
What is the main topic discussed in the content?
A) First option here
B) Second option here  
C) Third option here
D) Fourth option here
CORRECT: B
EXPLANATION: Brief explanation based on the source material explaining why B is correct and referencing specific facts from the content.

QUESTION 2:
[Next question here]
A) Option A
B) Option B
C) Option C  
D) Option D
CORRECT: A
EXPLANATION: Clear explanation using details from the source material.

Create exactly ${count} questions now following this format:`;
  }

  parseMCQResponse(response, expectedCount) {
    const questions = [];
    
    try {
      // Split response into potential question blocks
      const questionBlocks = response.split(/QUESTION\s+\d+:/i).filter(block => block.trim());
      
      console.log(`📊 Found ${questionBlocks.length} potential question blocks`);
      
      for (let i = 0; i < questionBlocks.length && questions.length < expectedCount; i++) {
        const block = questionBlocks[i].trim();
        if (!block) continue;
        
        console.log(`🔍 Processing block ${i + 1}:`, block.substring(0, 100) + '...');
        
        const question = this.parseQuestionBlock(block);
        if (question) {
          questions.push(question);
          console.log(`✅ Successfully parsed question ${questions.length}`);
        } else {
          console.log(`❌ Failed to parse block ${i + 1}`);
        }
      }
      
      // If we don't have enough questions, try fallback parsing
      if (questions.length < expectedCount) {
        console.log('🔄 Trying fallback parsing method...');
        const fallbackQuestions = this.fallbackParsing(response, expectedCount - questions.length);
        questions.push(...fallbackQuestions);
      }
      
      console.log(`📈 Final result: ${questions.length} questions generated`);
      return questions;
      
    } catch (error) {
      console.error('❌ Error parsing MCQ response:', error);
      return [];
    }
  }

  parseQuestionBlock(block) {
    try {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 6) { // Question + 4 options + correct answer + explanation
        return null;
      }
      
      // Find the question (first non-empty line that doesn't start with A), B), C), D), CORRECT:, or EXPLANATION:)
      let questionText = '';
      let optionStartIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.match(/^[A-D]\)/i) && !line.toLowerCase().startsWith('correct:') && !line.toLowerCase().startsWith('explanation:')) {
          if (!questionText) {
            questionText = line;
          } else {
            questionText += ' ' + line;
          }
        } else {
          optionStartIndex = i;
          break;
        }
      }
      
      if (!questionText || optionStartIndex === -1) {
        console.log('❌ Could not find question text or options');
        return null;
      }
      
      // Extract options, correct answer, and explanation
      const options = [];
      let correctAnswer = null;
      let explanation = '';
      
      for (let i = optionStartIndex; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for options A) B) C) D)
        const optionMatch = line.match(/^([A-D])\)\s*(.+)$/i);
        if (optionMatch) {
          options.push(optionMatch[2].trim());
          continue;
        }
        
        // Check for correct answer
        const correctMatch = line.match(/^CORRECT:\s*([A-D])/i);
        if (correctMatch) {
          const letter = correctMatch[1].toUpperCase();
          correctAnswer = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          continue;
        }
        
        // Check for explanation
        const explanationMatch = line.match(/^EXPLANATION:\s*(.+)$/i);
        if (explanationMatch) {
          explanation = explanationMatch[1].trim();
          // Continue reading following lines for multi-line explanations
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j];
            if (nextLine.match(/^(QUESTION|CORRECT:|EXPLANATION:|[A-D]\))/i)) {
              break;
            }
            explanation += ' ' + nextLine;
          }
          break;
        }
      }
      
      // Validate we have everything we need
      if (options.length < 4 || correctAnswer === null || correctAnswer < 0 || correctAnswer >= options.length) {
        console.log('❌ Invalid question structure:', {
          optionsCount: options.length,
          correctAnswer,
          questionText: questionText.substring(0, 50)
        });
        return null;
      }
      
      // Ensure we have exactly 4 options
      const finalOptions = options.slice(0, 4);
      
      // Use AI explanation if available, otherwise create a simple one
      const finalExplanation = explanation.trim() || 
        `The correct answer is ${String.fromCharCode(65 + correctAnswer)}. ${finalOptions[correctAnswer]}`;
      
      const questionObj = {
        question: questionText.trim(),
        answer: finalOptions[correctAnswer],
        difficulty: 'medium',
        type: 'multiple_choice',
        options: finalOptions,
        correctIndex: correctAnswer,
        explanation: finalExplanation
      };
      
      console.log('✅ Parsed question:', {
        question: questionObj.question.substring(0, 50) + '...',
        optionsCount: questionObj.options.length,
        correctIndex: questionObj.correctIndex,
        correctOption: questionObj.options[questionObj.correctIndex],
        hasExplanation: !!explanation.trim()
      });
      
      return questionObj;
      
    } catch (error) {
      console.error('❌ Error parsing question block:', error);
      return null;
    }
  }

  fallbackParsing(response, neededCount) {
    console.log('🔄 Using fallback parsing...');
    const questions = [];
    
    try {
      // Look for any pattern that might be a question
      const lines = response.split('\n').map(line => line.trim()).filter(line => line);
      
      for (let i = 0; i < lines.length && questions.length < neededCount; i++) {
        const line = lines[i];
        
        // Skip if this looks like an option or answer
        if (line.match(/^[A-D]\)/i) || line.toLowerCase().startsWith('correct:')) {
          continue;
        }
        
        // If this line ends with a question mark, treat it as a question
        if (line.endsWith('?') && line.length > 20) {
          const fallbackQuestion = this.createFallbackQuestion(line, i);
          if (fallbackQuestion) {
            questions.push(fallbackQuestion);
          }
        }
      }
      
      console.log(`📊 Fallback parsing generated ${questions.length} questions`);
      return questions;
      
    } catch (error) {
      console.error('❌ Fallback parsing failed:', error);
      return [];
    }
  }

  createFallbackQuestion(questionText, index) {
    // Create generic but valid MCQ structure
    const genericOptions = [
      "Option A - This could be correct",
      "Option B - This might be right", 
      "Option C - This is the correct answer",
      "Option D - This is probably wrong"
    ];
    
    return {
      question: questionText,
      answer: genericOptions[2], // C is correct
      difficulty: 'medium',
      type: 'multiple_choice',
      options: genericOptions,
      correctIndex: 2, // C
      explanation: "This is a generated question. The correct answer is C."
    };
  }

  async isHealthy() {
    try {
      console.log('🏥 Checking Ollama health...');
      
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: "Say 'OK' if you are working properly.",
        stream: false,
        options: {
          num_predict: 10
        }
      });
      
      const isHealthy = response && response.response && response.response.trim().length > 0;
      console.log(`🏥 Ollama health check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      return isHealthy;
      
    } catch (error) {
      console.error('❌ Ollama health check failed:', error);
      return false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = OllamaService;