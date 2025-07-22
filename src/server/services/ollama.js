// src/server/services/ollama.js - CLEAN VERSION
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

  async generateQuestions(content, count = 5, difficulty = 'medium') {
    try {
      // Use a simple, reliable prompt
      const prompt = `Based on this text, create ${count} multiple choice questions.

TEXT:
${content.substring(0, 1500)} 

For each question, write:
Question: [your question]
A) [option A]
B) [option B] 
C) [option C]
D) [option D]
Correct: [A, B, C, or D]

Create exactly ${count} questions now:`;

      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 2000
        }
      });

      if (!response.response || response.response.trim().length === 0) {
        return [];
      }

      return this.parseSimpleFormat(response.response);
      
    } catch (error) {
      console.error('Error generating questions:', error);
      return [];
    }
  }

  parseSimpleFormat(response) {
    const questions = [];
    const lines = response.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentQuestion = null;
    let currentOptions = [];
    let currentCorrect = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for question
      if (line.toLowerCase().startsWith('question:') || line.match(/^\d+\./)) {
        // Save previous question if complete
        if (currentQuestion && currentOptions.length >= 3 && currentCorrect !== null) {
          const questionObj = this.createQuestionObject(currentQuestion, currentOptions, currentCorrect);
          if (questionObj) {
            questions.push(questionObj);
          }
        }
        
        // Start new question
        currentQuestion = line.replace(/^(question:|Question:|\d+\.)/i, '').trim();
        currentOptions = [];
        currentCorrect = null;
        continue;
      }
      
      // Look for options A) B) C) D)
      const optionMatch = line.match(/^([A-D])\)\s*(.+)$/i);
      if (optionMatch) {
        const optionText = optionMatch[2].trim();
        currentOptions.push(optionText);
        continue;
      }
      
      // Look for correct answer
      if (line.toLowerCase().startsWith('correct:') || line.toLowerCase().startsWith('answer:')) {
        const correctMatch = line.match(/[A-D]/i);
        if (correctMatch) {
          const correctLetter = correctMatch[0].toUpperCase();
          currentCorrect = correctLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        }
        continue;
      }
    }
    
    // Add the last question
    if (currentQuestion && currentOptions.length >= 3 && currentCorrect !== null) {
      const questionObj = this.createQuestionObject(currentQuestion, currentOptions, currentCorrect);
      if (questionObj) {
        questions.push(questionObj);
      }
    }
    
    return questions;
  }

  createQuestionObject(question, options, correctIndex) {
    // Ensure we have at least 4 options
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`);
    }
    
    // Take only first 4 options
    options = options.slice(0, 4);
    
    // Validate correctIndex
    if (correctIndex < 0 || correctIndex >= options.length) {
      correctIndex = 0;
    }
    
    return {
      question: question,
      answer: options[correctIndex],
      difficulty: 'medium',
      type: 'multiple_choice',
      options: options,
      correctIndex: correctIndex,
      explanation: `The correct answer is ${String.fromCharCode(65 + correctIndex)}. ${options[correctIndex]}`
    };
  }

  async generateSummary(content) {
    try {
      const prompt = `Summarize this text in 2-3 sentences:

${content}

Summary:`;

      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.8
        }
      });

      return response.response;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  async checkAnswer(question, correctAnswer, userAnswer) {
    try {
      const prompt = `As an educational AI, evaluate if the student's answer is correct or partially correct.

Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Provide:
1. A score from 0-100
2. Brief feedback explaining what was correct/incorrect
3. Suggestions for improvement if needed

Format your response as JSON:
{
  "score": 85,
  "feedback": "Your answer covers the main points but...",
  "suggestions": "Consider mentioning..."
}`;

      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3
        }
      });

      try {
        const parsed = JSON.parse(response.response);
        return parsed;
      } catch {
        return {
          score: 0,
          feedback: "Unable to evaluate answer",
          suggestions: "Please try again"
        };
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      throw error;
    }
  }

  async isHealthy() {
    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: "Hello",
        stream: false
      });
      return true;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }
}

module.exports = OllamaService;