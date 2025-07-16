// components/Layout/Sidebar.js

window.SidebarComponent = {
    template: `
    <div :class="['transition-all duration-300', store.state.sidebarOpen ? 'w-64' : 'w-16']" class="sidebar-blur">
        <div class="p-4">
            <!-- Logo -->
            <div class="flex items-center space-x-3 mb-8">
                <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    AI
                </div>
                <div v-if="store.state.sidebarOpen" class="animate-fade-in">
                    <h1 class="text-xl font-bold text-white">StudyAI</h1>
                    <p class="text-xs text-white/70">Intelligent Learning</p>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="space-y-2">
                <button
                    @click="store.setCurrentView('dashboard')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl nav-pill text-white/90 hover:text-white', 
                        store.state.currentView === 'dashboard' ? 'active' : ''
                    ]"
                >
                    <i class="fas fa-chart-line w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in">Dashboard</span>
                </button>
                
                <button
                    @click="store.setCurrentView('subjects')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl nav-pill text-white/90 hover:text-white',
                        store.state.currentView === 'subjects' ? 'active' : ''
                    ]"
                >
                    <i class="fas fa-book w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in">Subjects</span>
                </button>
                
                <button
                    @click="store.setCurrentView('upload')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl nav-pill text-white/90 hover:text-white',
                        store.state.currentView === 'upload' ? 'active' : ''
                    ]"
                >
                    <i class="fas fa-upload w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in">Upload</span>
                </button>
                
                <button
                    @click="store.setCurrentView('practice')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl nav-pill text-white/90 hover:text-white',
                        store.state.currentView === 'practice' ? 'active' : ''
                    ]"
                >
                    <i class="fas fa-brain w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in">Practice</span>
                </button>
            </nav>

            <!-- Statistics (when sidebar is open) -->
            <div v-if="store.state.sidebarOpen && store.hasData" class="mt-8 pt-4 border-t border-white/20">
                <div class="text-white/70 text-xs font-medium mb-3">Quick Stats</div>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-white/60">Subjects</span>
                        <span class="text-white font-medium">{{ store.state.statistics.totalSubjects }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-white/60">Questions</span>
                        <span class="text-white font-medium">{{ store.state.statistics.totalAnswered }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-white/60">Accuracy</span>
                        <span class="text-white font-medium">{{ store.accuracyPercentage }}%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sidebar Toggle -->
        <button
            @click="store.toggleSidebar()"
            class="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
        >
            <i :class="store.state.sidebarOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right'" class="text-xs"></i>
        </button>
    </div>
    `,
    
    setup() {
        return {
            store: window.store
        };
    }
};