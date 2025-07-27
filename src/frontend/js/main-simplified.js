// js/main-simplified.js - Main Vue Application with Simplified Components

const { createApp } = Vue;

// Main App Component
const App = {
    template: `
    <div class="flex h-screen bg-gray-50">
        <!-- Sidebar -->
        <SidebarSimplifiedComponent />

        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <HeaderSimplifiedComponent />

            <!-- Content Area -->
            <main class="flex-1 overflow-auto p-6">
                <!-- Dashboard View -->
                <DashboardSimplifiedComponent v-if="store.state.currentView === 'dashboard'" />
                
                <!-- Subjects List View (Fixed Subjects) -->
                <FixedSubjectsListComponent v-if="store.state.currentView === 'subjects' && !store.state.selectedSubject" />
                
                <!-- Topics View (When Subject Selected) -->
                <TopicsListSimplifiedComponent v-if="store.state.currentView === 'subjects' && store.state.selectedSubject" />
                
                <!-- Topics View (Alternative Route) -->
                <TopicsListSimplifiedComponent v-if="store.state.currentView === 'topics'" />
                
                <!-- Upload View -->
                <UploadFormSimplifiedComponent v-if="store.state.currentView === 'upload'" />
                
                <!-- Practice View -->
                <PracticeSetupSimplifiedComponent v-if="store.state.currentView === 'practice'" />
            </main>
        </div>

        <!-- Modals (Only Topic Creation - No Subject Creation) -->
        <CreateTopicModal v-if="store.state.showCreateTopicModal" />

        <!-- Notifications -->
        <NotificationsComponent />
    </div>
    `,

    setup() {
        const store = window.store;

        // Initialize app
        Vue.onMounted(async () => {
            await initializeApp();
        });

        const initializeApp = async () => {
            try {
                store.setLoading(true);
                console.log('🚀 Initializing StudyAI Simplified...');
                
                // Check AI service health
                try {
                    await window.api.checkHealth();
                    store.setAiOnline(true);
                    console.log('✅ AI service is online');
                } catch (error) {
                    console.warn('⚠️ AI service not available:', error);
                    store.setAiOnline(false);
                }

                // Set fixed subjects in store (no API call needed)
                if (store.state.subjects.length === 0) {
                    console.log('📚 Loading fixed subjects...');
                    const subjects = await window.api.getSubjects();
                    store.state.subjects = subjects;
                    console.log(`✅ Loaded ${subjects.length} fixed subjects`);
                }

                // Load topics for selected subject if any
                if (store.state.selectedSubject) {
                    console.log('📂 Loading topics for selected subject...');
                    const topics = await window.api.getTopics(store.state.selectedSubject.id);
                    store.state.topics = topics;
                    console.log(`✅ Loaded ${topics.length} topics`);
                }

                // Load dashboard statistics
                try {
                    const stats = await window.api.getDashboardStats();
                    store.state.statistics = {
                        totalTopics: stats.total_topics || 0,
                        totalQuestions: stats.total_questions || 0,
                        totalNotes: stats.total_notes || 0,
                        overallAccuracy: stats.overall_accuracy || 0
                    };
                    console.log('📊 Dashboard stats loaded:', store.state.statistics);
                } catch (error) {
                    console.warn('⚠️ Failed to load dashboard stats:', error);
                }

                // Load available AI models if online
                if (store.state.aiOnline) {
                    try {
                        const models = await window.api.getModels();
                        console.log(`🤖 Available AI models: ${models.map(m => m.name).join(', ')}`);
                    } catch (error) {
                        console.warn('⚠️ Could not load AI models:', error);
                    }
                }

                console.log('✅ StudyAI Simplified initialized successfully!');

            } catch (error) {
                console.error('❌ Failed to initialize app:', error);
                store.showNotification('Failed to initialize application: ' + error.message, 'error');
            } finally {
                store.setLoading(false);
            }
        };

        // Global error handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            store.showNotification('An unexpected error occurred', 'error');
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            store.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            store.showNotification('Working offline - some features may be limited', 'warning');
        });

        return {
            store
        };
    }
};

// Register all simplified components
const app = createApp(App);

// Layout components (simplified)
app.component('SidebarSimplifiedComponent', window.SidebarSimplifiedComponent);
app.component('HeaderSimplifiedComponent', window.HeaderSimplifiedComponent);
app.component('NotificationsComponent', window.NotificationsComponent);

// Main page components (simplified)
app.component('DashboardSimplifiedComponent', window.SimplifiedDashboardComponent);
app.component('FixedSubjectsListComponent', window.FixedSubjectsListComponent);
app.component('TopicsListSimplifiedComponent', window.TopicsListSimplifiedComponent);
app.component('UploadFormSimplifiedComponent', window.UploadFormSimplifiedComponent);
app.component('PracticeSetupSimplifiedComponent', window.PracticeSetupSimplifiedComponent);

// Practice components (reuse existing)
app.component('MCQQuestionCard', window.MCQQuestionCard);

// Modal components (only topic creation)
app.component('CreateTopicModal', window.CreateTopicModal);

// Utility components (reuse existing)
app.component('FileDropzone', window.FileDropzone);

// Global properties
app.config.globalProperties.$store = window.store;
app.config.globalProperties.$api = window.api;

// Mount the app
app.mount('#app');

// Global keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + U - Upload
    if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
        event.preventDefault();
        window.store.setCurrentView('upload');
    }
    
    // Ctrl/Cmd + P - Practice
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        window.store.setCurrentView('practice');
    }
    
    // Ctrl/Cmd + H - Home/Dashboard
    if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault();
        window.store.setCurrentView('dashboard');
    }
    
    // Ctrl/Cmd + S - Subjects
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        window.store.setCurrentView('subjects');
    }
    
    // Ctrl/Cmd + T - Add Topic (only if subject selected)
    if ((event.ctrlKey || event.metaKey) && event.key === 't' && window.store.state.selectedSubject) {
        event.preventDefault();
        window.store.showCreateTopicModal();
    }
    
    // Escape - Close modals
    if (event.key === 'Escape') {
        if (window.store.state.showCreateTopicModal) {
            window.store.hideCreateTopicModal();
        }
    }
    
    // Space - Start practice if possible
    if (event.key === ' ' && !event.target.matches('input, textarea') && window.store.state.selectedTopic) {
        event.preventDefault();
        window.store.setCurrentView('practice');
    }
});

// Global utilities available in console for debugging
window.studyAI = {
    store: window.store,
    api: window.api,
    debug: () => {
        console.group('📊 StudyAI Debug Information');
        console.log('Current View:', window.store.state.currentView);
        console.log('Selected Subject:', window.store.state.selectedSubject?.name);
        console.log('Selected Topic:', window.store.state.selectedTopic?.name);
        console.log('Fixed Subjects:', window.store.state.subjects.length);
        console.log('Topics:', window.store.state.topics.length);
        console.log('Questions:', window.store.state.questions.length);
        console.log('Practice Started:', window.store.state.practiceStarted);
        console.log('AI Online:', window.store.state.aiOnline);
        console.log('Statistics:', window.store.state.statistics);
        console.groupEnd();
    },
    reset: () => {
        if (confirm('Reset all application state?')) {
            window.store.resetState();
            console.log('✅ Application state reset');
        }
    },
    export: async () => {
        try {
            const data = await window.api.exportData();
            console.log('📤 Export data:', data);
            return data;
        } catch (error) {
            console.error('❌ Export failed:', error);
        }
    },
    testAI: async () => {
        try {
            const result = await window.api.checkHealth();
            console.log('🤖 AI Health:', result);
            return result;
        } catch (error) {
            console.error('❌ AI Health check failed:', error);
        }
    },
    version: '2.0-simplified',
    help: () => {
        console.log(`
🧠 StudyAI Simplified - Console Commands:

studyAI.debug()     - Show current application state
studyAI.reset()     - Reset all data (with confirmation)
studyAI.export()    - Export all data as JSON
studyAI.testAI()    - Test AI service connection
studyAI.help()      - Show this help

Keyboard Shortcuts:
Ctrl+H - Dashboard
Ctrl+S - Subjects  
Ctrl+U - Upload
Ctrl+P - Practice
Ctrl+T - Add Topic (if subject selected)
Space  - Start Practice (if topic selected)
Esc    - Close modals
        `);
    }
};

// Show initialization success message
console.log(`
🎓 StudyAI Simplified v2.0 loaded successfully!

Key Features:
✅ 10 Fixed Study Subjects (no user creation)
✅ Unlimited Topic Creation
✅ AI-Powered Question Generation  
✅ Multiple File Upload Support
✅ MCQ Practice Sessions
✅ Progress Tracking & Analytics

Type 'studyAI.help()' in console for commands
`);

// Auto-check AI status every 30 seconds
setInterval(async () => {
    try {
        await window.api.checkHealth();
        if (!window.store.state.aiOnline) {
            window.store.setAiOnline(true);
            window.store.showNotification('AI service is back online!', 'success');
        }
    } catch (error) {
        if (window.store.state.aiOnline) {
            window.store.setAiOnline(false);
            window.store.showNotification('AI service went offline', 'warning');
        }
    }
}, 30000);

console.log('🧠 StudyAI Simplified loaded successfully!');
console.log('📝 Use: studyAI.help() for available commands');