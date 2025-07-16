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