// src/frontend/components/Subjects/SubjectsList.js
window.SubjectsListComponent = {
    template: `
    <div class="animate-fade-in space-y-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h2 class="text-2xl md:text-3xl font-bold text-white mb-2">
                    <span class="mr-3">📚</span>My Learning Subjects
                </h2>
                <p class="text-white/80">Organize your learning by subjects and topics!</p>
            </div>
            <button
                @click="store.showCreateSubjectModal()"
                class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg transition-all duration-300"
            >
                <i class="fas fa-plus mr-2"></i>Add New Subject
            </button>
        </div>

        <!-- Loading -->
        <div v-if="store.state.loading" class="text-center py-12">
            <div class="loading-pulse w-8 h-8 bg-primary-500 rounded-full mx-auto mb-4"></div>
            <p class="text-white text-xl">Loading your subjects...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="store.state.subjects.length === 0" class="text-center py-12">
            <div class="text-8xl mb-6 animate-bounce-slow">📚</div>
            <h3 class="text-2xl font-bold text-white mb-4">No subjects yet!</h3>
            <p class="text-white/80 text-lg mb-6">Create your first subject to start your learning journey!</p>
            <button
                @click="store.showCreateSubjectModal()"
                class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-300"
            >
                <i class="fas fa-rocket mr-3"></i>Start Learning!
            </button>
        </div>

        <!-- Subjects Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SubjectCard
                v-for="subject in store.state.subjects"
                :key="subject.id"
                :subject="subject"
                @click="store.selectSubject(subject)"
            />
        </div>
    </div>
    `,

    setup() {
        const store = window.store;

        Vue.onMounted(async () => {
            if (store.state.subjects.length === 0) {
                store.setLoading(true);
                try {
                    const subjects = await window.api.getSubjects();
                    store.setSubjects(subjects);
                } catch (error) {
                    store.showNotification('Failed to load subjects', 'error');
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