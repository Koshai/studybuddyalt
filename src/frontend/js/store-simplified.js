// src/frontend/js/store-simplified.js - Simplified State Management WITH AUTHENTICATION

class SimplifiedStore {
  constructor() {
    this.state = Vue.reactive({
      // UI State
      currentView: 'dashboard',
      sidebarOpen: true,
      loading: false,
      
      // Authentication State
      user: null,
      isAuthenticated: false,
      authLoading: false,
      
      // Subscription & Usage State
      subscriptionTier: 'free',
      usage: {
        questions: { used: 0, limit: 100, percentage: 0 },
        storage: { used: 0, limit: 100 * 1024 * 1024, percentage: 0, usedMB: 0, limitMB: 100 },
        topics: { used: 0, limit: 5 }
      },
      
      // Fixed subjects (no user modification)
      subjects: [
        {
          id: 'mathematics',
          name: 'Mathematics',
          description: 'Algebra, Calculus, Statistics, Geometry, Arithmetic',
          icon: 'fas fa-calculator',
          color: 'bg-blue-500'
        },
        {
          id: 'natural-sciences',
          name: 'Natural Sciences', 
          description: 'Physics, Chemistry, Biology, Earth Science',
          icon: 'fas fa-atom',
          color: 'bg-green-500'
        },
        {
          id: 'literature',
          name: 'Literature & Writing',
          description: 'English, Creative Writing, Poetry, Drama, Reading',
          icon: 'fas fa-book-open',
          color: 'bg-purple-500'
        },
        {
          id: 'history',
          name: 'History & Social Studies',
          description: 'World History, Government, Geography, Economics',
          icon: 'fas fa-landmark',
          color: 'bg-amber-500'
        },
        {
          id: 'languages',
          name: 'Foreign Languages',
          description: 'Spanish, French, German, Chinese, Language Learning',
          icon: 'fas fa-language',
          color: 'bg-red-500'
        },
        {
          id: 'arts',
          name: 'Arts & Humanities',
          description: 'Art History, Music, Philosophy, Theater, Culture',
          icon: 'fas fa-palette',
          color: 'bg-pink-500'
        },
        {
          id: 'computer-science',
          name: 'Computer Science',
          description: 'Programming, Algorithms, Data Structures, Technology',
          icon: 'fas fa-code',
          color: 'bg-indigo-500'
        },
        {
          id: 'business',
          name: 'Business & Economics',
          description: 'Finance, Marketing, Management, Economics, Trade',
          icon: 'fas fa-chart-line',
          color: 'bg-emerald-500'
        },
        {
          id: 'health-medicine',
          name: 'Health & Medicine',
          description: 'Anatomy, Nursing, Public Health, Psychology, Wellness',
          icon: 'fas fa-heartbeat',
          color: 'bg-rose-500'
        },
        {
          id: 'other',
          name: 'General Studies',
          description: 'Engineering, Agriculture, Specialized fields, Miscellaneous',
          icon: 'fas fa-graduation-cap',
          color: 'bg-gray-500'
        }
      ],
      
      // User-customizable data
      topics: [],
      questions: [],
      notes: [],
      
      // Selection State
      selectedSubject: null,
      selectedTopic: null,
      
      // Practice State
      currentQuestionIndex: 0,
      userAnswer: '',
      showAnswer: false,
      score: { correct: 0, total: 0 },
      practiceStarted: false,
      
      // Upload State
      selectedFile: null,
      uploadProgress: 0,
      uploading: false,
      uploadResult: null,
      
      // Modal State
      showCreateTopicModal: false,
      showAuthModal: false,
      authMode: 'login', // 'login' or 'register'
      
      // Form State
      newTopic: { name: '', description: '' },
      authForm: {
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        username: ''
      },
      
      // Notifications
      notifications: [],
      
      // Statistics
      statistics: {
        totalTopics: 0,
        totalQuestions: 0,
        totalNotes: 0,
        totalPracticeSessions: 0,
        overallAccuracy: 0
      },
      
      // AI State
      aiOnline: false,
      generating: false
    });

    // Auto-persist to localStorage (non-sensitive data only)
    this.setupPersistence();
    this.loadPersistedState();
    
    // Auto-load user session if tokens exist
    this.initializeAuth();
  }

  // ===== AUTHENTICATION METHODS =====
  
  /**
   * Initialize authentication on app start
   */
  async initializeAuth() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.state.authLoading = true;
      try {
        await this.loadUserFromToken();
      } catch (error) {
        console.warn('Failed to load user from token:', error);
        await window.api.clearTokens();
      } finally {
        this.state.authLoading = false;
      }
    }
  }

  /**
   * Load user from existing token
   */
  async loadUserFromToken() {
    try {
      const user = await window.api.getUserProfile();
      this.state.user = user;
      this.state.isAuthenticated = true;
      this.state.subscriptionTier = user.subscriptionTier || 'free';
      
      await this.loadUsageStats();
      console.log('✅ User loaded from token:', user.email);
    } catch (error) {
      throw new Error('Invalid token: ' + error.message);
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    this.state.authLoading = true;
    try {
      const user = await window.api.login(email, password);
      this.state.user = user;
      this.state.isAuthenticated = true;
      this.state.subscriptionTier = user.subscriptionTier || 'free';
      this.state.showAuthModal = false;
      
      await this.loadUsageStats();
      this.showNotification(`Welcome back, ${user.firstName || user.email}!`, 'success');
      console.log('✅ User logged in:', user.email);
    } catch (error) {
      this.showNotification('Login failed: ' + error.message, 'error');
      throw error;
    } finally {
      this.state.authLoading = false;
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    this.state.authLoading = true;
    try {
      const user = await window.api.register(userData);
      this.state.user = user;
      this.state.isAuthenticated = true;
      this.state.subscriptionTier = user.subscriptionTier || 'free';
      this.state.showAuthModal = false;
      
      await this.loadUsageStats();
      this.showNotification(`Welcome to StudyAI, ${user.firstName || user.email}!`, 'success');
      console.log('✅ User registered:', user.email);
    } catch (error) {
      this.showNotification('Registration failed: ' + error.message, 'error');
      throw error;
    } finally {
      this.state.authLoading = false;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await window.api.logout();
      this.state.user = null;
      this.state.isAuthenticated = false;
      this.state.subscriptionTier = 'free';
      this.resetUserData();
      this.showNotification('Logged out successfully', 'success');
      console.log('✅ User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Load usage statistics
   */
  async loadUsageStats() {
    try {
      const usage = await window.api.getUserUsage();
      this.state.usage = usage;
      console.log('📊 Usage stats loaded:', usage);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      const updatedUser = await window.api.updateUserProfile(updates);
      this.state.user = { ...this.state.user, ...updatedUser };
      this.showNotification('Profile updated successfully', 'success');
    } catch (error) {
      this.showNotification('Failed to update profile: ' + error.message, 'error');
      throw error;
    }
  }

  /**
   * Reset user-specific data on logout
   */
  resetUserData() {
    this.state.topics = [];
    this.state.questions = [];
    this.state.notes = [];
    this.state.usage = {
      questions: { used: 0, limit: 100, percentage: 0 },
      storage: { used: 0, limit: 100 * 1024 * 1024, percentage: 0, usedMB: 0, limitMB: 100 },
      topics: { used: 0, limit: 5 }
    };
    this.clearSelection();
    this.resetPracticeState();
  }

  // ===== AUTHENTICATION UI METHODS =====
  
  /**
   * Show authentication modal
   */
  showAuthModal(mode = 'login') {
    this.state.showAuthModal = true;
    this.state.authMode = mode;
    this.resetAuthForm();
  }

  /**
   * Hide authentication modal
   */
  hideAuthModal() {
    this.state.showAuthModal = false;
    this.resetAuthForm();
  }

  /**
   * Switch between login/register modes
   */
  switchAuthMode(mode) {
    this.state.authMode = mode;
    this.resetAuthForm();
  }

  /**
   * Reset authentication form
   */
  resetAuthForm() {
    this.state.authForm = {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      username: ''
    };
  }

  // ===== USAGE LIMIT CHECKS =====
  
  /**
   * Check if user can generate more questions
   */
  canGenerateQuestions() {
    const usage = this.state.usage.questions;
    return usage.used < usage.limit;
  }

  /**
   * Check if user can create more topics in a subject
   */
  canCreateTopic(subjectId) {
    if (this.state.subscriptionTier === 'pro') return true;
    
    const topicsInSubject = this.state.topics.filter(t => t.subject_id === subjectId).length;
    return topicsInSubject < this.state.usage.topics.limit;
  }

  /**
   * Check if user can upload more files
   */
  canUploadFile(fileSize) {
    const usage = this.state.usage.storage;
    return (usage.used + fileSize) <= usage.limit;
  }

  /**
   * Show upgrade notification for limits
   */
  showUpgradeNotification(feature) {
    const messages = {
      questions: 'Monthly question limit reached! Upgrade to Pro for 1500 questions per month.',
      topics: 'Topic limit reached for this subject! Upgrade to Pro for unlimited topics.',
      storage: 'Storage limit reached! Upgrade to Pro for 5GB of storage.'
    };
    
    this.showNotification(messages[feature] || 'Upgrade to Pro for more features!', 'warning');
  }

  // ===== GETTERS =====
  
  get currentQuestion() {
    if (!this.state.practiceStarted || 
        this.state.questions.length === 0 || 
        this.state.currentQuestionIndex >= this.state.questions.length) {
      return null;
    }
    
    return this.state.questions[this.state.currentQuestionIndex];
  }

  get progressPercentage() {
    if (this.state.questions.length === 0) return 0;
    return Math.round(((this.state.currentQuestionIndex + 1) / this.state.questions.length) * 100);
  }

  get accuracyPercentage() {
    if (this.state.score.total === 0) return 0;
    return Math.round((this.state.score.correct / this.state.score.total) * 100);
  }

  get hasData() {
    return this.state.topics.length > 0;
  }

  get requiresAuth() {
    return !this.state.isAuthenticated;
  }

  // ===== UI ACTIONS =====
  
  setCurrentView(view) {
    // Require authentication for certain views
    if (!this.state.isAuthenticated && ['upload', 'practice', 'topics'].includes(view)) {
      this.showAuthModal('login');
      return;
    }
    this.state.currentView = view;
  }

  toggleSidebar() {
    this.state.sidebarOpen = !this.state.sidebarOpen;
  }

  setLoading(loading) {
    this.state.loading = loading;
  }

  // ===== SUBJECT ACTIONS (Read-Only) =====
  
  getSubjectById(subjectId) {
    return this.state.subjects.find(s => s.id === subjectId);
  }

  selectSubject(subject) {
    if (!this.state.isAuthenticated) {
      this.showAuthModal('login');
      return;
    }
    
    this.state.selectedSubject = subject;
    this.state.selectedTopic = null;
    this.loadTopicsForSubject(subject.id);
  }

  // ===== TOPIC ACTIONS =====
  
  async loadTopicsForSubject(subjectId) {
    try {
      this.setLoading(true);
      const topics = await window.api.getTopics(subjectId);
      this.state.topics = topics;
    } catch (error) {
      this.showNotification('Failed to load topics', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  selectTopic(topic) {
    if (!this.state.isAuthenticated) {
      this.showAuthModal('login');
      return;
    }
    
    this.state.selectedTopic = topic;
    this.loadTopicData(topic.id);
  }

  async loadTopicData(topicId) {
    try {
      const [questions, notes] = await Promise.all([
        window.api.getQuestions(topicId),
        window.api.getNotes(topicId)
      ]);
      
      this.state.questions = questions;
      this.state.notes = notes;
    } catch (error) {
      this.showNotification('Failed to load topic data', 'error');
    }
  }

  async createTopic(subjectId, name, description) {
    try {
      // Check topic limit
      if (!this.canCreateTopic(subjectId)) {
        this.showUpgradeNotification('topics');
        throw new Error('Topic limit reached for this subject');
      }
      
      const topic = await window.api.createTopic(subjectId, name, description);
      this.state.topics.push(topic);
      await this.updateStatistics();
      return topic;
    } catch (error) {
      this.showNotification('Failed to create topic', 'error');
      throw error;
    }
  }

  clearSelection() {
    this.state.selectedSubject = null;
    this.state.selectedTopic = null;
    this.state.topics = [];
    this.state.questions = [];
    this.state.notes = [];
  }

  // ===== PRACTICE ACTIONS =====
  
  startPractice(questions) {
    if (!this.state.isAuthenticated) {
      this.showAuthModal('login');
      return false;
    }
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      this.showNotification('No questions available for practice', 'error');
      return false;
    }
    
    this.resetPracticeState();
    this.state.questions = [...questions];
    this.state.practiceStarted = true;
    this.state.currentQuestionIndex = 0;
    this.state.userAnswer = '';
    this.state.showAnswer = false;
    
    return true;
  }

  nextQuestion() {
    if (this.state.currentQuestionIndex < this.state.questions.length - 1) {
      this.state.currentQuestionIndex++;
      this.state.userAnswer = '';
      this.state.showAnswer = false;
    } else {
      this.endPractice();
    }
  }

  submitAnswer(isCorrect) {
    this.state.showAnswer = true;
    if (isCorrect) {
      this.state.score.correct++;
    }
    this.state.score.total++;
    this.updateStatistics();
  }

  async endPractice() {
    const percentage = this.accuracyPercentage;
    this.state.practiceStarted = false;
    
    // Record practice session
    if (this.state.selectedTopic) {
      try {
        await window.api.recordPracticeSession(
          this.state.selectedTopic.id,
          this.state.score.total,
          this.state.score.correct
        );
      } catch (error) {
        console.error('Failed to record practice session:', error);
      }
    }
    
    this.showNotification(`Practice completed! Score: ${percentage}%`, 'success');
  }

  resetPracticeState() {
    this.state.currentQuestionIndex = 0;
    this.state.userAnswer = '';
    this.state.showAnswer = false;
    this.state.practiceStarted = false;
    this.state.questions = [];
    this.state.score = { correct: 0, total: 0 };
  }

  // ===== UPLOAD ACTIONS =====
  
  setUploading(uploading) {
    this.state.uploading = uploading;
  }

  setUploadProgress(progress) {
    this.state.uploadProgress = progress;
  }

  setUploadResult(result) {
    this.state.uploadResult = result;
    // Refresh usage stats after upload
    this.loadUsageStats();
  }

  clearUploadState() {
    this.state.selectedFile = null;
    this.state.uploadProgress = 0;
    this.state.uploading = false;
    this.state.uploadResult = null;
  }

  // ===== MODAL ACTIONS =====
  
  showCreateTopicModal() {
    if (!this.state.isAuthenticated) {
      this.showAuthModal('login');
      return;
    }
    
    if (!this.state.selectedSubject) {
      this.showNotification('Please select a subject first', 'warning');
      return;
    }
    
    this.state.showCreateTopicModal = true;
    this.state.newTopic = { name: '', description: '' };
  }

  hideCreateTopicModal() {
    this.state.showCreateTopicModal = false;
    this.state.newTopic = { name: '', description: '' };
  }

  // ===== QUESTION GENERATION =====
  
  setGenerating(generating) {
    this.state.generating = generating;
  }

  async generateQuestions(topicId, count = 5) {
    if (!this.state.isAuthenticated) {
      this.showAuthModal('login');
      return [];
    }
    
    if (!this.canGenerateQuestions()) {
      this.showUpgradeNotification('questions');
      return [];
    }

    if (!this.state.selectedTopic) {
      this.showNotification('Please select a topic first', 'warning');
      return [];
    }

    try {
      this.setGenerating(true);
      
      // Get subject category for the topic's subject
      const subjectCategory = this.getSubjectById(this.state.selectedTopic.subject_id);
      
      const questions = await window.api.generateQuestions(
        topicId,
        count,
        subjectCategory,
        this.state.selectedTopic
      );
      
      if (questions.length > 0) {
        this.state.questions = [...this.state.questions, ...questions];
        this.showNotification(`Generated ${questions.length} questions successfully!`, 'success');
        
        // Refresh usage stats
        await this.loadUsageStats();
      } else {
        this.showNotification('No questions were generated. Please check your study materials.', 'warning');
      }
      
      return questions;
      
    } catch (error) {
      if (error.message.includes('limit')) {
        this.showUpgradeNotification('questions');
      } else {
        this.showNotification('Failed to generate questions. Check that AI service is running.', 'error');
      }
      return [];
    } finally {
      this.setGenerating(false);
    }
  }

  // ===== NOTIFICATION ACTIONS =====
  
  showNotification(message, type = 'info', duration = 4000) {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, timestamp: Date.now() };
    
    this.state.notifications.push(notification);
    
    setTimeout(() => {
      this.removeNotification(id);
    }, duration);
    
    return id;
  }

  removeNotification(id) {
    this.state.notifications = this.state.notifications.filter(n => n.id !== id);
  }

  // ===== AI ACTIONS =====
  
  setAiOnline(online) {
    this.state.aiOnline = online;
  }

  // ===== STATISTICS =====
  
  async updateStatistics() {
    if (!this.state.isAuthenticated) return;
    
    try {
      const stats = await window.api.getDashboardStats();
      this.state.statistics = {
        totalTopics: stats.total_topics || 0,
        totalQuestions: stats.total_questions || 0,
        totalNotes: stats.total_notes || 0,
        totalPracticeSessions: stats.total_practice_sessions || 0,
        overallAccuracy: stats.overall_accuracy || 0
      };
    } catch (error) {
      console.error('Failed to update statistics:', error);
    }
  }

  // ===== PERSISTENCE =====
  
  setupPersistence() {
    Vue.watchEffect(() => {
      // Only persist non-sensitive UI state
      const stateToSave = {
        selectedSubject: this.state.selectedSubject,
        selectedTopic: this.state.selectedTopic,
        score: this.state.score,
        statistics: this.state.statistics,
        sidebarOpen: this.state.sidebarOpen,
        currentView: this.state.currentView
      };
      
      try {
        localStorage.setItem('studyai_simplified_state', JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to persist state:', error);
      }
    });
  }

  loadPersistedState() {
    try {
      const saved = localStorage.getItem('studyai_simplified_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        if (parsed.selectedSubject) this.state.selectedSubject = parsed.selectedSubject;
        if (parsed.selectedTopic) this.state.selectedTopic = parsed.selectedTopic;
        if (parsed.score) this.state.score = parsed.score;
        if (parsed.statistics) this.state.statistics = parsed.statistics;
        if (typeof parsed.sidebarOpen === 'boolean') this.state.sidebarOpen = parsed.sidebarOpen;
        if (parsed.currentView) this.state.currentView = parsed.currentView;
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }

  clearPersistedState() {
    try {
      localStorage.removeItem('studyai_simplified_state');
    } catch (error) {
      console.warn('Failed to clear persisted state:', error);
    }
  }

  // ===== UTILITY METHODS =====
  
  resetState() {
    this.resetUserData();
    this.clearUploadState();
    this.state.score = { correct: 0, total: 0 };
    this.state.statistics = {
      totalTopics: 0,
      totalQuestions: 0,
      totalNotes: 0,
      totalPracticeSessions: 0,
      overallAccuracy: 0
    };
    this.clearPersistedState();
  }

  async exportData() {
    if (!this.state.isAuthenticated) {
      this.showAuthModal('login');
      return;
    }
    
    try {
      const data = await window.api.exportData();
      return data;
    } catch (error) {
      this.showNotification('Failed to export data', 'error');
      throw error;
    }
  }

  // ===== DEBUG METHODS =====
  
  getState() {
    return this.state;
  }

  debugState() {
    console.group('StudyAI Simplified State Debug (With Auth)');
    console.log('Authentication:', {
      isAuthenticated: this.state.isAuthenticated,
      user: this.state.user?.email,
      subscriptionTier: this.state.subscriptionTier
    });
    console.log('Usage:', this.state.usage);
    console.log('Current View:', this.state.currentView);
    console.log('Selected Subject:', this.state.selectedSubject?.name);
    console.log('Selected Topic:', this.state.selectedTopic?.name);
    console.log('Topics:', this.state.topics.length);
    console.log('Questions:', this.state.questions.length);
    console.log('Notes:', this.state.notes.length);
    console.log('Practice Started:', this.state.practiceStarted);
    console.log('Score:', this.state.score);
    console.log('Statistics:', this.state.statistics);
    console.log('AI Online:', this.state.aiOnline);
    console.groupEnd();
  }
}

// Create global store instance
window.simplifiedStore = new SimplifiedStore();

// Also make it available as 'store' for compatibility
window.store = window.simplifiedStore;

console.log('✅ Simplified Store with Authentication loaded successfully!');