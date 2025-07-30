// src/frontend/js/api-simplified.js - Simplified API Service WITH AUTHENTICATION

class SimplifiedApiService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.timeout = 30000;
    
    // Authentication properties
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  /**
   * Generic request method with authentication
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

    // Add authentication header if we have a token
    if (this.accessToken && !endpoint.startsWith('/auth/')) {
      config.headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle 401 - token expired, try to refresh
      if (response.status === 401 && this.refreshToken && !endpoint.startsWith('/auth/')) {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with new token
          config.headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...config,
            signal: controller.signal
          });
          
          if (retryResponse.ok) {
            const contentType = retryResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              return await retryResponse.json();
            }
            return await retryResponse.text();
          }
        }
        throw new Error('Authentication required - please log in again');
      }
      
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

  // ===== AUTHENTICATION METHODS =====
  
  /**
   * Login user
   */
  async login(email, password) {
    try {
      console.log('🔄 Logging in user:', email);
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (response.status === 'success') {
        this.setTokens(response.tokens);
        console.log('✅ Login successful for:', email);
        return response.user;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      console.log('🔄 Registering user:', userData.email);
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.status === 'success') {
        this.setTokens(response.tokens);
        console.log('✅ Registration successful for:', userData.email);
        return response.user;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getUserProfile() {
    try {
      const response = await this.request('/auth/profile');
      if (response.status === 'success') {
        return response.user;
      } else {
        throw new Error(response.message || 'Failed to get user profile');
      }
    } catch (error) {
      console.error('❌ Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates) {
    try {
      const response = await this.request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (response.status === 'success') {
        return response.user;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      
      if (response.status === 'success') {
        this.setTokens(response.tokens);
        console.log('✅ Token refreshed successfully');
        return true;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      if (this.refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      }
    } catch (error) {
      console.warn('Logout request failed, but clearing local tokens anyway');
    }
    
    this.clearTokens();
    console.log('✅ User logged out');
  }

  /**
   * Set authentication tokens
   */
  setTokens(tokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }

  /**
   * Clear authentication tokens
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.accessToken;
  }

  /**
   * Get user usage statistics
   */
  async getUserUsage() {
    try {
      const response = await this.request('/user/usage');
      return response;
    } catch (error) {
      console.error('❌ Get usage error:', error);
      throw error;
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
   * Generate questions for a topic (Using OpenAI)
   */
  async generateQuestions(topicId, count = 5, subjectCategory = null, topic = null) {
    return this.request(`/topics/${topicId}/generate-questions-openai`, {
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
      
      // Add authentication header
      if (this.accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
      }
      
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
        } else if (xhr.status === 401) {
          reject(new Error('Authentication required - please log in again'));
        } else if (xhr.status === 403) {
          reject(new Error('Upload limit reached - upgrade your plan for more storage'));
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

  // ===== HEALTH CHECK =====
  
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

console.log('✅ Simplified API with Authentication loaded successfully!');