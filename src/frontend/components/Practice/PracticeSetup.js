// src/frontend/components/Practice/PracticeSetup.js
window.PracticeSetupComponent = {
    template: `
    <div class="animate-fade-in space-y-6">
        <div class="text-center mb-8">
            <h2 class="text-2xl md:text-3xl font-bold text-black mb-4">
                <span class="mr-3">🎯</span>Practice & Learn
            </h2>
            <p class="text-black/80 text-lg">Test your knowledge with AI-generated questions!</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Control Panel -->
            <div class="lg:col-span-1">
                <div class="content-card p-6 sticky top-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                        <i class="fas fa-cogs mr-2"></i>Setup Practice
                    </h3>
                    
                    <div class="space-y-4">
                        <!-- Subject Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                            <select
                                v-model="selectedSubject"
                                @change="handleSubjectChange"
                                class="form-input w-full px-3 py-2 rounded-lg focus:outline-none"
                            >
                                <option value="">Choose subject...</option>
                                <option v-for="subject in store.state.subjects" :key="subject.id" :value="subject">
                                    {{ subject.name }}
                                </option>
                            </select>
                        </div>

                        <!-- Topic Selection -->
                        <div v-if="selectedSubject">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                            <select
                                v-model="selectedTopic"
                                class="form-input w-full px-3 py-2 rounded-lg focus:outline-none"
                            >
                                <option value="">Choose topic...</option>
                                <option v-for="topic in availableTopics" :key="topic.id" :value="topic">
                                    {{ topic.name }}
                                </option>
                            </select>
                        </div>

                        <!-- Practice Configuration -->
                        <div v-if="selectedTopic" class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Questions Count</label>
                                <select v-model="practiceConfig.count" class="form-input w-full px-3 py-2 rounded-lg focus:outline-none">
                                    <option :value="5">5 Questions</option>
                                    <option :value="10">10 Questions</option>
                                    <option :value="15">15 Questions</option>
                                    <option :value="20">20 Questions</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                                <select v-model="practiceConfig.difficulty" class="form-input w-full px-3 py-2 rounded-lg focus:outline-none">
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div v-if="selectedTopic" class="space-y-3 pt-4 border-t border-gray-200">
                            <button
                                @click="generateQuestions"
                                :disabled="store.state.generating"
                                class="w-full btn-gradient text-white py-3 rounded-lg font-medium disabled:opacity-50"
                            >
                                <i v-if="!store.state.generating" class="fas fa-magic mr-2"></i>
                                <i v-else class="fas fa-spinner fa-spin mr-2"></i>
                                {{ store.state.generating ? 'Generating...' : 'Generate Questions' }}
                            </button>
                            
                            <button
                                @click="loadRandomQuestions"
                                class="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                <i class="fas fa-random mr-2"></i>
                                Practice Random
                            </button>
                        </div>
                    </div>

                    <!-- Score Display -->
                    <div v-if="store.state.practiceStarted && store.state.questions.length > 0" class="mt-6 pt-4 border-t border-gray-200">
                        <h4 class="font-medium text-gray-900 mb-3">Progress</h4>
                        <div class="space-y-3">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Question {{ store.state.currentQuestionIndex + 1 }} of {{ store.state.questions.length }}</span>
                                <span class="font-medium">{{ store.progressPercentage }}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-primary-500 h-2 rounded-full transition-all duration-300" :style="{ width: store.progressPercentage + '%' }"></div>
                            </div>
                            <div class="flex justify-between">
                                <div class="text-center">
                                    <div class="text-lg font-bold text-accent-600">{{ store.state.score.correct }}</div>
                                    <div class="text-xs text-gray-500">Correct</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-bold text-red-500">{{ store.state.score.total - store.state.score.correct }}</div>
                                    <div class="text-xs text-gray-500">Incorrect</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-bold text-primary-600">{{ store.accuracyPercentage }}%</div>
                                    <div class="text-xs text-gray-500">Accuracy</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Question Area -->
            <div class="lg:col-span-3">
                <!-- Empty State -->
                <div v-if="!store.state.practiceStarted || store.state.questions.length === 0" class="content-card p-12 text-center">
                    <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-brain text-gray-400 text-3xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-4">Ready to Practice?</h3>
                    <p class="text-gray-600 mb-6">Select a subject and topic, then generate or load questions to start your practice session.</p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="p-4 bg-gray-50 rounded-xl">
                            <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-book text-primary-600"></i>
                            </div>
                            <h4 class="font-medium text-gray-900 mb-1">1. Choose Subject</h4>
                            <p class="text-sm text-gray-600">Select the subject you want to practice</p>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-xl">
                            <div class="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-file-alt text-secondary-600"></i>
                            </div>
                            <h4 class="font-medium text-gray-900 mb-1">2. Pick Topic</h4>
                            <p class="text-sm text-gray-600">Choose a specific topic to focus on</p>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-xl">
                            <div class="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-magic text-accent-600"></i>
                            </div>
                            <h4 class="font-medium text-gray-900 mb-1">3. Start Practice</h4>
                            <p class="text-sm text-gray-600">Generate AI questions and begin learning</p>
                        </div>
                    </div>
                </div>

                <!-- Active Question -->
                <QuestionCard v-else />
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const selectedSubject = Vue.ref(null);
        const selectedTopic = Vue.ref(null);
        const availableTopics = Vue.ref([]);
        const practiceConfig = Vue.reactive({ count: 5, difficulty: 'medium' });

        const handleSubjectChange = async () => {
            selectedTopic.value = null;
            availableTopics.value = [];
            
            if (selectedSubject.value) {
                try {
                    const topics = await window.api.getTopics(selectedSubject.value.id);
                    availableTopics.value = topics;
                } catch (error) {
                    store.showNotification('Failed to load topics', 'error');
                }
            }
        };

        const generateQuestions = async () => {
            if (!selectedTopic.value) return;

            store.setGenerating(true);
            try {
                const questions = await window.api.generateQuestions(
                    selectedTopic.value.id,
                    practiceConfig.count,
                    practiceConfig.difficulty
                );
                store.startPractice(questions);
                store.showNotification('Questions generated successfully!', 'success');
            } catch (error) {
                console.error('Error generating questions:', error);
                store.showNotification('Add study materials first to generate questions', 'warning');
            } finally {
                store.setGenerating(false);
            }
        };

        const loadRandomQuestions = async () => {
            if (!selectedTopic.value) return;

            try {
                const questions = await window.api.getRandomQuestions(selectedTopic.value.id, practiceConfig.count);
                if (questions.length === 0) {
                    store.showNotification('No questions available. Generate some first!', 'info');
                    return;
                }
                store.startPractice(questions);
                store.showNotification('Practice session started!', 'success');
            } catch (error) {
                console.error('Error loading questions:', error);
                store.showNotification('Failed to load questions', 'error');
            }
        };

        // Load subjects on mount
        Vue.onMounted(async () => {
            if (store.state.subjects.length === 0) {
                try {
                    const subjects = await window.api.getSubjects();
                    store.setSubjects(subjects);
                } catch (error) {
                    store.showNotification('Failed to load subjects', 'error');
                }
            }
        });

        return {
            store,
            selectedSubject,
            selectedTopic,
            availableTopics,
            practiceConfig,
            handleSubjectChange,
            generateQuestions,
            loadRandomQuestions
        };
    }
};