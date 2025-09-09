// components/Feedback/FeedbackModal.js - Feedback Form Modal
window.FeedbackModal = {
    template: `
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click="handleBackdropClick">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Background overlay -->
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <!-- This element is to trick the browser into centering the modal contents -->
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
            
            <!-- Modal panel -->
            <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6" @click.stop>
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">
                        <i class="fas fa-comment text-blue-500 mr-2"></i>
                        Send Feedback
                    </h3>
                    <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Form -->
                <form @submit.prevent="submitFeedback" class="space-y-4">
                    <!-- Feedback Type -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Feedback Type
                        </label>
                        <select v-model="feedbackData.type" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required>
                            <option value="">Select type...</option>
                            <option value="bug">🐛 Bug Report</option>
                            <option value="feature">✨ Feature Request</option>
                            <option value="improvement">🚀 Improvement Suggestion</option>
                            <option value="general">💬 General Feedback</option>
                            <option value="other">📝 Other</option>
                        </select>
                    </div>
                    
                    <!-- Subject -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Subject
                        </label>
                        <input v-model="feedbackData.subject" 
                               type="text" 
                               placeholder="Brief description of your feedback..."
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                               required>
                    </div>
                    
                    <!-- Message -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Message
                        </label>
                        <textarea v-model="feedbackData.message" 
                                  rows="4" 
                                  placeholder="Please provide detailed feedback..."
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                  required></textarea>
                    </div>
                    
                    <!-- Email (optional) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Your Email (optional)
                        </label>
                        <input v-model="feedbackData.email" 
                               type="email" 
                               placeholder="your.email@example.com"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                        <p class="text-xs text-gray-500 mt-1">
                            Leave this empty to send anonymously
                        </p>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t border-gray-200">
                        <button type="button" 
                                @click="closeModal" 
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" 
                                :disabled="isSubmitting"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <i v-if="isSubmitting" class="fas fa-spinner fa-spin mr-2"></i>
                            <i v-else class="fas fa-paper-plane mr-2"></i>
                            {{ isSubmitting ? 'Sending...' : 'Send Feedback' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `,

    props: {
        isOpen: {
            type: Boolean,
            default: false
        }
    },

    emits: ['close'],

    setup(props, { emit }) {
        const store = window.store;
        
        const feedbackData = Vue.ref({
            type: '',
            subject: '',
            message: '',
            email: ''
        });
        
        const isSubmitting = Vue.ref(false);
        
        const closeModal = () => {
            emit('close');
            // Reset form when closed
            feedbackData.value = {
                type: '',
                subject: '',
                message: '',
                email: ''
            };
        };
        
        const handleBackdropClick = (event) => {
            if (event.target === event.currentTarget) {
                closeModal();
            }
        };
        
        const submitFeedback = async () => {
            if (isSubmitting.value) return;
            
            try {
                isSubmitting.value = true;
                
                const response = await window.api.submitFeedback(feedbackData.value);
                
                store.showNotification('Thank you for your feedback! We appreciate your input.', 'success');
                closeModal();
                
            } catch (error) {
                console.error('Error submitting feedback:', error);
                store.showNotification('Failed to send feedback. Please try again later.', 'error');
            } finally {
                isSubmitting.value = false;
            }
        };
        
        return {
            feedbackData,
            isSubmitting,
            closeModal,
            handleBackdropClick,
            submitFeedback
        };
    }
};