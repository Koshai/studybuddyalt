// src/frontend/components/Modals/ModalBase.js
window.ModalBase = {
    props: {
        title: String,
        show: {
            type: Boolean,
            default: false
        },
        maxWidth: {
            type: String,
            default: 'max-w-md'
        }
    },
    
    template: `
    <Transition name="modal" appear>
        <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div 
                :class="['bg-white rounded-2xl p-8 w-full animate-scale-in', maxWidth]"
                @click.stop
            >
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-semibold text-gray-900">{{ title }}</h3>
                    <button
                        @click="$emit('close')"
                        class="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="modal-content">
                    <slot></slot>
                </div>
            </div>
        </div>
    </Transition>
    `,
    
    setup() {
        // Close modal on escape key
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                event.emit('close');
            }
        };

        Vue.onMounted(() => {
            document.addEventListener('keydown', handleEscape);
        });

        Vue.onUnmounted(() => {
            document.removeEventListener('keydown', handleEscape);
        });

        return {};
    },
    
    emits: ['close']
};