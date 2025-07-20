// src/frontend/components/Subjects/SubjectCard.js - FIXED VERSION
window.SubjectCard = {
    props: {
        subject: {
            type: Object,
            required: true
        }
    },
    
    template: `
    <div 
        @click="$emit('click', subject)"
        class="bg-white rounded-2xl p-6 hover-lift cursor-pointer group achievement-badge"
    >
        <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:shadow-lg transition-shadow">
                {{ subject.name.charAt(0).toUpperCase() }}
            </div>
            <div class="text-right">
                <div class="text-2xl font-bold text-primary-600">{{ topicCount }}</div>
                <div class="text-xs text-gray-500">topics</div>
            </div>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary-600 transition-colors">{{ subject.name }}</h3>
        <p class="text-gray-600 text-sm mb-4">{{ subject.description || 'Ready to explore!' }}</p>
        <div class="flex items-center justify-between text-xs text-gray-400">
            <span>Created {{ formatDate(subject.created_at) }}</span>
            <div class="flex space-x-1">
                <div class="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></div>
                <div class="w-2 h-2 rounded-full bg-primary-500 animate-pulse" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 rounded-full bg-secondary-500 animate-pulse" style="animation-delay: 0.4s"></div>
            </div>
        </div>
    </div>
    `,
    
    setup(props) {
        const topicCount = Vue.ref(0);

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString();
        };

        // Load topic count for this subject
        Vue.onMounted(async () => {
            try {
                const topics = await window.api.getTopics(props.subject.id);
                topicCount.value = topics.length;
            } catch (error) {
                console.warn('Failed to load topic count:', error);
            }
        });

        return {
            topicCount,
            formatDate
        };
    },
    
    emits: ['click']
};