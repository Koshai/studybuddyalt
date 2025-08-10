// src/frontend/js/store-simplified.js - Simplified State Management WITH AUTHENTICATION

class SimplifiedStore {
  constructor() {
    // Initialize the authentication promise
    this.authInitialized = null;
    
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
      
      // User-customizable data - now managed centrally
      topics: [],
      questions: [],
      notes: [],
      
      // Reactive data management state
      dataVersion: 0, // Increment to force re-renders
      lastUpdated: {
        topics: null,
        questions: null,
        notes: null
      },
      
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
      showConfirmationModal: false,
      confirmationModal: {
        title: 'Confirm Action',
        message: 'Are you sure you want to continue?',
        details: null,
        type: 'info', // 'info', 'warning', 'danger'
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        confirmIcon: null,
        itemCount: 0,
        loading: false,
        preventBackdropClose: false,
        onConfirm: null,
        onCancel: null
      },
      
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
      generating: false,
      aiService: 'unknown', // 'ollama', 'openai', or 'unknown'
      aiServiceStatus: null // Full service status from API
    });

    // Auto-persist to localStorage (non-sensitive data only)
    this.setupPersistence();
    this.loadPersistedState();
    
    // Auto-load user session if tokens exist (store promise for app to wait)
    this.authInitialized = this.initializeAuth().catch(error => {
      console.warn('Failed to initialize authentication:', error);
    });
  }

  // ===== AUTHENTICATION METHODS =====
  
  /**
   * Initialize authentication on app start
   */
  async initializeAuth() {
    console.log('🔐 Initializing authentication...');
    
    // Ensure API service has the latest tokens from localStorage
    window.api.reloadTokens();
    
    const token = localStorage.getItem('access_token');
    
    if (token) {
      console.log('🔑 Found stored access token, attempting to restore session...');
      this.state.authLoading = true;
      try {
        await this.loadUserFromToken();
        console.log('✅ Session restored successfully');
      } catch (error) {
        console.warn('❌ Failed to load user from token:', error);
        console.log('🧹 Clearing invalid tokens...');
        await window.api.clearTokens();
        this.state.user = null;
        this.state.isAuthenticated = false;
        this.state.subscriptionTier = 'free';
      } finally {
        this.state.authLoading = false;
      }
    } else {
      console.log('🔒 No stored token found, user needs to login');
      this.state.authLoading = false;
    }
  }

  /**
   * Load user from existing token
   */
  async loadUserFromToken() {
    try {
      console.log('📡 Attempting to get user profile from API...');
      const user = await window.api.getUserProfile();
      
      if (!user) {
        throw new Error('No user data received from API');
      }
      
      console.log('👤 User profile received:', {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier
      });
      
      this.state.user = user;
      this.state.isAuthenticated = true;
      this.state.subscriptionTier = user.subscriptionTier || 'free';
      
      console.log('📊 Loading usage statistics...');
      await this.loadUsageStats();
      console.log('✅ User loaded from token:', user.email);
    } catch (error) {
      console.error('❌ Failed to load user from token:', error);
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
      console.error('❌ Login error:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = '';
      
      if (error.message.includes('Invalid credentials') || 
          error.message.includes('invalid email or password') ||
          error.message.includes('unauthorized') ||
          error.message.includes('401')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('user not found') || 
                 error.message.includes('email not found')) {
        errorMessage = 'No account found with this email address. Please check your email or sign up for a new account.';
      } else if (error.message.includes('account locked') || 
                 error.message.includes('too many attempts')) {
        errorMessage = 'Account temporarily locked due to too many failed attempts. Please try again later.';
      } else if (error.message.includes('network') || 
                 error.message.includes('fetch')) {
        errorMessage = 'Connection error. Please check your internet connection and try again.';
      } else if (error.message.includes('server') || 
                 error.message.includes('500')) {
        errorMessage = 'Server error. Please try again in a few moments.';
      } else {
        errorMessage = 'Login failed. Please try again.';
      }
      
      this.showNotification(errorMessage, 'error');
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
      this.showNotification(`Welcome to Jaquizy, ${user.firstName || user.email}!`, 'success');
      console.log('✅ User registered:', user.email);
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Provide specific error messages for registration
      let errorMessage = '';
      
      if (error.message.includes('email already exists') || 
          error.message.includes('user already exists') ||
          error.message.includes('email taken')) {
        errorMessage = 'An account with this email already exists. Please try signing in instead.';
      } else if (error.message.includes('invalid email') || 
                 error.message.includes('email format')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('password') && 
                 error.message.includes('weak')) {
        errorMessage = 'Password is too weak. Please use at least 8 characters with letters and numbers.';
      } else if (error.message.includes('validation') || 
                 error.message.includes('required')) {
        errorMessage = 'Please fill in all required fields correctly.';
      } else if (error.message.includes('network') || 
                 error.message.includes('fetch')) {
        errorMessage = 'Connection error. Please check your internet connection and try again.';
      } else if (error.message.includes('server') || 
                 error.message.includes('500')) {
        errorMessage = 'Server error. Please try again in a few moments.';
      } else {
        errorMessage = 'Registration failed. Please try again.';
      }
      
      this.showNotification(errorMessage, 'error');
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
   * Set authentication mode (for landing page navigation)
   */
  setAuthMode(mode) {
    this.state.authMode = mode;
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
    if (!this.state.isAuthenticated && ['upload', 'practice', 'practice-session', 'browse-practice', 'topics', 'notes'].includes(view)) {
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

  // ===== CENTRALIZED DATA MANAGEMENT =====
  
  /**
   * Centralized method to update notes and notify all components
   */
  updateNotesCache(notes) {
    this.state.notes = Array.isArray(notes) ? [...notes] : [];
    this.state.lastUpdated.notes = Date.now();
    this.state.dataVersion++; // Force reactive updates
    console.log('🔄 Notes cache updated:', this.state.notes.length, 'notes');
  }
  
  /**
   * Centralized method to update topics and notify all components
   */
  updateTopicsCache(topics) {
    this.state.topics = Array.isArray(topics) ? [...topics] : [];
    this.state.lastUpdated.topics = Date.now();
    this.state.dataVersion++; // Force reactive updates
    console.log('🔄 Topics cache updated:', this.state.topics.length, 'topics');
  }
  
  /**
   * Centralized method to update questions and notify all components
   */
  updateQuestionsCache(questions) {
    this.state.questions = Array.isArray(questions) ? [...questions] : [];
    this.state.lastUpdated.questions = Date.now();
    this.state.dataVersion++; // Force reactive updates
    console.log('🔄 Questions cache updated:', this.state.questions.length, 'questions');
  }
  
  /**
   * Add a single note to the cache
   */
  addNote(note) {
    if (note && note.id) {
      // Check if note already exists and update it, or add new
      const existingIndex = this.state.notes.findIndex(n => n.id === note.id);
      if (existingIndex >= 0) {
        this.state.notes[existingIndex] = { ...note };
        console.log('📝 Note updated in cache:', note.id);
      } else {
        this.state.notes.unshift({ ...note }); // Add to beginning for recent notes
        console.log('📝 Note added to cache:', note.id);
      }
      this.state.lastUpdated.notes = Date.now();
      this.state.dataVersion++;
    }
  }
  
  /**
   * Update a single note in the cache
   */
  updateNote(noteId, updateData) {
    const noteIndex = this.state.notes.findIndex(n => n.id === noteId);
    if (noteIndex >= 0) {
      this.state.notes[noteIndex] = { ...this.state.notes[noteIndex], ...updateData };
      this.state.lastUpdated.notes = Date.now();
      this.state.dataVersion++;
      console.log('📝 Note updated in cache:', noteId);
      return this.state.notes[noteIndex];
    }
    return null;
  }
  
  /**
   * Remove a note from the cache
   */
  removeNote(noteId) {
    const initialLength = this.state.notes.length;
    this.state.notes = this.state.notes.filter(n => n.id !== noteId);
    if (this.state.notes.length < initialLength) {
      this.state.lastUpdated.notes = Date.now();
      this.state.dataVersion++;
      console.log('📝 Note removed from cache:', noteId);
    }
  }
  
  /**
   * Add a single topic to the cache
   */
  addTopic(topic) {
    if (topic && topic.id) {
      // Check if topic already exists
      const existingIndex = this.state.topics.findIndex(t => t.id === topic.id);
      if (existingIndex >= 0) {
        this.state.topics[existingIndex] = { ...topic };
        console.log('📚 Topic updated in cache:', topic.id);
      } else {
        this.state.topics.push({ ...topic });
        console.log('📚 Topic added to cache:', topic.id);
      }
      this.state.lastUpdated.topics = Date.now();
      this.state.dataVersion++;
    }
  }
  
  /**
   * Add questions to the cache
   */
  addQuestions(questions) {
    if (Array.isArray(questions) && questions.length > 0) {
      // Merge questions, avoiding duplicates
      const newQuestions = questions.filter(q => 
        !this.state.questions.some(existing => existing.id === q.id)
      );
      this.state.questions.push(...newQuestions);
      this.state.lastUpdated.questions = Date.now();
      this.state.dataVersion++;
      console.log('❓ Questions added to cache:', newQuestions.length);
    }
  }

  // ===== TOPIC ACTIONS =====
  
  async loadTopicsForSubject(subjectId) {
    try {
      this.setLoading(true);
      const topics = await window.api.getTopics(subjectId);
      this.updateTopicsCache(topics); // Use centralized update
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
      
      // Use centralized updates
      this.updateQuestionsCache(questions);
      this.updateNotesCache(notes);
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
      this.addTopic(topic); // Use centralized add
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

  // ===== CONFIRMATION MODAL ACTIONS =====
  
  /**
   * Show confirmation modal with custom options
   */
  showConfirmationModal(options = {}) {
    this.state.confirmationModal = {
      title: options.title || 'Confirm Action',
      message: options.message || 'Are you sure you want to continue?',
      details: options.details || null,
      type: options.type || 'info',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      confirmIcon: options.confirmIcon || null,
      itemCount: options.itemCount || 0,
      loading: false,
      preventBackdropClose: options.preventBackdropClose || false,
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null
    };
    this.state.showConfirmationModal = true;
  }

  /**
   * Hide confirmation modal and reset state
   */
  hideConfirmationModal() {
    this.state.showConfirmationModal = false;
    this.state.confirmationModal.loading = false;
    // Don't reset callbacks immediately to allow handler execution
    setTimeout(() => {
      this.state.confirmationModal.onConfirm = null;
      this.state.confirmationModal.onCancel = null;
    }, 100);
  }

  /**
   * Set confirmation modal loading state
   */
  setConfirmationLoading(loading) {
    this.state.confirmationModal.loading = loading;
  }

  /**
   * Quick method for delete confirmations
   */
  confirmDelete(itemName, onConfirm, itemCount = 1) {
    this.showConfirmationModal({
      title: `Delete ${itemName}?`,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      details: itemCount > 1 ? `This will also delete ${itemCount - 1} related items.` : null,
      type: 'danger',
      confirmText: 'Delete',
      confirmIcon: 'fas fa-trash',
      itemCount: itemCount,
      onConfirm: onConfirm
    });
  }

  /**
   * Quick method for logout confirmation
   */
  confirmLogout(onConfirm) {
    this.showConfirmationModal({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      details: 'You will need to sign in again to access your study materials.',
      type: 'warning',
      confirmText: 'Sign Out',
      confirmIcon: 'fas fa-sign-out-alt',
      onConfirm: onConfirm
    });
  }

  // ===== ERROR STATE HELPERS =====
  
  /**
   * Show network error with helpful tips
   */
  showNetworkError(onRetry = null) {
    return {
      errorType: 'network',
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection.',
      showRetry: true,
      tips: [
        'Check your internet connection',
        'Try refreshing the page',
        'Disable any VPN or proxy',
        'Check if the server is online'
      ],
      onRetry: onRetry
    };
  }

  /**
   * Show server error with retry option
   */
  showServerError(onRetry = null) {
    return {
      errorType: 'server',
      title: 'Server Error',
      message: 'The server encountered an error. Our team has been notified.',
      showRetry: true,
      showSupport: true,
      tips: [
        'Try again in a few moments',
        'The issue is usually temporary',
        'Contact support if the problem persists'
      ],
      onRetry: onRetry
    };
  }

  /**
   * Show authentication error
   */
  showAuthError() {
    return {
      errorType: 'auth',
      title: 'Authentication Required',
      message: 'You need to be signed in to access this feature.',
      showRetry: false,
      showHome: true,
      tips: [
        'Sign in to your account',
        'Create a new account if you don\'t have one',
        'Check if your session has expired'
      ]
    };
  }

  /**
   * Show not found error
   */
  showNotFoundError(itemType = 'content') {
    return {
      errorType: 'notfound',
      title: `${itemType} Not Found`,
      message: `The ${itemType.toLowerCase()} you're looking for doesn't exist or has been moved.`,
      showRetry: false,
      showGoBack: true,
      showHome: true,
      tips: [
        'Check the URL for typos',
        'Go back to the previous page',
        'Search for what you\'re looking for'
      ]
    };
  }

  /**
   * Show AI service error
   */
  showAIServiceError(onRetry = null) {
    return {
      errorType: 'server',
      title: 'AI Service Unavailable',
      message: 'The AI service is temporarily unavailable. Question generation is disabled.',
      showRetry: true,
      tips: [
        'Try again in a few minutes',
        'Check if Ollama is running (local mode)',
        'Verify OpenAI API key (cloud mode)',
        'Contact support if the issue persists'
      ],
      onRetry: onRetry
    };
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
        this.addQuestions(questions); // Use centralized add
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

  async updateAiServiceStatus() {
    try {
      const response = await window.api.request('/health/ai');
      this.state.aiServiceStatus = response;
      this.state.aiOnline = response.status === 'healthy';
      this.state.aiService = response.primary_service || 'unknown';
      console.log('🤖 AI Service Status Updated:', response.primary_service);
    } catch (error) {
      console.error('Failed to update AI service status:', error);
      this.state.aiOnline = false;
      this.state.aiService = 'unknown';
      this.state.aiServiceStatus = null;
    }
  }

  // ===== CENTRALIZED API OPERATIONS =====
  
  /**
   * Centralized method to fetch all notes and update state
   */
  async fetchAllNotes() {
    if (!this.state.isAuthenticated) return [];
    
    try {
      console.log('📋 Fetching all notes from API...');
      const notes = await window.api.getAllNotes();
      this.updateNotesCache(notes);
      return notes;
    } catch (error) {
      console.error('Failed to fetch all notes:', error);
      this.showNotification('Failed to load notes', 'error');
      return [];
    }
  }
  
  /**
   * Centralized method to create a note and update state
   */
  async createNote(noteData) {
    if (!this.state.isAuthenticated) {
      this.showAuthModal('login');
      return null;
    }
    
    try {
      console.log('📝 Creating new note via API...');
      const newNote = await window.api.createManualNote(noteData);
      this.addNote(newNote);
      this.showNotification('Note created successfully!', 'success');
      await this.loadUsageStats(); // Update usage stats
      return newNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      if (error.message.includes('limit')) {
        this.showNotification('Create failed: ' + error.message, 'warning');
      } else {
        this.showNotification('Failed to create note', 'error');
      }
      throw error;
    }
  }
  
  /**
   * Centralized method to update a note and update state
   */
  async updateNoteById(noteId, updateData) {
    if (!this.state.isAuthenticated) {
      this.showAuthModal('login');
      return null;
    }
    
    try {
      console.log('✏️ Updating note via API:', noteId);
      const updatedNote = await window.api.updateNote(noteId, updateData);
      this.updateNote(noteId, updatedNote);
      this.showNotification('Note updated successfully!', 'success');
      return updatedNote;
    } catch (error) {
      console.error('Failed to update note:', error);
      if (error.message.includes('limit')) {
        this.showNotification('Update failed: ' + error.message, 'warning');
      } else {
        this.showNotification('Failed to update note', 'error');
      }
      throw error;
    }
  }
  
  /**
   * Centralized method to delete a note and update state
   */
  async deleteNoteById(noteId) {
    if (!this.state.isAuthenticated) {
      this.showAuthModal('login');
      return false;
    }
    
    try {
      console.log('🗑️ Deleting note via API:', noteId);
      await window.api.deleteNote(noteId);
      this.removeNote(noteId);
      this.showNotification('Note deleted successfully', 'success');
      return true;
    } catch (error) {
      console.error('Failed to delete note:', error);
      this.showNotification('Failed to delete note', 'error');
      return false;
    }
  }
  
  /**
   * Get current notes from cache (reactive)
   */
  getAllNotes() {
    return Array.isArray(this.state.notes) ? this.state.notes : [];
  }
  
  /**
   * Get notes for a specific topic from cache
   */
  getNotesForTopic(topicId) {
    const notes = Array.isArray(this.state.notes) ? this.state.notes : [];
    return notes.filter(note => note.topic_id === topicId);
  }
  
  /**
   * Get current topics from cache (reactive)
   */
  getAllTopics() {
    return Array.isArray(this.state.topics) ? this.state.topics : [];
  }
  
  /**
   * Get topics for a specific subject from cache
   */
  getTopicsForSubject(subjectId) {
    const topics = Array.isArray(this.state.topics) ? this.state.topics : [];
    return topics.filter(topic => topic.subject_id === subjectId);
  }
  
  /**
   * Get current questions from cache (reactive)
   */
  getAllQuestions() {
    return Array.isArray(this.state.questions) ? this.state.questions : [];
  }
  
  /**
   * Get questions for a specific topic from cache
   */
  getQuestionsForTopic(topicId) {
    const questions = Array.isArray(this.state.questions) ? this.state.questions : [];
    return questions.filter(question => question.topic_id === topicId);
  }

  // ===== STATISTICS =====
  
  async updateStatistics() {
    if (!this.state.isAuthenticated) return;
    
    try {
      console.log('🔄 Updating dashboard statistics...');
      const response = await window.api.getDashboardStats();
      console.log('📊 Dashboard stats response:', response);
      
      // Handle both direct stats and wrapped response
      const stats = response.stats || response;
      
      this.state.statistics = {
        totalTopics: stats.total_topics || 0,
        totalQuestions: stats.total_questions || 0,
        totalNotes: stats.total_notes || 0,
        totalPracticeSessions: stats.total_practice_sessions || 0,
        overallAccuracy: stats.overall_accuracy || 0
      };
      
      console.log('✅ Statistics updated:', this.state.statistics);
    } catch (error) {
      console.error('❌ Failed to update statistics:', error);
      // Set zero stats on error
      this.state.statistics = {
        totalTopics: 0,
        totalQuestions: 0,
        totalNotes: 0,
        totalPracticeSessions: 0,
        overallAccuracy: 0
      };
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
  
  /**
   * Test authentication manually for debugging
   */
  async testAuthentication() {
    console.log('🧪 === AUTHENTICATION DEBUG TEST ===');
    
    // Check localStorage
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    console.log('📦 LocalStorage tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken ? accessToken.length : 0,
      accessTokenStart: accessToken ? accessToken.substring(0, 10) + '...' : 'none'
    });
    
    // Check API service tokens
    console.log('🔧 API Service tokens:', {
      hasAccessToken: !!window.api.accessToken,
      hasRefreshToken: !!window.api.refreshToken,
      tokensMatch: window.api.accessToken === accessToken
    });
    
    // Test API call
    try {
      console.log('📡 Testing API call to /auth/profile...');
      const user = await window.api.getUserProfile();
      console.log('✅ API call successful:', user);
      return { success: true, user };
    } catch (error) {
      console.log('❌ API call failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  getState() {
    return this.state;
  }

  debugState() {
    console.group('Jaquizy Simplified State Debug (With Auth)');
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