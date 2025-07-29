// src/frontend/js/api-simplified.js - Simplified API Service

class SimplifiedApiService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.timeout = 30000;
  }

  /**
   * Generic request method
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

  // ===== SUBJECTS (Read-Only) =====
  
  /**
   * Get all fixed subjects
   */
  async getSubjects() {
    return this.request('/subjects');
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(subjectId) {
    return this.request(`/subjects/${subjectId}`);
  }

  // ===== TOPICS =====
  
  /**
   * Get topics for a subject
   */
  async getTopics(subjectId) {
    return this.request(`/subjects/${subjectId}/topics`);
  }

  /**
   * Create a new topic under a subject
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
   * Delete a topic and all its data
   */
  async deleteTopic(topicId) {
    return this.request(`/topics/${topicId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get topic with subject information
   */
  async getTopicWithSubject(topicId) {
    return this.request(`/topics/${topicId}/with-subject`);
  }

  // ===== NOTES =====
  
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

  // ===== QUESTIONS =====
  
  /**
   * Generate questions for a topic (SIMPLIFIED)
   */
  async generateQuestions(topicId, count = 5, subjectCategory = null, topic = null) {
    return this.request(`/topics/${topicId}/generate-questions-simplified`, {
      method: 'POST',
      body: JSON.stringify({ 
        count, 
        subjectCategory, 
        topic 
      }),
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

  // ===== PRACTICE SESSIONS =====
  
  /**
   * Record a practice session
   */
  async recordPracticeSession(topicId, questionsCount, correctAnswers) {
    return this.request(`/topics/${topicId}/practice-session`, {
      method: 'POST',
      body: JSON.stringify({ 
        questionsCount, 
        correctAnswers 
      }),
    });
  }

  /**
   * Get topic statistics
   */
  async getTopicStats(topicId) {
    return this.request(`/topics/${topicId}/stats`);
  }

  // ===== STATISTICS =====
  
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      console.log('🔄 Fetching dashboard stats...');
      const response = await this.request('/dashboard/stats');
      console.log('✅ Dashboard stats received:', response);
      return response;
    } catch (error) {
      console.error('❌ Dashboard stats API error:', error);
      
      // Try alternative endpoint or return fallback
      try {
        const fallback = await this.request('/debug/tables');
        console.log('📋 Database debug info:', fallback);
      } catch (debugError) {
        console.error('❌ Even debug endpoint failed:', debugError);
      }
      
      // Return default stats to prevent crashes
      return {
        total_topics: 0,
        total_questions: 0,
        total_notes: 0,
        overall_accuracy: 0,
        total_practice_sessions: 0,
        active_subjects: 0,
        error: error.message
      };
    }
  }

  /**
   * Get subject-wise statistics
   */
  async getSubjectStats() {
    return this.request('/subjects/stats');
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 10) {
    return this.request(`/activity/recent?limit=${limit}`);
  }

  // ===== FILE UPLOAD =====
  
  /**
   * Upload file with progress tracking
   */
  async uploadFile(file, topicId, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
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
      xhr.open('POST', `${this.baseURL}/upload-simplified`);
      xhr.send(formData);
    });
  }

  // ===== AI MODEL MANAGEMENT =====
  
  /**
   * Get available AI models
   */
  async getModels() {
    return this.request('/ollama/models');
  }

  /**
   * Check AI service health
   */
  async checkHealth() {
    return this.request('/health');
  }

  /**
   * Check if Ollama is healthy
   */
  async checkOllamaHealth() {
    return this.request('/ollama/health');
  }

  // ===== DATA MANAGEMENT =====
  
  /**
   * Export all data
   */
  async exportData() {
    return this.request('/export');
  }

  /**
   * Search topics
   */
  async searchTopics(searchTerm) {
    return this.request(`/topics/search?q=${encodeURIComponent(searchTerm)}`);
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
window.simplifiedApi = new SimplifiedApiService();

// Also make it available as 'api' for compatibility
window.api = window.simplifiedApi;

console.log('✅ Simplified API loaded successfully!');