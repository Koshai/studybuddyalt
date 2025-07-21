// components/Layout/Header.js - FIXED VERSION with proper contrast

window.HeaderComponent = {
    template: `
    <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-semibold text-gray-900">
                    {{ pageTitle }}
                </h2>
                <p class="text-sm text-gray-600 mt-1">
                    {{ pageDescription }}
                </p>
            </div>
            
            <div class="flex items-center space-x-4">
                <!-- AI Status -->
                <div class="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg border">
                    <div :class="[
                        'w-2 h-2 rounded-full',
                        store.state.aiOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    ]"></div>
                    <span :class="[
                        'text-sm font-medium',
                        store.state.aiOnline ? 'text-green-700' : 'text-red-600'
                    ]">
                        {{ store.state.aiOnline ? 'AI Online' : 'AI Offline' }}
                    </span>
                </div>

                <!-- Loading Indicator -->
                <div v-if="store.state.loading || store.state.generating" class="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span class="text-sm font-medium text-blue-700">
                        {{ store.state.generating ? 'Generating...' : 'Loading...' }}
                    </span>
                </div>
                
                <!-- User Menu -->
                <div class="relative group">
                    <button class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium hover:shadow-lg transition-shadow border-2 border-white shadow-sm">
                        <i class="fas fa-user text-sm"></i>
                    </button>
                    
                    <!-- Dropdown Menu -->
                    <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div class="p-2">
                            <button @click="exportData" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center">
                                <i class="fas fa-download mr-3 text-gray-500 w-4"></i>Export Data
                            </button>
                            <button @click="showImportDialog" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center">
                                <i class="fas fa-upload mr-3 text-gray-500 w-4"></i>Import Data
                            </button>
                            <hr class="my-2 border-gray-200">
                            <button @click="resetData" class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center">
                                <i class="fas fa-trash mr-3 text-red-500 w-4"></i>Reset Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Breadcrumb Navigation -->
        <div v-if="breadcrumbs.length > 0" class="flex items-center space-x-2 mt-4 text-sm bg-gray-50 px-4 py-2 rounded-lg">
            <i class="fas fa-home text-gray-400 text-xs"></i>
            <template v-for="(crumb, index) in breadcrumbs" :key="index">
                <button
                    @click="navigateTo(crumb)"
                    :class="[
                        'flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-200 transition-colors',
                        index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium bg-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                    ]"
                >
                    <i v-if="crumb.icon" :class="crumb.icon" class="text-xs"></i>
                    <span>{{ crumb.label }}</span>
                </button>
                <i v-if="index < breadcrumbs.length - 1" class="fas fa-chevron-right text-gray-400 text-xs"></i>
            </template>
        </div>
    </header>
    `,
    
    setup() {
        const store = window.store;

        const pageInfo = Vue.computed(() => {
            switch (store.state.currentView) {
                case 'dashboard':
                    return {
                        title: 'Dashboard',
                        description: 'Overview of your learning progress'
                    };
                case 'subjects':
                    if (store.state.selectedSubject) {
                        return {
                            title: store.state.selectedSubject.name,
                            description: store.state.selectedSubject.description || 'Manage topics for this subject'
                        };
                    }
                    return {
                        title: 'My Subjects',
                        description: 'Organize your learning by subjects and topics'
                    };
                case 'upload':
                    return {
                        title: 'Upload Materials',
                        description: 'Add new study materials and documents'
                    };
                case 'practice':
                    if (store.state.selectedTopic) {
                        return {
                            title: `Practice: ${store.state.selectedTopic.name}`,
                            description: 'Test your knowledge with AI-generated questions'
                        };
                    }
                    return {
                        title: 'Practice Session',
                        description: 'Test your knowledge with AI-generated questions'
                    };
                default:
                    return {
                        title: 'StudyAI',
                        description: 'Intelligent Learning Platform'
                    };
            }
        });

        const breadcrumbs = Vue.computed(() => {
            const crumbs = [];
            
            if (store.state.currentView !== 'dashboard') {
                crumbs.push({
                    label: 'Dashboard',
                    icon: 'fas fa-home',
                    action: () => store.setCurrentView('dashboard')
                });
            }
            
            if (store.state.selectedSubject && store.state.currentView === 'subjects') {
                crumbs.push({
                    label: 'Subjects',
                    icon: 'fas fa-book',
                    action: () => {
                        store.clearSelection();
                        store.setCurrentView('subjects');
                    }
                });
                crumbs.push({
                    label: store.state.selectedSubject.name,
                    action: null // Current page
                });
            }
            
            if (store.state.selectedTopic && store.state.currentView === 'practice') {
                crumbs.push({
                    label: 'Subjects',
                    icon: 'fas fa-book',
                    action: () => {
                        store.clearSelection();
                        store.setCurrentView('subjects');
                    }
                });
                if (store.state.selectedSubject) {
                    crumbs.push({
                        label: store.state.selectedSubject.name,
                        action: () => {
                            store.state.selectedTopic = null;
                            store.setCurrentView('subjects');
                        }
                    });
                }
                crumbs.push({
                    label: store.state.selectedTopic.name,
                    action: null // Current page
                });
            }
            
            return crumbs;
        });

        const navigateTo = (crumb) => {
            if (crumb.action) {
                crumb.action();
            }
        };

        const exportData = () => {
            try {
                const data = store.exportData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { 
                    type: 'application/json' 
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `studyai-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                store.showNotification('Data exported successfully', 'success');
            } catch (error) {
                store.showNotification('Failed to export data', 'error');
            }
        };

        const showImportDialog = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const data = JSON.parse(e.target.result);
                            if (store.importData(data)) {
                                // Refresh current view
                                const currentView = store.state.currentView;
                                store.setCurrentView('dashboard');
                                Vue.nextTick(() => {
                                    store.setCurrentView(currentView);
                                });
                            }
                        } catch (error) {
                            store.showNotification('Invalid file format', 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        };

        const resetData = () => {
            if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
                store.resetState();
                store.showNotification('All data has been reset', 'success');
            }
        };

        return {
            store,
            pageTitle: Vue.computed(() => pageInfo.value.title),
            pageDescription: Vue.computed(() => pageInfo.value.description),
            breadcrumbs,
            navigateTo,
            exportData,
            showImportDialog,
            resetData
        };
    }
};