// src/server/services/openai-service.js
const OpenAI = require('openai');
const PromptGenerator = require('./prompt-generation');

class OpenAIService {
    constructor(userTier = 'free') {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.userTier = userTier;
        this.model = 'gpt-4o-mini'; // Cost-effective model
        this.promptGenerator = new PromptGenerator();
        
        // Usage tracking for billing
        this.requestCounter = 0;
    }

    async generateQuestions(content, count, subject, topic) {
        try {
            console.log(`🤖 OpenAI: Generating ${count} questions for ${this.userTier} user`);
            
            const prompt = this.createSubjectPrompt(content, count, subject, topic);
            
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert educator creating high-quality practice questions. Always follow the exact format requested."
                    },
                    {
                        role: "user", 
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: this.getTokenLimit(),
                top_p: 0.9
            });

            this.requestCounter++;
            console.log(`📊 OpenAI: Request #${this.requestCounter}, Tokens used: ~${response.usage?.total_tokens || 'unknown'}`);

            const questions = this.parseQuestions(response.choices[0].message.content, count);
            console.log(`✅ OpenAI: Successfully parsed ${questions.length}/${count} questions`);
            
            return questions;
            
        } catch (error) {
            console.error('❌ OpenAI API error:', error);
            
            if (error.code === 'insufficient_quota') {
                throw new Error('AI service quota exceeded. Please try again later.');
            } else if (error.code === 'rate_limit_exceeded') {
                throw new Error('Too many requests. Please wait a moment and try again.');
            } else {
                throw new Error('Failed to generate questions. Please try again.');
            }
        }
    }

    getTokenLimit() {
        // Free tier gets smaller responses to control costs
        return this.userTier === 'free' ? 1500 : 3000;
    }

    createSubjectPrompt(content, count, subject, topic) {
        const maxContentLength = this.userTier === 'free' ? 2200 : 3800;
        const truncatedContent = (content || '').substring(0, maxContentLength);
        const subjectCategory = this.resolveSubjectCategory(subject);
        const topicName = typeof topic === 'string' ? topic : (topic?.name || 'General Topic');

        // Keep OpenAI output parser compatible by using MCQ-only sequence.
        const questionTypeSequence = Array(count).fill('multiple_choice');

        return this.promptGenerator.createSubjectPrompt(
            truncatedContent,
            count,
            subjectCategory,
            topicName,
            questionTypeSequence
        );
    }

    resolveSubjectCategory(subject) {
        const fallback = { id: 'other', name: 'General' };
        if (!subject) return fallback;

        if (subject.id && subject.name) {
            return { id: subject.id, name: subject.name };
        }

        const rawName = (subject.name || subject.title || String(subject)).toLowerCase();

        const mappings = [
            { key: 'math', id: 'mathematics', name: 'Mathematics' },
            { key: 'science', id: 'natural-sciences', name: 'Natural Sciences' },
            { key: 'literature', id: 'literature', name: 'Literature' },
            { key: 'history', id: 'history', name: 'History' },
            { key: 'computer', id: 'computer-science', name: 'Computer Science' },
            { key: 'language', id: 'languages', name: 'Languages' },
            { key: 'business', id: 'business', name: 'Business' },
            { key: 'art', id: 'arts', name: 'Arts' },
            { key: 'health', id: 'health-medicine', name: 'Health and Medicine' },
            { key: 'medicine', id: 'health-medicine', name: 'Health and Medicine' }
        ];

        const match = mappings.find(item => rawName.includes(item.key));
        return match ? { id: match.id, name: match.name } : { id: 'other', name: subject.name || 'General' };
    }

    parseQuestions(response, expectedCount) {
        const questions = [];
        
        try {
            // Split by "QUESTION" markers
            const questionBlocks = response.split(/QUESTION\s+\d+:/i).filter(block => block.trim());
            
            for (let i = 0; i < questionBlocks.length && questions.length < expectedCount; i++) {
                const question = this.parseQuestionBlock(questionBlocks[i].trim());
                if (question) {
                    questions.push(question);
                }
            }
            
            return questions;
            
        } catch (error) {
            console.error('❌ Error parsing OpenAI response:', error);
            return [];
        }
    }

    parseQuestionBlock(block) {
        try {
            const lines = block.split('\n').map(line => line.trim()).filter(line => line);
            
            if (lines.length < 6) {
                console.warn('⚠️ Question block too short, skipping');
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
                    correctAnswer = letter.charCodeAt(0) - 65; // Convert A=0, B=1, etc.
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
                
                // Continue explanation on multiple lines
                if (currentSection === 'explanation' && !line.toLowerCase().startsWith('question')) {
                    explanation += ' ' + line;
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
                console.warn('⚠️ Invalid question structure, skipping');
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
     * Generate a response from OpenAI for any prompt (used by flashcard generation)
     */
    async generateResponse(prompt, options = {}) {
        try {
            console.log(`🤖 OpenAI: Generating response for ${this.userTier} user`);
            
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that generates educational content. Always follow the exact format requested."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || this.getTokenLimit(),
                top_p: 0.9
            });

            this.requestCounter++;
            console.log(`📊 OpenAI: Request #${this.requestCounter}, Tokens used: ~${response.usage?.total_tokens || 'unknown'}`);

            const content = response.choices[0].message.content;
            console.log(`✅ OpenAI: Successfully generated response (${content.length} characters)`);
            
            return content;
            
        } catch (error) {
            console.error('❌ OpenAI generateResponse error:', error);
            
            if (error.code === 'insufficient_quota') {
                throw new Error('OpenAI quota exceeded. Please contact support.');
            }
            
            if (error.code === 'rate_limit_exceeded') {
                throw new Error('Rate limit exceeded. Please try again in a moment.');
            }
            
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }

    async testConnection() {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: "user", content: "Say 'OK' if you are working." }],
                max_tokens: 10
            });
            
            return response.choices[0].message.content.includes('OK');
        } catch (error) {
            console.error('OpenAI connection test failed:', error);
            return false;
        }
    }

    getUsageStats() {
        return {
            requestCount: this.requestCounter,
            model: this.model,
            userTier: this.userTier,
            tokenLimit: this.getTokenLimit()
        };
    }
}

module.exports = OpenAIService;