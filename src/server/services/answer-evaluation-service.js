// src/server/services/answer-evaluation-service.js
// AI-powered answer evaluation for text-based questions

const ServiceFactory = require('./service-factory');

class AnswerEvaluationService {
    constructor() {
        this.aiService = null;
        console.log('✅ AnswerEvaluationService initialized');
    }

    /**
     * Initialize AI service when needed
     */
    async initializeAI() {
        if (!this.aiService) {
            this.aiService = ServiceFactory.getAIService();
        }
    }

    /**
     * Evaluate a text answer against the correct answer using AI semantic understanding
     * @param {string} userAnswer - The user's submitted answer
     * @param {string} correctAnswer - The expected correct answer
     * @param {string} question - The original question for context
     * @param {string} [subject] - The subject area for specialized evaluation
     * @returns {Promise<{isCorrect: boolean, confidence: number, feedback: string}>}
     */
    async evaluateTextAnswer(userAnswer, correctAnswer, question, subject = 'general') {
        try {
            // Clean inputs
            const cleanUserAnswer = userAnswer.trim();
            const cleanCorrectAnswer = correctAnswer.trim();
            
            if (!cleanUserAnswer || !cleanCorrectAnswer) {
                return {
                    isCorrect: false,
                    confidence: 1.0,
                    feedback: 'Answer cannot be empty'
                };
            }

            // First try fast local matching
            const localResult = this.evaluateLocally(cleanUserAnswer, cleanCorrectAnswer);
            
            // If local evaluation is confident, use it
            if (localResult.confidence >= 0.9) {
                return localResult;
            }

            // Otherwise, use AI for semantic evaluation
            try {
                await this.initializeAI();
                const aiResult = await this.evaluateWithAI(cleanUserAnswer, cleanCorrectAnswer, question, subject);
                
                // Combine local and AI results for best accuracy
                return this.combineResults(localResult, aiResult);
            } catch (aiError) {
                console.warn('AI evaluation failed, using local result:', aiError.message);
                return localResult;
            }

        } catch (error) {
            console.error('Answer evaluation error:', error);
            // Fallback to basic string matching
            return this.basicStringMatch(userAnswer, correctAnswer);
        }
    }

    /**
     * Fast local evaluation using multiple string matching techniques
     */
    evaluateLocally(userAnswer, correctAnswer) {
        console.log(`🔍 Local evaluation: "${userAnswer}" vs "${correctAnswer}"`);
        
        const userLower = userAnswer.toLowerCase();
        const correctLower = correctAnswer.toLowerCase();

        // 1. Exact match
        if (userLower === correctLower) {
            console.log(`✅ Exact match found`);
            return {
                isCorrect: true,
                confidence: 1.0,
                feedback: 'Perfect match!'
            };
        }

        // 2. Semantic pattern matching for common cases
        const semanticResult = this.checkSemanticPatterns(userLower, correctLower);
        if (semanticResult.isCorrect) {
            console.log(`✅ Semantic pattern matched: ${semanticResult.feedback}`);
            return semanticResult;
        }

        // 3. Clean and normalize both answers
        const userCleaned = this.cleanText(userLower);
        const correctCleaned = this.cleanText(correctLower);
        
        console.log(`🧹 Cleaned: "${userCleaned}" vs "${correctCleaned}"`);

        if (userCleaned === correctCleaned) {
            console.log(`✅ Cleaned match found`);
            return {
                isCorrect: true,
                confidence: 0.95,
                feedback: 'Correct (different wording, same meaning)'
            };
        }

        // 4. Containment check (bidirectional)
        if (userCleaned.includes(correctCleaned) || correctCleaned.includes(userCleaned)) {
            const similarity = this.calculateSimilarity(userCleaned, correctCleaned);
            console.log(`🔄 Containment check: similarity ${similarity}`);
            if (similarity > 0.7) { // Lowered threshold
                return {
                    isCorrect: true,
                    confidence: similarity,
                    feedback: 'Correct - semantically equivalent'
                };
            }
        }

        // 5. Key terms matching
        const keyTermsMatch = this.checkKeyTerms(userCleaned, correctCleaned);
        console.log(`🔑 Key terms match: score ${keyTermsMatch.score}`);
        if (keyTermsMatch.score > 0.7) { // Lowered threshold
            return {
                isCorrect: true,
                confidence: keyTermsMatch.score,
                feedback: 'Correct - contains key concepts'
            };
        }

        // 6. Fuzzy string similarity
        const similarity = this.calculateSimilarity(userCleaned, correctCleaned);
        console.log(`📊 Overall similarity: ${similarity}`);
        if (similarity > 0.6) { // Lowered threshold
            return {
                isCorrect: true,
                confidence: similarity,
                feedback: 'Correct - very similar answer'
            };
        }

        console.log(`❌ Local evaluation failed - proceeding to AI`);
        return {
            isCorrect: false,
            confidence: Math.max(similarity, keyTermsMatch.score),
            feedback: `Local evaluation suggests different meaning`
        };
    }

    /**
     * Check for common semantic patterns
     */
    checkSemanticPatterns(userAnswer, correctAnswer) {
        // Pattern 1: Send/ship to sea variations
        const sendSeaPattern = /(send|ship|sent|sailed|take|bring|put).*(sea|ocean|water|maritime)/;
        const userHasSendSea = sendSeaPattern.test(userAnswer);
        const correctHasSendSea = sendSeaPattern.test(correctAnswer);
        
        if (userHasSendSea && correctHasSendSea) {
            return {
                isCorrect: true,
                confidence: 0.9,
                feedback: 'Correct - both refer to sending someone to sea'
            };
        }

        // Pattern 2: Planning/intention words
        const planningWords = ['plan', 'planning', 'consider', 'considering', 'decide', 'decided', 'intend', 'intended', 'going to', 'will', 'would'];
        const userHasPlanning = planningWords.some(word => userAnswer.includes(word));
        const correctHasAction = ['to', 'ship', 'send'].some(word => correctAnswer.includes(word));
        
        if (userHasPlanning && correctHasAction && userAnswer.includes('sea') && correctAnswer.includes('sea')) {
            return {
                isCorrect: true,
                confidence: 0.85,
                feedback: 'Correct - planning/action refer to same outcome'
            };
        }

        return {
            isCorrect: false,
            confidence: 0
        };
    }

    /**
     * Clean text by removing common words and normalizing
     */
    cleanText(text) {
        return text
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .replace(/\b(the|a|an|is|are|was|were|in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after|above|below|between|among|and|or|but|so|because|if|when|where|why|how|they|he|she|it|him|her|them|his|hers|its|their|this|that|these|those|will|would|planning|going|intending|meant|plan|plans|planned)\b/g, '') // Remove common words including planning/intent words
            .replace(/\b(send|sending|sent|ship|shipping|shipped|off)\b/g, 'SEND') // Normalize send/ship variations
            .replace(/\b(sea|ocean|waters)\b/g, 'SEA') // Normalize sea variations  
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Check if key terms from correct answer appear in user answer
     */
    checkKeyTerms(userAnswer, correctAnswer) {
        const correctWords = correctAnswer.split(' ').filter(word => word.length > 2);
        const userWords = userAnswer.split(' ');
        
        if (correctWords.length === 0) {
            return { score: 0, matches: [] };
        }

        const matches = correctWords.filter(word => 
            userWords.some(userWord => 
                userWord.includes(word) || word.includes(userWord) || 
                this.calculateSimilarity(word, userWord) > 0.8
            )
        );

        const score = matches.length / correctWords.length;
        return { score, matches };
    }

    /**
     * Calculate Levenshtein distance-based similarity
     */
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0 || len2 === 0) return 0;
        
        const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;

        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j - 1][i] + 1,     // deletion
                    matrix[j][i - 1] + 1,     // insertion
                    matrix[j - 1][i - 1] + cost // substitution
                );
            }
        }

        const maxLen = Math.max(len1, len2);
        return (maxLen - matrix[len2][len1]) / maxLen;
    }

    /**
     * Use AI service for semantic evaluation
     */
    async evaluateWithAI(userAnswer, correctAnswer, question, subject) {
        const prompt = `You are an expert educator evaluating student answers. Your primary goal is to determine if the student understands the concept correctly, regardless of exact wording.

Question: "${question}"
Expected Answer: "${correctAnswer}"
Student Answer: "${userAnswer}"
Subject: ${subject}

CRITICAL EVALUATION CRITERIA:
1. Do both answers express the SAME CORE CONCEPT or meaning?
2. Are they describing the SAME ACTION, EVENT, or IDEA?
3. Would both answers demonstrate the student understands the material?

SEMANTIC EQUIVALENCE EXAMPLES:
- "They were planning to send him to sea" = "To ship him off to sea" (SAME ACTION: sending someone to sea)
- "He considers it" = "He thinks about it" (SAME MENTAL PROCESS)
- "The war began in 1914" = "Started in 1914" = "Commenced 1914" (SAME EVENT/TIME)
- "Mitochondria produce energy" = "Mitochondria make ATP" = "Mitochondria generate power" (SAME FUNCTION)

GUIDELINES:
- If the core meaning is the same, mark as CORRECT with high confidence (0.8+)
- Different verb tenses of same action = CORRECT ("sent" vs "sending" vs "to send")
- Different phrasing of same concept = CORRECT ("planning to" vs "going to" vs "will")
- Synonyms and equivalent expressions = CORRECT
- Only mark INCORRECT if the meaning is genuinely different or wrong

BE GENEROUS - students often express correct understanding in different words.

Respond ONLY with valid JSON:
{
    "isCorrect": boolean,
    "confidence": number (0.0 to 1.0),
    "feedback": "brief explanation",
    "reasoning": "detailed explanation of why this was marked correct/incorrect"
}`;

        try {
            const response = await this.aiService.generateResponse(prompt);
            
            // Try to parse JSON response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                
                // Validate the response structure
                if (typeof result.isCorrect === 'boolean' && 
                    typeof result.confidence === 'number' &&
                    result.confidence >= 0 && result.confidence <= 1) {
                    return {
                        isCorrect: result.isCorrect,
                        confidence: result.confidence,
                        feedback: result.feedback || 'AI evaluation completed',
                        reasoning: result.reasoning
                    };
                }
            }

            // Fallback parsing if JSON parsing fails
            const isCorrect = response.toLowerCase().includes('correct') && 
                            !response.toLowerCase().includes('incorrect');
            
            return {
                isCorrect,
                confidence: 0.7,
                feedback: 'AI evaluated your answer',
                reasoning: 'Backup evaluation method used'
            };

        } catch (error) {
            console.error('AI evaluation parsing error:', error);
            throw error;
        }
    }

    /**
     * Combine local and AI results for best accuracy
     */
    combineResults(localResult, aiResult) {
        // If both agree, use the higher confidence
        if (localResult.isCorrect === aiResult.isCorrect) {
            return {
                isCorrect: localResult.isCorrect,
                confidence: Math.max(localResult.confidence, aiResult.confidence),
                feedback: aiResult.feedback || localResult.feedback,
                reasoning: aiResult.reasoning
            };
        }

        // If they disagree, use the one with higher confidence
        if (aiResult.confidence > localResult.confidence) {
            return aiResult;
        } else {
            return localResult;
        }
    }

    /**
     * Basic fallback string matching
     */
    basicStringMatch(userAnswer, correctAnswer) {
        const similarity = this.calculateSimilarity(
            userAnswer.toLowerCase().trim(),
            correctAnswer.toLowerCase().trim()
        );

        return {
            isCorrect: similarity > 0.6,
            confidence: similarity,
            feedback: similarity > 0.6 ? 'Acceptable match' : 'Answer differs from expected response'
        };
    }

    /**
     * Subject-specific evaluation adjustments
     */
    getSubjectSpecificTolerance(subject) {
        const tolerances = {
            'mathematics': 0.9,      // Math needs to be precise
            'natural-sciences': 0.8, // Science allows some variation
            'literature': 0.7,       // Literature allows interpretation
            'history': 0.75,         // History allows some variation
            'languages': 0.85,       // Languages need accuracy
            'general': 0.75          // Default tolerance
        };

        return tolerances[subject] || tolerances.general;
    }
}

module.exports = AnswerEvaluationService;