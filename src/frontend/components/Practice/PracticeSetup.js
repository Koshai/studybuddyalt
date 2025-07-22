// src/frontend/components/Practice/PracticeSetup.js - MCQ-ONLY VERSION
window.PracticeSetupComponent = {
    template: `
    <div class="animate-fade-in space-y-6">
        <div class="text-center mb-8">
            <h2 class="text-2xl md:text-3xl font-bold text-black mb-4">
                <span class="mr-3">🎯</span>MCQ Practice Session
            </h2>
            <p class="text-black/80 text-lg">Test your knowledge with AI-generated multiple choice questions!</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Control Panel -->
            <div class="lg:col-span-1">
                <div class="content-card p-6 sticky top-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                        <i class="fas fa-cogs mr-2"></i>Setup MCQ Practice
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
                                @change="handleTopicChange"
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
                                <label class="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                                <select v-model="practiceConfig.count" class="form-input w-full px-3 py-2 rounded-lg focus:outline-none">
                                    <option :value="3">3 Questions</option>
                                    <option :value="5">5 Questions</option>
                                    <option :value="10">10 Questions</option>
                                    <option :value="15">15 Questions</option>
                                    <option :value="20">20 Questions</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                                <select v-model="practiceConfig.difficulty" class="form-input w-full px-3 py-2 rounded-lg focus:outline-none">
                                    <option value="easy">🟢 Easy - Basic facts and recall</option>
                                    <option value="medium">🟡 Medium - Analysis and application</option>
                                    <option value="hard">🔴 Hard - Complex reasoning</option>
                                </select>
                            </div>

                            <!-- Topic Info -->
                            <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <h5 class="font-medium text-blue-900 mb-2">📚 Topic Information</h5>
                                <div class="text-sm text-blue-800 space-y-1">
                                    <p><strong>Subject:</strong> {{ selectedSubject.name }}</p>
                                    <p><strong>Topic:</strong> {{ selectedTopic.name }}</p>
                                    <p><strong>Study Materials:</strong> {{ notesCount }} files</p>
                                    <p><strong>Existing Questions:</strong> {{ existingQuestions }} MCQs</p>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div v-if="selectedTopic" class="space-y-3 pt-4 border-t border-gray-200">
                            <button
                                @click="generateQuestions"
                                :disabled="store.state.generating || !canGenerate"
                                :class="[
                                    'w-full py-3 rounded-lg font-medium transition-all duration-300',
                                    canGenerate 
                                        ? 'btn-gradient text-white hover:shadow-lg' 
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                ]"
                            >
                                <i v-if="!store.state.generating" class="fas fa-magic mr-2"></i>
                                <i v-else class="fas fa-spinner fa-spin mr-2"></i>
                                {{ store.state.generating ? 'Generating MCQs...' : 'Generate New MCQ Questions' }}
                            </button>
                            
                            <button
                                @click="loadExistingQuestions"
                                :disabled="existingQuestions === 0"
                                :class="[
                                    'w-full py-3 rounded-lg font-medium transition-colors',
                                    existingQuestions > 0 
                                        ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                ]"
                            >
                                <i class="fas fa-random mr-2"></i>
                                Practice Existing MCQs ({{ existingQuestions }})
                            </button>

                            <!-- Warning if no study materials -->
                            <div v-if="!canGenerate" class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <div class="flex items-center">
                                    <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                                    <span class="text-sm text-yellow-800">
                                        Upload study materials first to generate questions
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Progress Display -->
                    <div v-if="store.state.practiceStarted && store.state.questions.length > 0" class="mt-6 pt-4 border-t border-gray-200">
                        <h4 class="font-medium text-gray-900 mb-3">📊 Practice Progress</h4>
                        <div class="space-y-3">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Question {{ store.state.currentQuestionIndex + 1 }} of {{ store.state.questions.length }}</span>
                                <span class="font-medium">{{ store.progressPercentage }}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                                <div class="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-300" :style="{ width: store.progressPercentage + '%' }"></div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="text-center bg-green-50 p-2 rounded-lg">
                                    <div class="text-lg font-bold text-green-600">{{ store.state.score.correct }}</div>
                                    <div class="text-xs text-green-700">Correct</div>
                                </div>
                                <div class="text-center bg-red-50 p-2 rounded-lg">
                                    <div class="text-lg font-bold text-red-600">{{ store.state.score.total - store.state.score.correct }}</div>
                                    <div class="text-xs text-red-700">Incorrect</div>
                                </div>
                            </div>
                            <div class="text-center bg-blue-50 p-2 rounded-lg">
                                <div class="text-lg font-bold text-blue-600">{{ store.accuracyPercentage }}%</div>
                                <div class="text-xs text-blue-700">Accuracy</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Question Area -->
            <div class="lg:col-span-3">
                <!-- Empty State -->
                <div v-if="!store.state.practiceStarted || store.state.questions.length === 0" class="content-card p-12 text-center">
                    <div class="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-brain text-blue-600 text-4xl"></i>
                    </div>
                    <h3 class="text-2xl font-semibold text-gray-900 mb-4">Ready for MCQ Practice?</h3>
                    <p class="text-gray-600 mb-8 text-lg">Select a subject and topic, then generate or load multiple choice questions to start your practice session.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                        <div class="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                            <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-book text-white text-xl"></i>
                            </div>
                            <h4 class="font-semibold text-gray-900 mb-2">1. Choose Topic</h4>
                            <p class="text-sm text-gray-600">Select what you want to practice</p>
                        </div>
                        
                        <div class="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                            <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-magic text-white text-xl"></i>
                            </div>
                            <h4 class="font-semibold text-gray-900 mb-2">2. Generate MCQs</h4>
                            <p class="text-sm text-gray-600">AI creates questions from your notes</p>
                        </div>
                        
                        <div class="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-play text-white text-xl"></i>
                            </div>
                            <h4 class="font-semibold text-gray-900 mb-2">3. Start Practicing</h4>
                            <p class="text-sm text-gray-600">Answer questions and track progress</p>
                        </div>
                    </div>
                </div>

                <!-- Active Question -->
                <MCQQuestionCard v-else-if="store.state.practiceStarted" />
                
                <!-- Debug Info -->
                <div v-else class="content-card p-6 bg-yellow-50 border border-yellow-200">
                    <h3 class="text-lg font-semibold text-yellow-800 mb-3">Debug Information</h3>
                    <div class="text-sm text-yellow-700 space-y-1">
                        <p><strong>Practice Started:</strong> {{ store.state.practiceStarted }}</p>
                        <p><strong>Questions Length:</strong> {{ store.state.questions.length }}</p>
                        <p><strong>Current Question Index:</strong> {{ store.state.currentQuestionIndex }}</p>
                        <p><strong>Current Question:</strong> {{ store.currentQuestion ? 'Available' : 'None' }}</p>
                        <div v-if="store.state.questions.length > 0">
                            <p><strong>First Question Preview:</strong></p>
                            <p class="font-mono text-xs">{{ JSON.stringify(store.state.questions[0], null, 2).substring(0, 200) }}...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const selectedSubject = Vue.ref(null);
        const selectedTopic = Vue.ref(null);
        const availableTopics = Vue.ref([]);
        const notesCount = Vue.ref(0);
        const existingQuestions = Vue.ref(0);

        const practiceConfig = Vue.reactive({ 
            count: 5, 
            difficulty: 'medium'
        });

        const canGenerate = Vue.computed(() => {
            return notesCount.value > 0;
        });

        const handleSubjectChange = async () => {
            selectedTopic.value = null;
            availableTopics.value = [];
            notesCount.value = 0;
            existingQuestions.value = 0;
            
            if (selectedSubject.value) {
                try {
                    const topics = await window.api.getTopics(selectedSubject.value.id);
                    availableTopics.value = topics;
                } catch (error) {
                    store.showNotification('Failed to load topics', 'error');
                }
            }
        };

        const handleTopicChange = async () => {
            if (selectedTopic.value) {
                store.selectTopic(selectedTopic.value);
                
                // Load notes count
                try {
                    const notes = await window.api.getNotes(selectedTopic.value.id);
                    notesCount.value = notes.length;
                } catch (error) {
                    notesCount.value = 0;
                }
                
                // Load existing questions count (MCQ only)
                try {
                    const questions = await window.api.getQuestions(selectedTopic.value.id);
                    // Filter for MCQ questions only
                    existingQuestions.value = questions.filter(q => q.type === 'multiple_choice').length;
                } catch (error) {
                    existingQuestions.value = 0;
                }
            }
        };

        const generateQuestions = async () => {
            if (!selectedTopic.value || !canGenerate.value) {
                store.showNotification('Please select a topic with study materials', 'warning');
                return;
            }

            store.setGenerating(true);
            
            try {
                console.log(`🎯 Generating ${practiceConfig.count} MCQ questions for topic: ${selectedTopic.value.name}`);
                
                const questions = await window.api.generateQuestions(
                    selectedTopic.value.id,
                    practiceConfig.count,
                    practiceConfig.difficulty
                );
                
                console.log(`📊 Received ${questions.length} questions from API`);
                
                if (questions && questions.length > 0) {
                    // Filter to only MCQ questions
                    const mcqQuestions = questions.filter(q => q.type === 'multiple_choice');
                    
                    if (mcqQuestions.length > 0) {
                        store.startPractice(mcqQuestions);
                        store.showNotification(`Generated ${mcqQuestions.length} MCQ questions successfully!`, 'success');
                        
                        // Update existing questions count
                        existingQuestions.value += mcqQuestions.length;
                    } else {
                        store.showNotification('No MCQ questions were generated. Please try again.', 'warning');
                    }
                } else {
                    store.showNotification('Failed to generate questions. Make sure your study materials contain enough content.', 'error');
                }
                
            } catch (error) {
                console.error('Question generation error:', error);
                store.showNotification('Failed to generate questions. Check that Ollama is running and try again.', 'error');
            } finally {
                store.setGenerating(false);
            }
        };

        const loadExistingQuestions = async () => {
            if (!selectedTopic.value || existingQuestions.value === 0) {
                store.showNotification('No existing questions found', 'info');
                return;
            }

            try {
                const allQuestions = await window.api.getQuestions(selectedTopic.value.id);
                
                // Filter to only MCQ questions
                const mcqQuestions = allQuestions.filter(q => q.type === 'multiple_choice');
                
                if (mcqQuestions.length === 0) {
                    store.showNotification('No MCQ questions found. Generate some first!', 'info');
                    return;
                }

                // Shuffle and select requested number
                const shuffled = mcqQuestions.sort(() => 0.5 - Math.random());
                const selectedQuestions = shuffled.slice(0, practiceConfig.count);
                
                store.startPractice(selectedQuestions);
                store.showNotification(`Started practice with ${selectedQuestions.length} MCQ questions!`, 'success');
                
            } catch (error) {
                console.error('Load questions error:', error);
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
            notesCount,
            existingQuestions,
            canGenerate,
            handleSubjectChange,
            handleTopicChange,
            generateQuestions,
            loadExistingQuestions
        };
    }
};