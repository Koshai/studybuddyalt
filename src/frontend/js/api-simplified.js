// src/frontend/js/api-simplified.js - Simplified API Service WITH AUTHENTICATION

class SimplifiedApiService {
  constructor() {
    // Auto-detect API base URL based on current location
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol;
    const currentPort = window.location.port;
    
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      // Local development - API on different port
      this.baseURL = 'http://localhost:3001/api';
    } else {
      // Production - API on same domain and port
      this.baseURL = `${currentProtocol}//${currentHost}${currentPort ? ':' + currentPort : ''}/api`;
    }
    
    this.timeout = 30000;
    
    console.log('🌐 API Service configured for:', this.baseURL);
    
    // Authentication properties
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    
    console.log('🔧 API Service initialized with tokens:', {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      accessTokenLength: this.accessToken ? this.accessToken.length : 0
    });
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
      // Don't refresh for login/register endpoints, but do refresh for protected auth endpoints like /auth/profile
      const shouldRefresh = response.status === 401 && this.refreshToken && 
                           !endpoint.includes('/auth/login') && 
                           !endpoint.includes('/auth/register') && 
                           !endpoint.includes('/auth/refresh');
      
      console.log('🔍 Token refresh check:', {
        status: response.status,
        hasRefreshToken: !!this.refreshToken,
        endpoint: endpoint,
        shouldRefresh: shouldRefresh
      });
      
      if (shouldRefresh) {
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
      console.log('🔄 Starting token refresh...');
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('📡 Calling /auth/refresh endpoint...');
      const response = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      
      console.log('📨 Refresh response:', response);
      
      if (response.status === 'success') {
        this.setTokens(response.tokens);
        console.log('✅ Token refreshed successfully');
        return true;
      } else {
        throw new Error('Token refresh failed: ' + (response.message || 'Unknown error'));
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
   * Reload tokens from localStorage (useful after page refresh)
   */
  reloadTokens() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    console.log('🔄 Tokens reloaded from localStorage:', {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.accessToken;
  }

  /**
   * Test authentication by making a simple authenticated request
   */
  async testAuth() {
    try {
      console.log('🧪 Testing authentication...');
      const response = await this.request('/auth/test');
      console.log('✅ Authentication test passed');
      return true;
    } catch (error) {
      console.log('❌ Authentication test failed:', error.message);
      return false;
    }
  }

  /**
   * Test basic server connectivity
   */
  async testConnection() {
    try {
      console.log('🌐 Testing server connection to:', this.baseURL);
      const response = await fetch(`${this.baseURL}/auth/test`);
      const data = await response.json();
      console.log('✅ Server connection successful:', data);
      return { success: true, data };
    } catch (error) {
      console.log('❌ Server connection failed:', error.message);
      return { success: false, error: error.message };
    }
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
   * Get all notes for a subject
   */
  async getSubjectNotes(subjectId) {
    return this.request(`/subjects/${subjectId}/notes`);
  }

  /**
   * Get all notes for the user
   */
  async getAllNotes() {
    return this.request('/notes');
  }

  /**
   * Update a note (for editing)
   */
  async updateNote(noteId, updateData) {
    return this.request(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Create manual note (not from file upload)
   */
  async createManualNote(noteData) {
    return this.request('/notes/manual', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
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
    console.log('📤 API uploadFile called with:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      topicId: topicId,
      hasAccessToken: !!this.accessToken,
      accessTokenPrefix: this.accessToken ? this.accessToken.substring(0, 10) + '...' : 'None'
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicId', topicId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      console.log('🔗 Setting up XMLHttpRequest...');
      
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
        console.log('📨 Upload response received:', {
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText.substring(0, 200) + '...'
        });
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload successful:', response);
            resolve(response);
          } catch (error) {
            console.error('❌ Failed to parse response:', error);
            reject(new Error('Invalid response format'));
          }
        } else if (xhr.status === 401) {
          console.error('❌ 401 Unauthorized response');
          reject(new Error('Authentication required - please log in again'));
        } else if (xhr.status === 403) {
          console.error('❌ 403 Forbidden response');
          reject(new Error('Upload limit reached - upgrade your plan for more storage'));
        } else {
          console.error('❌ Upload failed with status:', xhr.status, xhr.statusText);
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        console.error('❌ Network error during upload');
        reject(new Error('Upload failed - network error'));
      });
      
      xhr.addEventListener('timeout', () => {
        console.error('❌ Upload timeout');
        reject(new Error('Upload timeout - file may be too large'));
      });
      
      xhr.timeout = this.timeout;
      const uploadUrl = `${this.baseURL}/upload-simplified`;
      console.log('🚀 Starting upload to:', uploadUrl);
      xhr.open('POST', uploadUrl);
      
      // Add authentication header AFTER xhr.open()
      if (this.accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
        console.log('🔑 Authorization header added');
      } else {
        console.warn('⚠️ No access token available for upload');
      }
      
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

  // ===== PRACTICE SESSION METHODS =====
  
  /**
   * Get topics that have questions for practice
   */
  async getTopicsWithQuestions() {
    try {
      const response = await this.request('/practice/topics-with-questions');
      return response || [];
    } catch (error) {
      console.error('Failed to load topics with questions:', error);
      return [];
    }
  }

  /**
   * Get practice session statistics
   */
  async getPracticeStats() {
    try {
      const response = await this.request('/practice/stats');
      return response || {
        totalSessions: 0,
        averageScore: 0,
        totalQuestions: 0,
        streak: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        lastSession: null
      };
    } catch (error) {
      console.error('Failed to load practice stats:', error);
      return {
        totalSessions: 0,
        averageScore: 0,
        totalQuestions: 0,
        streak: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        lastSession: null
      };
    }
  }

  /**
   * Record practice session results
   */
  async recordPracticeSession(topicId, results) {
    return this.request('/practice/sessions', {
      method: 'POST',
      body: JSON.stringify({
        topicId,
        results
      })
    });
  }

  /**
   * Evaluate a text answer using AI-powered semantic comparison
   */
  async evaluateTextAnswer(userAnswer, correctAnswer, question, subject = 'general') {
    return this.request('/practice/evaluate-answer', {
      method: 'POST',
      body: JSON.stringify({
        userAnswer,
        correctAnswer,
        question,
        subject
      })
    });
  }

  // ===== NOTE-SPECIFIC QUESTION METHODS =====

  /**
   * Generate questions for a specific note
   */
  async generateQuestionsForNote(noteId, count = 5) {
    return this.request(`/notes/${noteId}/generate-questions`, {
      method: 'POST',
      body: JSON.stringify({ count })
    });
  }

  /**
   * Get all questions for a specific note
   */
  async getQuestionsForNote(noteId) {
    return this.request(`/notes/${noteId}/questions`);
  }

  /**
   * Get random questions for practice from a specific note
   */
  async getRandomQuestionsForNote(noteId, count = 5) {
    return this.request(`/notes/${noteId}/random-questions?count=${count}`);
  }

  /**
   * Get notes with question counts for a topic
   */
  async getNotesWithQuestions(topicId) {
    return this.request(`/topics/${topicId}/notes-with-questions`);
  }

  // ===== ADMIN SYNC MANAGEMENT =====

  /**
   * Get admin sync status and database info
   */
  async getAdminSyncStatus() {
    return this.request('/admin/sync/status');
  }

  /**
   * Manually trigger sync for a user
   */
  async triggerAdminSync(userId, userEmail, syncType = 'full') {
    return this.request('/admin/sync/trigger', {
      method: 'POST',
      body: JSON.stringify({ userId, userEmail, syncType })
    });
  }

  /**
   * Get admin sync logs
   */
  async getAdminSyncLogs(limit = 50) {
    return this.request(`/admin/sync/logs?limit=${limit}`);
  }

  /**
   * Repair or recreate database
   */
  async repairAdminDatabase(action) {
    return this.request('/admin/database/repair', {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  }

  /**
   * Check if user has admin privileges
   */
  async checkAdminAccess() {
    try {
      // Try the simpler auth test first
      await this.request('/admin/auth-test');
      return true;
    } catch (error) {
      if (error.message.includes('403') || error.message.includes('Admin') || error.message.includes('Forbidden')) {
        return false;
      }
      // If it's a 502 or other server error, still try to check
      console.warn('Admin auth test failed, trying sync status:', error.message);
      try {
        await this.getAdminSyncStatus();
        return true;
      } catch (syncError) {
        if (syncError.message.includes('403') || syncError.message.includes('Admin') || syncError.message.includes('Forbidden')) {
          return false;
        }
        throw syncError;
      }
    }
  }
}

// Create global API instance
window.simplifiedApi = new SimplifiedApiService();

// Also make it available as 'api' for compatibility
window.api = window.simplifiedApi;

console.log('✅ Simplified API with Authentication loaded successfully!');