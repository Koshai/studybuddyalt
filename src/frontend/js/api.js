// js/api.js - API Service Layer

class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Generic request method with error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.timeout,
            ...options,
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please check your connection');
            }
            throw new Error(`API Error: ${error.message}`);
        }
    }

    /**
     * File upload with progress tracking
     */
    async uploadFile(file, subjectId, topicId, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('subjectId', subjectId);
        formData.append('topicId', topicId);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Track upload progress
            if (onProgress) {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid response format'));
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed - network error'));
            });
            
            xhr.addEventListener('timeout', () => {
                reject(new Error('Upload timeout - file may be too large'));
            });
            
            xhr.timeout = this.timeout;
            xhr.open('POST', `${this.baseURL}/upload`);
            xhr.send(formData);
        });
    }

    // ===== SUBJECT METHODS =====
    
    /**
     * Get all subjects
     */
    async getSubjects() {
        return this.request('/subjects');
    }

    /**
     * Create a new subject
     */
    async createSubject(name, description = '') {
        return this.request('/subjects', {
            method: 'POST',
            body: JSON.stringify({ name, description }),
        });
    }

    /**
     * Update a subject
     */
    async updateSubject(id, name, description) {
        return this.request(`/subjects/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, description }),
        });
    }

    /**
     * Delete a subject
     */
    async deleteSubject(id) {
        return this.request(`/subjects/${id}`, {
            method: 'DELETE',
        });
    }

    // ===== TOPIC METHODS =====
    
    /**
     * Get topics for a subject
     */
    async getTopics(subjectId) {
        return this.request(`/subjects/${subjectId}/topics`);
    }

    /**
     * Create a new topic
     */
    async createTopic(subjectId, name, description = '') {
        return this.request(`/subjects/${subjectId}/topics`, {
            method: 'POST',
            body: JSON.stringify({ name, description }),
        });
    }

    /**
     * Update a topic
     */
    async updateTopic(subjectId, topicId, name, description) {
        return this.request(`/subjects/${subjectId}/topics/${topicId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, description }),
        });
    }

    /**
     * Delete a topic
     */
    async deleteTopic(subjectId, topicId) {
        return this.request(`/subjects/${subjectId}/topics/${topicId}`, {
            method: 'DELETE',
        });
    }

    // ===== QUESTION METHODS =====
    
    /**
     * Generate questions for a topic
     */
    async generateQuestions(topicId, count = 5, difficulty = 'medium') {
        return this.request(`/topics/${topicId}/generate-questions`, {
            method: 'POST',
            body: JSON.stringify({ count, difficulty }),
        });
    }

    /**
     * Get all questions for a topic
     */
    async getQuestions(topicId) {
        return this.request(`/topics/${topicId}/questions`);
    }

    /**
     * Get random questions for practice
     */
    async getRandomQuestions(topicId, count = 5) {
        return this.request(`/topics/${topicId}/random-questions?count=${count}`);
    }

    /**
     * Generate questions with enhanced options
     */
    async generateQuestionsEnhanced(topicId, options = {}) {
        const {
            count = 5,
            difficulty = 'medium',
            textCount = null,
            mcqCount = null
        } = options;

        if (textCount !== null && mcqCount !== null) {
            // Use bulk generation for mixed types
            return this.request(`/topics/${topicId}/generate-bulk`, {
                method: 'POST',
                body: JSON.stringify({ textCount, mcqCount, difficulty }),
            });
        } else {
            // Use standard generation
            return this.request(`/topics/${topicId}/generate-questions`, {
                method: 'POST',
                body: JSON.stringify({ count, difficulty }),
            });
        }
    }

    /**
     * Get questions with filtering options
     */
    async getQuestionsEnhanced(topicId, filters = {}) {
        const { type, difficulty } = filters;
        const params = new URLSearchParams();
        
        if (type) params.append('type', type);
        if (difficulty) params.append('difficulty', difficulty);
        
        const endpoint = `/topics/${topicId}/questions/enhanced${params.toString() ? '?' + params.toString() : ''}`;
        return this.request(endpoint);
    }

    /**
     * Update a question
     */
    async updateQuestion(questionId, updates) {
        return this.request(`/questions/${questionId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    /**
     * Delete a question
     */
    async deleteQuestion(questionId) {
        return this.request(`/questions/${questionId}`, {
            method: 'DELETE',
        });
    }

    /**
     * Get topic statistics
     */
    async getTopicStatistics(topicId) {
        return this.request(`/topics/${topicId}/stats`);
    }

    /**
     * Validate a question before saving
     */
    async validateQuestion(questionData) {
        return this.request('/questions/validate', {
            method: 'POST',
            body: JSON.stringify(questionData),
        });
    }

    /**
     * Get questions by type
     */
    async getQuestionsByType(topicId, type) {
        return this.getQuestionsEnhanced(topicId, { type });
    }

    /**
     * Get mixed practice set (combination of MCQ and text questions)
     */
    async getMixedPracticeSet(topicId, count = 10) {
        try {
            const allQuestions = await this.getQuestions(topicId);
            
            if (allQuestions.length === 0) {
                return [];
            }
            
            // Separate by type
            const mcqQuestions = allQuestions.filter(q => q.type === 'multiple_choice');
            const textQuestions = allQuestions.filter(q => q.type === 'text' || !q.type);
            
            // Aim for 60% MCQ, 40% text if both types are available
            const targetMcq = Math.ceil(count * 0.6);
            const targetText = count - targetMcq;
            
            const selectedMcq = this.shuffleArray(mcqQuestions).slice(0, Math.min(targetMcq, mcqQuestions.length));
            const selectedText = this.shuffleArray(textQuestions).slice(0, Math.min(targetText, textQuestions.length));
            
            // If we don't have enough of one type, fill with the other
            const totalSelected = selectedMcq.length + selectedText.length;
            if (totalSelected < count) {
                const remaining = count - totalSelected;
                const remainingQuestions = allQuestions.filter(q => 
                    !selectedMcq.includes(q) && !selectedText.includes(q)
                );
                const additional = this.shuffleArray(remainingQuestions).slice(0, remaining);
                return this.shuffleArray([...selectedMcq, ...selectedText, ...additional]);
            }
            
            return this.shuffleArray([...selectedMcq, ...selectedText]);
        } catch (error) {
            console.error('Error creating mixed practice set:', error);
            throw error;
        }
    }

    /**
     * Helper method to shuffle array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Enhanced question generation with quality checks
     */
    async generateQualityQuestions(topicId, options = {}) {
        const {
            count = 5,
            difficulty = 'medium',
            maxRetries = 3
        } = options;

        let attempt = 0;
        let bestQuestions = [];
        let bestScore = 0;

        while (attempt < maxRetries) {
            try {
                const questions = await this.generateQuestionsEnhanced(topicId, {
                    count: count + 2, // Generate extra to filter out poor quality
                    difficulty
                });

                // Score questions based on quality
                const scoredQuestions = await Promise.all(
                    questions.map(async (q) => {
                        const validation = await this.validateQuestion(q);
                        const score = this.calculateQuestionScore(q, validation);
                        return { ...q, qualityScore: score };
                    })
                );

                // Sort by quality and take the best ones
                const qualityQuestions = scoredQuestions
                    .sort((a, b) => b.qualityScore - a.qualityScore)
                    .slice(0, count);

                const avgScore = qualityQuestions.reduce((sum, q) => sum + q.qualityScore, 0) / qualityQuestions.length;

                if (avgScore > bestScore) {
                    bestQuestions = qualityQuestions;
                    bestScore = avgScore;
                }

                // If we got good quality questions, break early
                if (avgScore > 0.8) {
                    break;
                }

                attempt++;
            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw error;
                }
            }
        }

        return bestQuestions.map(q => {
            const { qualityScore, ...question } = q;
            return question;
        });
    }

    /**
     * Calculate quality score for a question
     */
    calculateQuestionScore(question, validation) {
        let score = 1.0;

        // Penalize validation errors
        if (!validation.isValid) {
            score -= 0.5;
        }

        // Penalize warnings
        score -= validation.warnings.length * 0.1;

        // Check question length (good questions are usually detailed)
        if (question.question.length < 20) {
            score -= 0.2;
        }

        // Check answer quality
        if (question.answer.length < 30) {
            score -= 0.1;
        }

        // For MCQ questions, check option quality
        if (question.type === 'multiple_choice' && question.options) {
            const avgOptionLength = question.options.reduce((sum, opt) => sum + opt.length, 0) / question.options.length;
            if (avgOptionLength < 10) {
                score -= 0.2;
            }

            // Check for obviously bad patterns
            const badPatterns = ['and other factors', 'the opposite of', 'not applicable'];
            const hasBadPattern = question.options.some(opt => 
                badPatterns.some(pattern => opt.toLowerCase().includes(pattern))
            );
            if (hasBadPattern) {
                score -= 0.3;
            }
        }

        return Math.max(0, Math.min(1, score));
    }

    /**
     * Regenerate poor quality questions
     */
    async regenerateQuestion(questionId, topicId) {
        try {
            // Delete the poor quality question
            await this.deleteQuestion(questionId);
            
            // Generate a new one
            const newQuestions = await this.generateQualityQuestions(topicId, { count: 1 });
            return newQuestions[0];
        } catch (error) {
            console.error('Error regenerating question:', error);
            throw error;
        }
    }

    /**
     * Get practice recommendations based on performance
     */
    async getPracticeRecommendations(topicId) {
        try {
            const stats = await this.getTopicStatistics(topicId);
            const questions = await this.getQuestions(topicId);
            
            const recommendations = {
                suggestedDifficulty: 'medium',
                suggestedType: 'mixed',
                suggestedCount: 5,
                reasons: []
            };

            if (stats.accuracy_rate < 0.5) {
                recommendations.suggestedDifficulty = 'easy';
                recommendations.reasons.push('Focus on easy questions to build confidence');
            } else if (stats.accuracy_rate > 0.8) {
                recommendations.suggestedDifficulty = 'hard';
                recommendations.reasons.push('Try harder questions to challenge yourself');
            }

            if (stats.mcq_count > stats.text_count * 2) {
                recommendations.suggestedType = 'text';
                recommendations.reasons.push('Practice more text-based questions for deeper understanding');
            } else if (stats.text_count > stats.mcq_count * 2) {
                recommendations.suggestedType = 'multiple_choice';
                recommendations.reasons.push('Practice multiple choice for quick assessment');
            }

            if (stats.total_attempts < 10) {
                recommendations.suggestedCount = 3;
                recommendations.reasons.push('Start with fewer questions to get familiar');
            } else if (stats.accuracy_rate > 0.9) {
                recommendations.suggestedCount = 10;
                recommendations.reasons.push('You\'re doing great! Try more questions');
            }

            return recommendations;
        } catch (error) {
            console.error('Error getting practice recommendations:', error);
            return {
                suggestedDifficulty: 'medium',
                suggestedType: 'mixed',
                suggestedCount: 5,
                reasons: ['Unable to analyze performance, using default settings']
            };
        }
    }

    /**
     * Submit answer and get feedback
     */
    async submitAnswer(questionId, answer) {
        return this.request(`/questions/${questionId}/answer`, {
            method: 'POST',
            body: JSON.stringify({ answer }),
        });
    }

    // ===== NOTES METHODS =====
    
    /**
     * Get notes for a topic
     */
    async getNotes(topicId) {
        return this.request(`/topics/${topicId}/notes`);
    }

    /**
     * Delete a note
     */
    async deleteNote(noteId) {
        return this.request(`/notes/${noteId}`, {
            method: 'DELETE',
        });
    }

    // ===== STATISTICS METHODS =====
    
    /**
     * Get learning statistics
     */
    async getStatistics() {
        return this.request('/statistics');
    }

    /**
     * Get subject-specific statistics
     */
    async getSubjectStatistics(subjectId) {
        return this.request(`/subjects/${subjectId}/statistics`);
    }

    /**
     * Get topic-specific statistics
     */
    async getTopicStatistics(topicId) {
        return this.request(`/topics/${topicId}/statistics`);
    }

    // ===== AI MODEL METHODS =====
    
    /**
     * Get available AI models
     */
    async getModels() {
        return this.request('/ollama/models');
    }

    /**
     * Download/pull a new model
     */
    async pullModel(modelName) {
        return this.request('/ollama/pull', {
            method: 'POST',
            body: JSON.stringify({ model: modelName }),
        });
    }

    /**
     * Check AI service health
     */
    async checkHealth() {
        return this.request('/health');
    }

    // ===== UTILITY METHODS =====
    
    /**
     * Validate file before upload
     */
    validateFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!file) {
            throw new Error('No file selected');
        }

        if (file.size > maxSize) {
            throw new Error('File size exceeds 50MB limit');
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error('File type not supported');
        }

        return true;
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Retry failed requests
     */
    async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }
        
        throw lastError;
    }
}

// Create global API instance
window.api = new ApiService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}