// components/Practice/PracticeSetup-simplified.js - Simplified Practice for Fixed Subjects
window.PracticeSetupSimplifiedComponent = {
    template: `
    <div class="animate-fade-in space-y-6">
        <div class="text-center mb-8">
            <h2 class="text-2xl md:text-3xl font-bold text-black mb-4">
                <span class="mr-3">🎯</span>Practice Session
            </h2>
            <p class="text-black/80 text-lg">Test your knowledge with AI-generated questions!</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Control Panel -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                        <i class="fas fa-cogs mr-2"></i>Practice Setup
                    </h3>
                    
                    <div class="space-y-4">
                        <!-- Subject Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                            <select
                                v-model="selectedSubject"
                                @change="handleSubjectChange"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                            >
                                <option value="">Choose subject...</option>
                                <option v-for="subject in subjects" :key="subject.id" :value="subject">
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
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                            >
                                <option value="">Choose topic...</option>
                                <option v-for="topic in availableTopics" :key="topic.id" :value="topic">
                                    {{ topic.name }} ({{ topicQuestionCounts[topic.id] || 0 }} questions)
                                </option>
                            </select>
                        </div>

                        <!-- Practice Configuration -->
                        <div v-if="selectedTopic" class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                                <select v-model="practiceConfig.count" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
                                    <option :value="3">3 Questions</option>
                                    <option :value="5">5 Questions</option>
                                    <option :value="10">10 Questions</option>
                                    <option :value="15">15 Questions</option>
                                    <option :value="20">20 Questions</option>
                                </select>
                            </div>
                            
                            <!-- Topic Info -->
                            <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <h5 class="font-medium text-blue-900 mb-2">📚 Topic Information</h5>
                                <div class="text-sm text-blue-800 space-y-1">
                                    <p><strong>Subject:</strong> {{ selectedSubject.name }}</p>
                                    <p><strong>Topic:</strong> {{ selectedTopic.name }}</p>
                                    <p><strong>Study Materials:</strong> {{ notesCount }} files</p>
                                    <p><strong>Available Questions:</strong> {{ existingQuestions }} total</p>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div v-if="selectedTopic" class="space-y-3 pt-4 border-t border-gray-200">
                            <button
                                @click="startPracticeSession"
                                :disabled="!canStartPractice"
                                :class="[
                                    'w-full py-3 rounded-lg font-medium transition-all duration-300',
                                    canStartPractice 
                                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg' 
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                ]"
                            >
                                <i class="fas fa-play mr-2"></i>
                                {{ canStartPractice ? 'Start Practice' : 'No Questions Available' }}
                            </button>
                            
                            <button
                                @click="generateQuestionsFirst"
                                :disabled="store.state.generating || notesCount === 0"
                                :class="[
                                    'w-full py-3 rounded-lg font-medium transition-colors',
                                    notesCount > 0 
                                        ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                ]"
                            >
                                <i v-if="!store.state.generating" class="fas fa-magic mr-2"></i>
                                <i v-else class="fas fa-spinner fa-spin mr-2"></i>
                                {{ store.state.generating ? 'Generating...' : 'Generate New Questions' }}
                            </button>

                            <!-- Upload Materials Button -->
                            <button
                                @click="uploadMaterials"
                                class="w-full py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium transition-colors"
                            >
                                <i class="fas fa-upload mr-2"></i>
                                Add Study Materials
                            </button>

                            <!-- Warning if no materials -->
                            <div v-if="notesCount === 0" class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <div class="flex items-center">
                                    <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                                    <span class="text-sm text-yellow-800">
                                        Upload study materials to generate questions
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
                <div v-if="!store.state.practiceStarted || store.state.questions.length === 0" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                    <div class="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-brain text-blue-600 text-4xl"></i>
                    </div>
                    <h3 class="text-2xl font-semibold text-gray-900 mb-4">Ready to Practice?</h3>
                    <p class="text-gray-600 mb-8 text-lg">Select a subject and topic, then start your practice session to test your knowledge.</p>
                    
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
                                <i class="fas fa-cogs text-white text-xl"></i>
                            </div>
                            <h4 class="font-semibold text-gray-900 mb-2">2. Configure</h4>
                            <p class="text-sm text-gray-600">Set number of questions</p>
                        </div>
                        
                        <div class="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-play text-white text-xl"></i>
                            </div>
                            <h4 class="font-semibold text-gray-900 mb-2">3. Practice</h4>
                            <p class="text-sm text-gray-600">Answer questions and track progress</p>
                        </div>
                    </div>
                </div>

                <!-- Active Question -->
                <MCQQuestionCard v-else-if="store.state.practiceStarted && store.currentQuestion" />
                
                <!-- Debug Info (can be removed in production) -->
                <div v-else class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 bg-yellow-50 border-yellow-200">
                    <h3 class="text-lg font-semibold text-yellow-800 mb-3">Debug Information</h3>
                    <div class="text-sm text-yellow-700 space-y-1">
                        <p><strong>Practice Started:</strong> {{ store.state.practiceStarted }}</p>
                        <p><strong>Questions Length:</strong> {{ store.state.questions.length }}</p>
                        <p><strong>Current Question Index:</strong> {{ store.state.currentQuestionIndex }}</p>
                        <p><strong>Current Question:</strong> {{ store.currentQuestion ? 'Available' : 'None' }}</p>
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
        const topicQuestionCounts = Vue.ref({});

        const practiceConfig = Vue.reactive({ 
            count: 5
        });

        // Get fixed subjects from store
        const subjects = Vue.computed(() => store.state.subjects);

        const canStartPractice = Vue.computed(() => {
            return selectedTopic.value && existingQuestions.value > 0;
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
                    
                    // Load question counts for all topics
                    for (const topic of topics) {
                        try {
                            const questions = await window.api.getQuestions(topic.id);
                            topicQuestionCounts.value[topic.id] = questions.length;
                        } catch (error) {
                            topicQuestionCounts.value[topic.id] = 0;
                        }
                    }
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
                
                // Load existing questions count
                try {
                    const questions = await window.api.getQuestions(selectedTopic.value.id);
                    existingQuestions.value = questions.length;
                } catch (error) {
                    existingQuestions.value = 0;
                }
            }
        };

        const startPracticeSession = async () => {
            if (!selectedTopic.value || existingQuestions.value === 0) {
                store.showNotification('No questions available for practice', 'warning');
                return;
            }

            try {
                // Get random questions for practice
                const questions = await window.api.getRandomQuestions(
                    selectedTopic.value.id,
                    practiceConfig.count
                );
                
                if (questions && questions.length > 0) {
                    console.log(`🎯 Starting practice with ${questions.length} questions`);
                    const success = store.startPractice(questions);
                    
                    if (success) {
                        store.showNotification(`Started practice with ${questions.length} questions!`, 'success');
                    }
                } else {
                    store.showNotification('No questions found. Generate some first!', 'warning');
                }
                
            } catch (error) {
                console.error('Failed to load questions for practice:', error);
                store.showNotification('Failed to load questions for practice', 'error');
            }
        };

        const generateQuestionsFirst = async () => {
            if (!selectedTopic.value || notesCount.value === 0) {
                store.showNotification('Please upload study materials first', 'warning');
                return;
            }

            store.setGenerating(true);
            
            try {
                console.log(`🎯 Generating questions for topic: ${selectedTopic.value.name}`);
                
                const questions = await window.api.generateQuestions(
                    selectedTopic.value.id,
                    practiceConfig.count,
                    selectedSubject.value,
                    selectedTopic.value
                );
                
                console.log(`📊 Generated ${questions.length} questions`);
                
                if (questions && questions.length > 0) {
                    existingQuestions.value += questions.length;
                    topicQuestionCounts.value[selectedTopic.value.id] = existingQuestions.value;
                    
                    store.showNotification(`Generated ${questions.length} questions successfully!`, 'success');
                    
                    // Auto-start practice with new questions
                    const success = store.startPractice(questions);
                    if (success) {
                        store.showNotification('Practice session started!', 'success');
                    }
                } else {
                    store.showNotification('No questions were generated. Please check your study materials.', 'warning');
                }
                
            } catch (error) {
                console.error('Question generation error:', error);
                store.showNotification('Failed to generate questions. Make sure Ollama is running.', 'error');
            } finally {
                store.setGenerating(false);
            }
        };

        const uploadMaterials = () => {
            if (selectedTopic.value) {
                store.selectTopic(selectedTopic.value);
            }
            if (selectedSubject.value) {
                store.selectSubject(selectedSubject.value);
            }
            store.setCurrentView('upload');
        };

        // Auto-select if coming from specific context
        Vue.onMounted(async () => {
            // Auto-select subject and topic if already chosen
            if (store.state.selectedSubject) {
                selectedSubject.value = store.state.selectedSubject;
                await handleSubjectChange();
                
                if (store.state.selectedTopic) {
                    selectedTopic.value = store.state.selectedTopic;
                    await handleTopicChange();
                }
            }
        });

        return {
            store,
            subjects,
            selectedSubject,
            selectedTopic,
            availableTopics,
            practiceConfig,
            notesCount,
            existingQuestions,
            topicQuestionCounts,
            canStartPractice,
            handleSubjectChange,
            handleTopicChange,
            startPracticeSession,
            generateQuestionsFirst,
            uploadMaterials
        };
    }
};