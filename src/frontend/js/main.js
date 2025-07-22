// js/main.js - Main Vue Application - UPDATED with MCQ Component

const { createApp } = Vue;

// Main App Component
const App = {
    template: `
    <div class="flex h-screen bg-gray-50">
        <!-- Sidebar -->
        <SidebarComponent />

        <!-- Main Content -->
        <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <HeaderComponent />

            <!-- Content Area -->
            <main class="flex-1 overflow-auto p-6">
                <!-- Dashboard View -->
                <DashboardComponent v-if="store.state.currentView === 'dashboard'" />
                
                <!-- Subjects View -->
                <SubjectsListComponent v-if="store.state.currentView === 'subjects' && !store.state.selectedSubject" />
                
                <!-- Topics View -->
                <TopicsListComponent v-if="store.state.currentView === 'subjects' && store.state.selectedSubject" />
                
                <!-- Upload View -->
                <UploadFormComponent v-if="store.state.currentView === 'upload'" />
                
                <!-- Practice View -->
                <PracticeSetupComponent v-if="store.state.currentView === 'practice'" />
            </main>
        </div>

        <!-- Modals -->
        <CreateSubjectModal v-if="store.state.showCreateSubjectModal" />
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
                
                // Check AI service health
                try {
                    await window.api.checkHealth();
                    store.setAiOnline(true);
                } catch (error) {
                    console.warn('AI service not available:', error);
                    store.setAiOnline(false);
                }

                // Load subjects if not already loaded
                if (store.state.subjects.length === 0) {
                    const subjects = await window.api.getSubjects();
                    store.setSubjects(subjects);
                }

                // Load topics for selected subject
                if (store.state.selectedSubject) {
                    const topics = await window.api.getTopics(store.state.selectedSubject.id);
                    store.setTopics(topics);
                }

                // Load available AI models
                if (store.state.aiOnline) {
                    try {
                        const models = await window.api.getModels();
                        store.setAvailableModels(models);
                    } catch (error) {
                        console.warn('Could not load AI models:', error);
                    }
                }

            } catch (error) {
                console.error('Failed to initialize app:', error);
                store.showNotification('Failed to initialize application', 'error');
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
            store.showNotification('Working offline', 'warning');
        });

        return {
            store
        };
    }
};

// Register all components
const app = createApp(App);

// Register components globally
app.component('SidebarComponent', window.SidebarComponent);
app.component('HeaderComponent', window.HeaderComponent);
app.component('NotificationsComponent', window.NotificationsComponent);
app.component('DashboardComponent', window.DashboardComponent);
app.component('SubjectsListComponent', window.SubjectsListComponent);
app.component('TopicsListComponent', window.TopicsListComponent);
app.component('UploadFormComponent', window.UploadFormComponent);
app.component('PracticeSetupComponent', window.PracticeSetupComponent);
app.component('CreateSubjectModal', window.CreateSubjectModal);
app.component('CreateTopicModal', window.CreateTopicModal);

// Register practice-related components - UPDATED
app.component('MCQQuestionCard', window.MCQQuestionCard);

// Register other utility components
app.component('SubjectCard', window.SubjectCard);
app.component('TopicCard', window.TopicCard);
app.component('FileDropzone', window.FileDropzone);
app.component('NotesDisplayComponent', window.NotesDisplayComponent);

// Global properties
app.config.globalProperties.$store = window.store;
app.config.globalProperties.$api = window.api;

// Mount the app
app.mount('#app');

// Global keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + K - Quick search (future feature)
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // TODO: Implement quick search
        console.log('Quick search shortcut');
    }
    
    // Ctrl/Cmd + N - New subject
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        window.store.showCreateSubjectModal();
    }
    
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
    
    // Escape - Close modals
    if (event.key === 'Escape') {
        if (window.store.state.showCreateSubjectModal) {
            window.store.hideCreateSubjectModal();
        }
        if (window.store.state.showCreateTopicModal) {
            window.store.hideCreateTopicModal();
        }
    }
});

// Global utilities available in console for debugging
window.studyAI = {
    store: window.store,
    api: window.api,
    debug: () => window.store.debugState(),
    reset: () => window.store.resetState(),
    export: () => window.store.exportData(),
    version: '1.0.0'
};

console.log('🧠 StudyAI loaded successfully!');
console.log('Access global utilities with: window.studyAI');