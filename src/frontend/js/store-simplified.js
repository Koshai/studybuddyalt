// src/frontend/js/store-simplified.js - Simplified State Management

class SimplifiedStore {
  constructor() {
    this.state = Vue.reactive({
      // UI State
      currentView: 'dashboard',
      sidebarOpen: true,
      loading: false,
      
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
      
      // Form State
      newTopic: { name: '', description: '' },
      
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

    // Auto-persist to localStorage
    this.setupPersistence();
    this.loadPersistedState();
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

  // ===== UI ACTIONS =====
  
  setCurrentView(view) {
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
      const topic = await window.api.createTopic(subjectId, name, description);
      this.state.topics.push(topic);
      this.updateStatistics();
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
  }

  clearUploadState() {
    this.state.selectedFile = null;
    this.state.uploadProgress = 0;
    this.state.uploading = false;
    this.state.uploadResult = null;
  }

  // ===== MODAL ACTIONS =====
  
  showCreateTopicModal() {
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
      } else {
        this.showNotification('No questions were generated. Please check your study materials.', 'warning');
      }
      
      return questions;
      
    } catch (error) {
      this.showNotification('Failed to generate questions. Check that AI service is running.', 'error');
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
    this.state.topics = [];
    this.state.questions = [];
    this.state.notes = [];
    this.clearSelection();
    this.resetPracticeState();
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
    console.group('StudyAI Simplified State Debug');
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

console.log('✅ Simplified Store loaded successfully!');