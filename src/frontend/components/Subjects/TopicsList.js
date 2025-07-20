// src/frontend/components/Subjects/TopicsList.js
window.TopicsListComponent = {
    template: `
    <div class="animate-fade-in space-y-6">
        <div class="flex items-center mb-6">
            <button
                @click="store.clearSelection(); store.setCurrentView('subjects')"
                class="mr-4 text-white hover:text-white/80 text-2xl"
            >
                <i class="fas fa-arrow-left"></i>
            </button>
            <div class="flex-1">
                <h2 class="text-2xl md:text-3xl font-bold text-white mb-2">
                    <span class="mr-3">📖</span>{{ store.state.selectedSubject?.name }} Topics
                </h2>
                <p class="text-white/80">{{ store.state.selectedSubject?.description || 'Dive deeper into specific topics!' }}</p>
            </div>
            <button
                @click="store.showCreateTopicModal()"
                class="bg-gradient-to-r from-accent-500 to-primary-500 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition-all duration-300"
            >
                <i class="fas fa-plus mr-2"></i>Add Topic
            </button>
        </div>

        <!-- Loading -->
        <div v-if="store.state.loading" class="text-center py-12">
            <div class="loading-pulse w-8 h-8 bg-primary-500 rounded-full mx-auto mb-4"></div>
            <p class="text-white text-xl">Loading topics...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="store.state.topics.length === 0" class="text-center py-12">
            <div class="text-8xl mb-6 animate-bounce-slow">📖</div>
            <h3 class="text-2xl font-bold text-white mb-4">No topics yet!</h3>
            <p class="text-white/80 text-lg mb-6">Add your first topic to {{ store.state.selectedSubject?.name }}!</p>
            <button
                @click="store.showCreateTopicModal()"
                class="bg-gradient-to-r from-accent-500 to-primary-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-300"
            >
                <i class="fas fa-plus mr-3"></i>Add First Topic!
            </button>
        </div>

        <!-- Topics Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TopicCard
                v-for="topic in store.state.topics"
                :key="topic.id"
                :topic="topic"
                @click="store.selectTopic(topic)"
            />
        </div>
    </div>
    `,

    setup() {
        const store = window.store;

        Vue.onMounted(async () => {
            if (store.state.selectedSubject && store.state.topics.length === 0) {
                store.setLoading(true);
                try {
                    const topics = await window.api.getTopics(store.state.selectedSubject.id);
                    store.setTopics(topics);
                } catch (error) {
                    store.showNotification('Failed to load topics', 'error');
                } finally {
                    store.setLoading(false);
                }
            }
        });

        return {
            store
        };
    }
};