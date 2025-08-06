// src/frontend/components/States/ErrorState.js - Professional Error State Component
window.ErrorState = {
    template: `
        <div class="flex flex-col items-center justify-center p-8 text-center">
            <!-- Error Icon -->
            <div class="mb-6">
                <div :class="[
                    'w-16 h-16 rounded-full flex items-center justify-center mx-auto',
                    errorType === 'network' ? 'bg-orange-100 text-orange-600' :
                    errorType === 'server' ? 'bg-red-100 text-red-600' :
                    errorType === 'auth' ? 'bg-yellow-100 text-yellow-600' :
                    errorType === 'notfound' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                ]">
                    <i :class="getErrorIcon()" class="text-2xl"></i>
                </div>
            </div>
            
            <!-- Error Title -->
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
                {{ title }}
            </h3>
            
            <!-- Error Message -->
            <p class="text-gray-600 mb-6 max-w-md leading-relaxed">
                {{ message }}
            </p>
            
            <!-- Error Details (expandable) -->
            <div v-if="details || (showTechnicalDetails && error)" class="mb-6 w-full max-w-md">
                <button 
                    v-if="!showDetailsExpanded && (details || error)"
                    @click="showDetailsExpanded = true"
                    class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <i class="fas fa-chevron-down mr-1"></i>
                    Show details
                </button>
                
                <div v-if="showDetailsExpanded" class="mt-3 p-3 bg-gray-50 rounded-lg text-left">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-medium text-gray-700">Error Details</span>
                        <button 
                            @click="showDetailsExpanded = false"
                            class="text-gray-400 hover:text-gray-600"
                        >
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                    
                    <div class="text-sm text-gray-600 space-y-2">
                        <p v-if="details">{{ details }}</p>
                        <div v-if="showTechnicalDetails && error">
                            <p class="font-medium">Technical Error:</p>
                            <p class="font-mono text-xs bg-gray-100 p-2 rounded">{{ error.message || error }}</p>
                            <p v-if="error.status" class="text-xs mt-1">Status: {{ error.status }}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3">
                <!-- Retry Button -->
                <button
                    v-if="showRetry"
                    @click="handleRetry"
                    :disabled="retrying"
                    class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i v-if="retrying" class="fas fa-spinner fa-spin mr-2"></i>
                    <i v-else class="fas fa-redo mr-2"></i>
                    {{ retrying ? 'Retrying...' : 'Try Again' }}
                </button>
                
                <!-- Go Back Button -->
                <button
                    v-if="showGoBack"
                    @click="handleGoBack"
                    class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                    <i class="fas fa-arrow-left mr-2"></i>
                    Go Back
                </button>
                
                <!-- Home Button -->
                <button
                    v-if="showHome"
                    @click="handleGoHome"
                    class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                    <i class="fas fa-home mr-2"></i>
                    Home
                </button>
                
                <!-- Login Button (for auth errors) -->
                <button
                    v-if="errorType === 'auth'"
                    @click="handleLogin"
                    class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                    <i class="fas fa-sign-in-alt mr-2"></i>
                    Sign In
                </button>
                
                <!-- Contact Support Button -->
                <button
                    v-if="showSupport"
                    @click="handleContactSupport"
                    class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                    <i class="fas fa-life-ring mr-2"></i>
                    Contact Support
                </button>
            </div>
            
            <!-- Helpful Tips -->
            <div v-if="tips && tips.length > 0" class="mt-8 w-full max-w-md">
                <h4 class="text-sm font-medium text-gray-700 mb-3">
                    <i class="fas fa-lightbulb mr-2"></i>
                    Helpful Tips
                </h4>
                <ul class="text-sm text-gray-600 space-y-2 text-left">
                    <li v-for="tip in tips" :key="tip" class="flex items-start">
                        <i class="fas fa-check text-green-500 mr-2 mt-0.5 text-xs"></i>
                        <span>{{ tip }}</span>
                    </li>
                </ul>
            </div>
        </div>
    `,
    
    props: {
        errorType: {
            type: String,
            default: 'general', // 'network', 'server', 'auth', 'notfound', 'general'
            validator: value => ['network', 'server', 'auth', 'notfound', 'general'].includes(value)
        },
        title: {
            type: String,
            default: 'Something went wrong'
        },
        message: {
            type: String,
            default: 'An unexpected error occurred. Please try again.'
        },
        details: {
            type: String,
            default: null
        },
        error: {
            type: [String, Object, Error],
            default: null
        },
        showRetry: {
            type: Boolean,
            default: true
        },
        showGoBack: {
            type: Boolean,
            default: false
        },
        showHome: {
            type: Boolean,
            default: false
        },
        showSupport: {
            type: Boolean,
            default: false
        },
        showTechnicalDetails: {
            type: Boolean,
            default: false
        },
        retrying: {
            type: Boolean,
            default: false
        },
        tips: {
            type: Array,
            default: () => []
        }
    },
    
    setup(props, { emit }) {
        const showDetailsExpanded = Vue.ref(false);
        
        const getErrorIcon = () => {
            switch (props.errorType) {
                case 'network':
                    return 'fas fa-wifi';
                case 'server':
                    return 'fas fa-server';
                case 'auth':
                    return 'fas fa-lock';
                case 'notfound':
                    return 'fas fa-search';
                default:
                    return 'fas fa-exclamation-triangle';
            }
        };
        
        const handleRetry = () => {
            emit('retry');
        };
        
        const handleGoBack = () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                emit('go-home');
            }
        };
        
        const handleGoHome = () => {
            emit('go-home');
        };
        
        const handleLogin = () => {
            emit('login');
        };
        
        const handleContactSupport = () => {
            emit('contact-support');
        };
        
        return {
            showDetailsExpanded,
            getErrorIcon,
            handleRetry,
            handleGoBack,
            handleGoHome,
            handleLogin,
            handleContactSupport
        };
    }
};