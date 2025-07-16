// src/server/services/ollama.js
const { Ollama } = require('ollama');

class OllamaService {
  constructor() {
    this.ollama = new Ollama({
      host: 'http://localhost:11434'
    });
    this.defaultModel = 'llama3.2:3b'; // You can change this to any model you prefer
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
      const prompt = this.createQuestionPrompt(content, count, difficulty);
      
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      });

      return this.parseQuestions(response.response);
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  }

  createQuestionPrompt(content, count, difficulty) {
    const difficultyInstructions = {
      easy: "Create simple, direct questions that test basic understanding and recall of key facts.",
      medium: "Create questions that require some analysis and understanding of concepts, including application of knowledge.",
      hard: "Create complex questions that require critical thinking, analysis, synthesis, and deep understanding of the material."
    };

    return `Based on the following study material, generate exactly ${count} ${difficulty} difficulty questions with detailed answers.

Study Material:
${content}

Instructions:
- ${difficultyInstructions[difficulty]}
- Each question should be clear and specific
- Provide comprehensive answers that explain the reasoning
- Format your response as a JSON array with objects containing "question", "answer", and "difficulty" fields
- Make sure all questions are different and cover various aspects of the material
- Questions should be suitable for exam preparation

Example format:
[
  {
    "question": "What is the main concept discussed in the material?",
    "answer": "The main concept is... [detailed explanation]",
    "difficulty": "${difficulty}"
  }
]

Generate the questions now:`;
  }

  parseQuestions(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map(q => ({
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty
        }));
      }
      
      // Fallback: parse manually if JSON parsing fails
      return this.parseQuestionsManually(response);
    } catch (error) {
      console.error('Error parsing questions:', error);
      return this.parseQuestionsManually(response);
    }
  }

  parseQuestionsManually(response) {
    const questions = [];
    const lines = response.split('\n');
    let currentQuestion = null;
    let currentAnswer = '';
    let isAnswer = false;

    for (let line of lines) {
      line = line.trim();
      
      if (line.startsWith('Q:') || line.startsWith('Question:') || /^\d+\./.test(line)) {
        if (currentQuestion) {
          questions.push({
            question: currentQuestion,
            answer: currentAnswer.trim(),
            difficulty: 'medium'
          });
        }
        currentQuestion = line.replace(/^(Q:|Question:|\d+\.)/, '').trim();
        currentAnswer = '';
        isAnswer = false;
      } else if (line.startsWith('A:') || line.startsWith('Answer:')) {
        isAnswer = true;
        currentAnswer = line.replace(/^(A:|Answer:)/, '').trim();
      } else if (isAnswer && line) {
        currentAnswer += ' ' + line;
      }
    }

    if (currentQuestion) {
      questions.push({
        question: currentQuestion,
        answer: currentAnswer.trim(),
        difficulty: 'medium'
      });
    }

    return questions;
  }

  async generateSummary(content) {
    try {
      const prompt = `Summarize the following study material in a clear, concise way that highlights the key concepts and important points:

${content}

Provide a well-structured summary that a student can use for quick review.`;

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