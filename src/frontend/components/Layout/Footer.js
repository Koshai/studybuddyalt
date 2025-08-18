// components/Layout/Footer.js - Clean Footer Component
window.FooterComponent = {
    template: `
    <footer class="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <!-- Left Side -->
            <div class="flex items-center space-x-4 text-sm text-gray-600">
                <span>&copy; 2024 Jaquizy</span>
                <span class="hidden sm:inline">•</span>
                <span class="text-xs sm:text-sm">AI-Powered Learning Platform</span>
            </div>
            
            <!-- Right Side -->
            <div class="flex items-center space-x-4 text-sm">
                <!-- Version -->
                <span class="text-xs text-gray-500">v1.0.0</span>
                
                <!-- Links -->
                <div class="flex items-center space-x-3">
                    <button @click="showHelp" class="text-gray-600 hover:text-gray-800 transition-colors">
                        <i class="fas fa-question-circle"></i>
                        <span class="ml-1 hidden sm:inline">Help</span>
                    </button>
                    
                    <button @click="showFeedback" class="text-gray-600 hover:text-gray-800 transition-colors">
                        <i class="fas fa-comment"></i>
                        <span class="ml-1 hidden sm:inline">Feedback</span>
                    </button>
                    
                    <!-- Online Status -->
                    <div class="flex items-center space-x-1">
                        <div :class="[
                            'w-2 h-2 rounded-full',
                            isOnline ? 'bg-green-500' : 'bg-red-500'
                        ]"></div>
                        <span class="text-xs text-gray-500">
                            {{ isOnline ? 'Online' : 'Offline' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Mobile Additional Info -->
        <div class="sm:hidden mt-2 pt-2 border-t border-gray-200 text-center">
            <p class="text-xs text-gray-500">
                Built with ❤️ for better learning
            </p>
        </div>
    </footer>
    `,

    setup() {
        const store = window.store;
        
        const isOnline = Vue.ref(navigator.onLine);
        
        // Listen for online/offline events
        Vue.onMounted(() => {
            const handleOnline = () => isOnline.value = true;
            const handleOffline = () => isOnline.value = false;
            
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            
            Vue.onUnmounted(() => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            });
        });

        const showHelp = () => {
            store.showNotification('Help documentation coming soon!', 'info');
        };

        const showFeedback = () => {
            store.showNotification('Feedback form coming soon! For now, please contact support.', 'info');
        };

        return {
            store,
            isOnline,
            showHelp,
            showFeedback
        };
    }
};