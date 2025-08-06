// src/frontend/components/Modals/ConfirmationModal.js - Professional Confirmation Dialog
window.ConfirmationModal = {
    template: `
        <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" @click="handleBackdropClick">
            <!-- Backdrop -->
            <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"></div>
            
            <!-- Modal Container -->
            <div class="flex min-h-full items-center justify-center p-4">
                <div 
                    class="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-auto transform transition-all duration-300"
                    @click.stop
                >
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-gray-200">
                        <div class="flex items-center">
                            <!-- Icon based on type -->
                            <div class="flex-shrink-0 mr-3">
                                <div v-if="type === 'danger'" class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-exclamation-triangle text-red-600"></i>
                                </div>
                                <div v-else-if="type === 'warning'" class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-exclamation-circle text-yellow-600"></i>
                                </div>
                                <div v-else class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-question-circle text-blue-600"></i>
                                </div>
                            </div>
                            
                            <!-- Title -->
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-gray-900">
                                    {{ title }}
                                </h3>
                            </div>
                            
                            <!-- Close button -->
                            <button 
                                @click="handleCancel"
                                class="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Content -->
                    <div class="px-6 py-4">
                        <p class="text-gray-600 leading-relaxed">
                            {{ message }}
                        </p>
                        
                        <!-- Additional details -->
                        <div v-if="details" class="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p class="text-sm text-gray-700">
                                {{ details }}
                            </p>
                        </div>
                        
                        <!-- Item count for bulk actions -->
                        <div v-if="itemCount > 0" class="mt-3 flex items-center text-sm text-gray-600">
                            <i class="fas fa-info-circle mr-2"></i>
                            <span>{{ itemCount }} item{{ itemCount > 1 ? 's' : '' }} will be affected</span>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                        <!-- Cancel Button -->
                        <button
                            @click="handleCancel"
                            :disabled="loading"
                            class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {{ cancelText }}
                        </button>
                        
                        <!-- Confirm Button -->
                        <button
                            @click="handleConfirm"
                            :disabled="loading"
                            :class="[
                                'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                                type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                                'bg-blue-600 hover:bg-blue-700 text-white'
                            ]"
                        >
                            <i v-if="loading" class="fas fa-spinner fa-spin mr-2"></i>
                            <i v-else-if="confirmIcon" :class="confirmIcon + ' mr-2'"></i>
                            {{ loading ? 'Processing...' : confirmText }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    props: {
        show: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: 'Confirm Action'
        },
        message: {
            type: String,
            default: 'Are you sure you want to continue?'
        },
        details: {
            type: String,
            default: null
        },
        type: {
            type: String,
            default: 'info', // 'info', 'warning', 'danger'
            validator: value => ['info', 'warning', 'danger'].includes(value)
        },
        confirmText: {
            type: String,
            default: 'Confirm'
        },
        cancelText: {
            type: String,
            default: 'Cancel'
        },
        confirmIcon: {
            type: String,
            default: null
        },
        itemCount: {
            type: Number,
            default: 0
        },
        loading: {
            type: Boolean,
            default: false
        },
        preventBackdropClose: {
            type: Boolean,
            default: false
        }
    },
    
    setup(props, { emit }) {
        const handleConfirm = () => {
            if (!props.loading) {
                emit('confirm');
            }
        };
        
        const handleCancel = () => {
            if (!props.loading) {
                emit('cancel');
            }
        };
        
        const handleBackdropClick = () => {
            if (!props.preventBackdropClose && !props.loading) {
                handleCancel();
            }
        };
        
        // Handle escape key
        const handleKeyDown = (event) => {
            if (props.show && event.key === 'Escape' && !props.loading) {
                handleCancel();
            }
        };
        
        Vue.onMounted(() => {
            document.addEventListener('keydown', handleKeyDown);
        });
        
        Vue.onUnmounted(() => {
            document.removeEventListener('keydown', handleKeyDown);
        });
        
        return {
            handleConfirm,
            handleCancel,
            handleBackdropClick
        };
    }
};