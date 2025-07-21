// js/store.js - State Management

class Store {
    constructor() {
        this.state = Vue.reactive({
            // UI State
            currentView: 'dashboard',
            sidebarOpen: true,
            loading: false,
            
            // Data State
            subjects: [],
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
            practiceConfig: { count: 5, difficulty: 'medium' },
            
            // Upload State
            selectedFile: null,
            uploadProgress: 0,
            uploading: false,
            uploadResult: null,
            dragOver: false,
            
            // Modal State
            showCreateSubjectModal: false,
            showCreateTopicModal: false,
            
            // Form State
            newSubject: { name: '', description: '' },
            newTopic: { name: '', description: '' },
            
            // Notifications
            notifications: [],
            
            // Statistics
            statistics: {
                totalSubjects: 0,
                totalTopics: 0,
                totalQuestions: 0,
                totalAnswered: 0,
                accuracyRate: 0
            },
            
            // AI State
            aiOnline: false,
            generating: false,
            availableModels: []
        });

        // Auto-persist to localStorage
        this.setupPersistence();
        
        // Load initial data
        this.loadPersistedState();
    }

    // ===== STATE GETTERS =====
    
    get currentQuestion() {
        const question = this.state.questions.length > 0 && 
                        this.state.currentQuestionIndex < this.state.questions.length
            ? this.state.questions[this.state.currentQuestionIndex]
            : null;
        
        console.log('Store getter: currentQuestion called', {
            questionsCount: this.state.questions.length,
            currentIndex: this.state.currentQuestionIndex,
            practiceStarted: this.state.practiceStarted,
            question: question ? question.question?.substring(0, 50) + '...' : 'null'
        });
        
        return question;
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
        return this.state.subjects.length > 0;
    }

    get canPractice() {
        return this.state.selectedTopic && this.state.questions.length > 0;
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

    // ===== SELECTION ACTIONS =====
    
    selectSubject(subject) {
        this.state.selectedSubject = subject;
        this.state.selectedTopic = null;
        this.state.currentView = 'subjects';
    }

    selectTopic(topic) {
        this.state.selectedTopic = topic;
        this.state.currentView = 'practice';
    }

    clearSelection() {
        this.state.selectedSubject = null;
        this.state.selectedTopic = null;
    }

    // ===== DATA ACTIONS =====
    
    setSubjects(subjects) {
        this.state.subjects = subjects;
        this.updateStatistics();
    }

    addSubject(subject) {
        this.state.subjects.push(subject);
        this.updateStatistics();
    }

    updateSubject(updatedSubject) {
        const index = this.state.subjects.findIndex(s => s.id === updatedSubject.id);
        if (index !== -1) {
            this.state.subjects[index] = updatedSubject;
        }
    }

    removeSubject(subjectId) {
        this.state.subjects = this.state.subjects.filter(s => s.id !== subjectId);
        if (this.state.selectedSubject?.id === subjectId) {
            this.clearSelection();
        }
        this.updateStatistics();
    }

    setTopics(topics) {
        this.state.topics = topics;
        this.updateStatistics();
    }

    addTopic(topic) {
        this.state.topics.push(topic);
        this.updateStatistics();
    }

    updateTopic(updatedTopic) {
        const index = this.state.topics.findIndex(t => t.id === updatedTopic.id);
        if (index !== -1) {
            this.state.topics[index] = updatedTopic;
        }
    }

    removeTopic(topicId) {
        this.state.topics = this.state.topics.filter(t => t.id !== topicId);
        if (this.state.selectedTopic?.id === topicId) {
            this.state.selectedTopic = null;
        }
        this.updateStatistics();
    }

    setQuestions(questions) {
        this.state.questions = questions;
        console.log('Store: Questions set to:', questions);
        this.updateStatistics();
    }

    setNotes(notes) {
        this.state.notes = notes;
    }

    // ===== PRACTICE ACTIONS =====
    
    startPractice(questions) {
        console.log('Store: Starting practice with questions:', questions);
        this.state.questions = questions;
        this.state.practiceStarted = true;
        this.state.currentQuestionIndex = 0;
        this.state.userAnswer = '';
        this.state.showAnswer = false;
        console.log('Store: Practice state after start:', {
            practiceStarted: this.state.practiceStarted,
            questionCount: this.state.questions.length,
            currentIndex: this.state.currentQuestionIndex
        });
        this.updateStatistics();
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

    setUserAnswer(answer) {
        this.state.userAnswer = answer;
    }

    endPractice() {
        this.state.practiceStarted = false;
        const percentage = this.accuracyPercentage;
        this.showNotification(`Practice completed! Score: ${percentage}%`, 'success');
    }

    resetPracticeState() {
        this.state.currentQuestionIndex = 0;
        this.state.userAnswer = '';
        this.state.showAnswer = false;
        this.state.practiceStarted = false;
    }

    setPracticeConfig(config) {
        this.state.practiceConfig = { ...this.state.practiceConfig, ...config };
    }

    setGenerating(generating) {
        this.state.generating = generating;
    }

    // ===== UPLOAD ACTIONS =====
    
    setSelectedFile(file) {
        this.state.selectedFile = file;
    }

    setUploadProgress(progress) {
        this.state.uploadProgress = progress;
    }

    setUploading(uploading) {
        this.state.uploading = uploading;
    }

    setUploadResult(result) {
        this.state.uploadResult = result;
    }

    setDragOver(dragOver) {
        this.state.dragOver = dragOver;
    }

    clearUploadState() {
        this.state.selectedFile = null;
        this.state.uploadProgress = 0;
        this.state.uploading = false;
        this.state.uploadResult = null;
        this.state.dragOver = false;
    }

    // ===== MODAL ACTIONS =====
    
    showCreateSubjectModal() {
        this.state.showCreateSubjectModal = true;
        this.state.newSubject = { name: '', description: '' };
    }

    hideCreateSubjectModal() {
        this.state.showCreateSubjectModal = false;
        this.state.newSubject = { name: '', description: '' };
    }

    showCreateTopicModal() {
        this.state.showCreateTopicModal = true;
        this.state.newTopic = { name: '', description: '' };
    }

    hideCreateTopicModal() {
        this.state.showCreateTopicModal = false;
        this.state.newTopic = { name: '', description: '' };
    }

    setNewSubject(subject) {
        this.state.newSubject = { ...this.state.newSubject, ...subject };
    }

    setNewTopic(topic) {
        this.state.newTopic = { ...this.state.newTopic, ...topic };
    }

    // ===== NOTIFICATION ACTIONS =====
    
    showNotification(message, type = 'info', duration = 4000) {
        const id = Date.now() + Math.random();
        const notification = { id, message, type, timestamp: Date.now() };
        
        this.state.notifications.push(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(id);
        }, duration);
        
        return id;
    }

    removeNotification(id) {
        this.state.notifications = this.state.notifications.filter(n => n.id !== id);
    }

    clearNotifications() {
        this.state.notifications = [];
    }

    // ===== AI ACTIONS =====
    
    setAiOnline(online) {
        this.state.aiOnline = online;
    }

    setAvailableModels(models) {
        this.state.availableModels = models;
    }

    // ===== STATISTICS =====
    
    updateStatistics() {
        this.state.statistics = {
            totalSubjects: this.state.subjects.length,
            totalTopics: this.state.topics.length,
            totalQuestions: this.state.questions.length,
            totalAnswered: this.state.score.total,
            accuracyRate: this.accuracyPercentage
        };
    }

    setStatistics(stats) {
        this.state.statistics = { ...this.state.statistics, ...stats };
    }

    // ===== PERSISTENCE =====
    
    setupPersistence() {
        // Watch for changes and persist to localStorage
        Vue.watchEffect(() => {
            const stateToSave = {
                subjects: this.state.subjects,
                selectedSubject: this.state.selectedSubject,
                selectedTopic: this.state.selectedTopic,
                score: this.state.score,
                statistics: this.state.statistics,
                practiceConfig: this.state.practiceConfig,
                sidebarOpen: this.state.sidebarOpen,
                currentView: this.state.currentView
            };
            
            try {
                localStorage.setItem('studyai_state', JSON.stringify(stateToSave));
            } catch (error) {
                console.warn('Failed to persist state:', error);
            }
        });
    }

    loadPersistedState() {
        try {
            const saved = localStorage.getItem('studyai_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                
                // Restore persisted state
                if (parsed.subjects) this.state.subjects = parsed.subjects;
                if (parsed.selectedSubject) this.state.selectedSubject = parsed.selectedSubject;
                if (parsed.selectedTopic) this.state.selectedTopic = parsed.selectedTopic;
                if (parsed.score) this.state.score = parsed.score;
                if (parsed.statistics) this.state.statistics = parsed.statistics;
                if (parsed.practiceConfig) this.state.practiceConfig = parsed.practiceConfig;
                if (typeof parsed.sidebarOpen === 'boolean') this.state.sidebarOpen = parsed.sidebarOpen;
                if (parsed.currentView) this.state.currentView = parsed.currentView;
                
                this.updateStatistics();
            }
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
        }
    }

    clearPersistedState() {
        try {
            localStorage.removeItem('studyai_state');
        } catch (error) {
            console.warn('Failed to clear persisted state:', error);
        }
    }

    // ===== UTILITY METHODS =====
    
    resetState() {
        this.state.subjects = [];
        this.state.topics = [];
        this.state.questions = [];
        this.state.notes = [];
        this.clearSelection();
        this.resetPracticeState();
        this.clearUploadState();
        this.state.score = { correct: 0, total: 0 };
        this.updateStatistics();
        this.clearPersistedState();
    }

    exportData() {
        return {
            subjects: this.state.subjects,
            topics: this.state.topics,
            questions: this.state.questions,
            notes: this.state.notes,
            statistics: this.state.statistics,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    importData(data) {
        try {
            if (data.subjects) this.setSubjects(data.subjects);
            if (data.topics) this.setTopics(data.topics);
            if (data.questions) this.setQuestions(data.questions);
            if (data.notes) this.setNotes(data.notes);
            if (data.statistics) this.setStatistics(data.statistics);
            
            this.showNotification('Data imported successfully', 'success');
            return true;
        } catch (error) {
            this.showNotification('Failed to import data', 'error');
            return false;
        }
    }

    // ===== DEBUG METHODS =====
    
    getState() {
        return this.state;
    }

    debugState() {
        console.group('StudyAI State Debug');
        console.log('Current View:', this.state.currentView);
        console.log('Subjects:', this.state.subjects.length);
        console.log('Topics:', this.state.topics.length);
        console.log('Questions:', this.state.questions.length);
        console.log('Selected Subject:', this.state.selectedSubject?.name);
        console.log('Selected Topic:', this.state.selectedTopic?.name);
        console.log('Practice Started:', this.state.practiceStarted);
        console.log('Score:', this.state.score);
        console.log('Statistics:', this.state.statistics);
        console.groupEnd();
    }
}

// Create global store instance
window.store = new Store();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Store;
}