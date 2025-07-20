// src/frontend/components/Subjects/TopicCard.js
window.TopicCard = {
    props: {
        topic: {
            type: Object,
            required: true
        }
    },
    
    template: `
    <div 
        @click="$emit('click', topic)"
        class="bg-white rounded-2xl p-6 hover-lift cursor-pointer group achievement-badge"
    >
        <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:shadow-lg transition-shadow">
                {{ topic.name.charAt(0).toUpperCase() }}
            </div>
            <div class="text-right">
                <div class="text-2xl font-bold text-secondary-600">{{ questionCount }}</div>
                <div class="text-xs text-gray-500">questions</div>
            </div>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-secondary-600 transition-colors">{{ topic.name }}</h3>
        <p class="text-gray-600 text-sm mb-4">{{ topic.description || 'Ready to dive in!' }}</p>
        <div class="flex items-center justify-between text-xs text-gray-400">
            <span>Created {{ formatDate(topic.created_at) }}</span>
            <div class="bg-gradient-to-r from-accent-500 to-primary-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Study Now!
            </div>
        </div>
    </div>
    `,
    
    setup(props) {
        const questionCount = Vue.ref(0);

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString();
        };

        // Load question count for this topic
        Vue.onMounted(async () => {
            try {
                const questions = await window.api.getQuestions(props.topic.id);
                questionCount.value = questions.length;
            } catch (error) {
                console.warn('Failed to load question count:', error);
            }
        });

        return {
            questionCount,
            formatDate
        };
    },
    
    emits: ['click']
};