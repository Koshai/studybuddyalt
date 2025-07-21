// components/Layout/Sidebar.js - FIXED VERSION with proper contrast

window.SidebarComponent = {
    template: `
    <div :class="['transition-all duration-300 bg-gray-900', store.state.sidebarOpen ? 'w-64' : 'w-16']" class="h-full border-r border-gray-700">
        <div class="p-4">
            <!-- Logo -->
            <div class="flex items-center space-x-3 mb-8">
                <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    AI
                </div>
                <div v-if="store.state.sidebarOpen" class="animate-fade-in">
                    <h1 class="text-xl font-bold text-white">StudyAI</h1>
                    <p class="text-xs text-gray-300">Intelligent Learning</p>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="space-y-2">
                <button
                    @click="store.setCurrentView('dashboard')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                        store.state.currentView === 'dashboard' 
                            ? 'bg-primary-600 text-white shadow-lg' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    ]"
                >
                    <i class="fas fa-chart-line w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in font-medium">Dashboard</span>
                </button>
                
                <button
                    @click="store.setCurrentView('subjects')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                        store.state.currentView === 'subjects' 
                            ? 'bg-primary-600 text-white shadow-lg' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    ]"
                >
                    <i class="fas fa-book w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in font-medium">Subjects</span>
                </button>
                
                <button
                    @click="store.setCurrentView('upload')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                        store.state.currentView === 'upload' 
                            ? 'bg-primary-600 text-white shadow-lg' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    ]"
                >
                    <i class="fas fa-upload w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in font-medium">Upload</span>
                </button>
                
                <button
                    @click="store.setCurrentView('practice')"
                    :class="[
                        'w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                        store.state.currentView === 'practice' 
                            ? 'bg-primary-600 text-white shadow-lg' 
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    ]"
                >
                    <i class="fas fa-brain w-5"></i>
                    <span v-if="store.state.sidebarOpen" class="animate-fade-in font-medium">Practice</span>
                </button>
            </nav>

            <!-- Statistics (when sidebar is open) -->
            <div v-if="store.state.sidebarOpen && store.hasData" class="mt-8 pt-4 border-t border-gray-700">
                <div class="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wide">Quick Stats</div>
                <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Subjects</span>
                        <span class="text-white font-medium">{{ store.state.statistics.totalSubjects }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Questions</span>
                        <span class="text-white font-medium">{{ store.state.statistics.totalAnswered }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Accuracy</span>
                        <span class="text-accent-400 font-bold">{{ store.accuracyPercentage }}%</span>
                    </div>
                </div>
            </div>

            <!-- User Profile Section (when sidebar is open) -->
            <div v-if="store.state.sidebarOpen" class="absolute bottom-4 left-4 right-4">
                <div class="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            U
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-white truncate">User</p>
                            <p class="text-xs text-gray-400">Learning Mode</p>
                        </div>
                        <div class="flex items-center">
                            <div :class="[
                                'w-2 h-2 rounded-full',
                                store.state.aiOnline ? 'bg-green-400' : 'bg-red-400'
                            ]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sidebar Toggle -->
        <button
            @click="store.toggleSidebar()"
            class="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-xl transition-all duration-200 border border-gray-200"
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