// components/Practice/PracticeSetup-enhanced.js - Practice with Usage Integration
window.EnhancedPracticeSetupComponent = {
    template: `
    <div class="animate-fade-in space-y-8">
        <!-- Header with Usage Info -->
        <div class="text-center mb-8">
            <div class="flex items-center justify-between mb-4">
                <div class="flex-1">
                    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                        <span class="mr-3">🧠</span>Practice Session
                    </h2>
                    <p class="text-gray-600 text-lg">Test your knowledge with AI-generated questions</p>
                </div>
                <div class="text-right">
                    <div class="bg-white border border-gray-200 rounded-lg px-4 py-2">
                        <p class="text-xs text-gray-600">Questions Used</p>
                        <p class="font-bold text-sm" :class="questionsUsagePercentage > 80 ? 'text-red-600' : 'text-gray-900'">
                            {{ store.state.usage?.questions?.used || 0 }}/{{ store.state.usage?.questions?.limit || 50 }}
                        </p>
                        <div class="w-20 h-1 bg-gray-200 rounded-full mt-1">
                            <div class="h-1 rounded-full transition-all duration-300" 
                                 :class="questionsUsagePercentage > 90 ? 'bg-red-500' : questionsUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'"
                                 :style="{ width: Math.min(questionsUsagePercentage, 100) + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Usage Warning -->
            <div v-if="questionsUsagePercentage > 80" class="mt-4 p-3 rounded-lg" :class="questionsUsagePercentage > 90 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'">
                <div class="flex items-center justify-center">
                    <i :class="['mr-2', questionsUsagePercentage > 90 ? 'fas fa-exclamation-circle text-red-500' : 'fas fa-exclamation-triangle text-yellow-500']"></i>
                    <p :class="['text-sm font-medium', questionsUsagePercentage > 90 ? 'text-red-800' : 'text-yellow-800']">
                        {{ questionsUsagePercentage > 90 ? 'Question limit almost reached!' : 'Question usage running high!' }}
                        {{ questionsUsagePercentage.toFixed(1) }}% used this month.
                        <button v-if="store.state.subscriptionTier === 'free'" 
                                @click="showUpgradeModal" 
                                :class="['ml-2 underline hover:no-underline', questionsUsagePercentage > 90 ? 'text-red-900' : 'text-yellow-900']">
                            Upgrade to Pro for 1500 questions/month
                        </button>
                    </p>
                </div>
            </div>
        </div>

        <!-- Practice Options -->
        <div class="max-w-4xl mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Generate New Questions -->
                <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-magic text-white text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-2">Generate New Questions</h3>
                        <p class="text-gray-600">Create fresh AI-powered questions from your study materials</p>
                    </div>

                    <!-- Generation Form -->
                    <form @submit.prevent="generateQuestions" class="space-y-6">
                        <!-- Subject Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-book mr-2 text-gray-500"></i>Subject
                            </label>
                            <select
                                v-model="selectedSubject"
                                @change="handleSubjectChange"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                required
                            >
                                <option value="">Choose a subject...</option>
                                <option v-for="subject in availableSubjects" :key="subject.id" :value="subject">
                                    {{ subject.name }}
                                </option>
                            </select>
                        </div>

                        <!-- Topic Selection -->
                        <div v-if="selectedSubject">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-file-alt mr-2 text-gray-500"></i>Topic
                            </label>
                            <select
                                v-model="selectedTopic"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                required
                            >
                                <option value="">Choose a topic...</option>
                                <option v-for="topic in availableTopics" :key="topic.id" :value="topic">
                                    {{ topic.name }} ({{ topic.notesCount || 0 }} files)
                                </option>
                            </select>
                        </div>

                        <!-- Question Count -->
                        <div v-if="selectedTopic">
                            <div class="flex items-center justify-between mb-2">
                                <label class="block text-sm font-medium text-gray-700">
                                    <i class="fas fa-list-ol mr-2 text-gray-500"></i>Number of Questions
                                </label>
                                <span class="text-xs text-gray-500">
                                    Remaining: {{ Math.max(0, (store.state.usage?.questions?.limit || 50) - (store.state.usage?.questions?.used || 0)) }}
                                </span>
                            </div>
                            <select
                                v-model="questionCount"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                            >
                                <option v-for="count in availableQuestionCounts" :key="count" :value="count">
                                    {{ count }} questions
                                </option>
                            </select>
                            
                            <!-- Question count warning -->
                            <div v-if="questionCount > remainingQuestions" class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                Not enough questions remaining ({{ remainingQuestions }} left).
                                <button v-if="store.state.subscriptionTier === 'free'" 
                                        @click="showUpgradeModal" 
                                        class="underline hover:no-underline ml-1">
                                    Upgrade to Pro
                                </button>
                            </div>
                        </div>

                        <!-- Generation Button -->
                        <button
                            type="submit"
                            :disabled="!canGenerate"
                            class="w-full py-4 rounded-lg font-medium transition-all duration-300"
                            :class="canGenerate 
                                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'"
                        >
                            <i v-if="!store.state.generating" class="fas fa-magic mr-2"></i>
                            <i v-else class="fas fa-spinner fa-spin mr-2"></i>
                            {{ getGenerateButtonText }}
                        </button>
                        
                        <!-- Generation Loading State -->
                        <div v-if="store.state.generating" class="mt-6">
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div class="flex items-center justify-center">
                                    <i class="fas fa-brain text-blue-600 text-2xl animate-pulse mr-3"></i>
                                    <div>
                                        <h4 class="font-medium text-blue-900">AI is working on your questions...</h4>
                                        <p class="text-sm text-blue-700">This usually takes 1-3 minutes depending on content complexity</p>
                                    </div>
                                </div>
                            </div>
                            <div class="space-y-3">
                                <QuestionCardSkeleton v-for="skeleton in questionCount" :key="skeleton" />
                            </div>
                        </div>

                        <!-- Generation limitations info -->
                        <div v-else-if="selectedTopic" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 class="font-medium text-blue-900 mb-2 flex items-center">
                                <i class="fas fa-info-circle mr-2"></i>
                                Generation Info
                            </h4>
                            <div class="text-sm text-blue-800 space-y-1">
                                <p><strong>Study Materials:</strong> {{ selectedTopic.notesCount || 0 }} files uploaded</p>
                                <p><strong>AI Model:</strong> {{ store.state.subscriptionTier === 'pro' ? 'GPT-4 (High Quality)' : 'GPT-4-mini (Standard)' }}</p>
                                <p><strong>Generation Time:</strong> ~{{ Math.ceil(questionCount / 2) }} minutes</p>
                                <div v-if="store.state.subscriptionTier === 'pro'" class="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-purple-800">
                                    <i class="fas fa-crown mr-1"></i>
                                    <strong>Pro Benefits:</strong> Higher quality questions, faster generation, priority processing
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Practice Existing Questions -->
                <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-play text-white text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-2">Practice Existing Questions</h3>
                        <p class="text-gray-600">Review and practice with previously generated questions</p>
                    </div>

                    <!-- Existing Questions List -->
                    <div v-if="availableTopicsWithQuestions.length > 0">
                        <div class="space-y-4 mb-6">
                            <div
                                v-for="topic in displayedPracticeTopics"
                                :key="'practice-' + topic.id"
                                class="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-gray-50 to-white"
                            >
                                <div class="space-y-4">
                                    <!-- Topic Info -->
                                    <div class="flex items-center justify-between">
                                        <div class="flex-1">
                                            <h4 class="font-semibold text-gray-900">{{ topic.name }}</h4>
                                            <p class="text-sm text-gray-600">{{ topic.subjectName }}</p>
                                            <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                                <span>
                                                    <i class="fas fa-question-circle mr-1"></i>
                                                    {{ topic.questionCount }} questions
                                                </span>
                                                <span>
                                                    <i class="fas fa-file-alt mr-1"></i>
                                                    {{ topic.notesCount }} files
                                                </span>
                                                <span>
                                                    <i class="fas fa-clock mr-1"></i>
                                                    Last practiced {{ formatTimeAgo(topic.lastPracticed) }}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-lg font-bold text-primary-600">{{ topic.bestScore || 0 }}%</div>
                                            <div class="text-xs text-gray-500">Best Score</div>
                                        </div>
                                    </div>
                                    
                                    <!-- Practice Mode Selection -->
                                    <div class="flex space-x-2">
                                        <button @click="startPractice(topic)"
                                                class="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all duration-300 transform hover:scale-105">
                                            <i class="fas fa-play mr-2"></i>
                                            Classic Mode
                                        </button>
                                        <button @click="startGameshow(topic)"
                                                class="flex-1 bg-gradient-to-r from-yellow-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all duration-300 transform hover:scale-105">
                                            <i class="fas fa-trophy mr-2"></i>
                                            Gameshow Mode
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Show More / Show Less Button -->
                        <div class="flex flex-col sm:flex-row gap-3">
                            <button
                                v-if="availableTopicsWithQuestions.length > practiceTopicsLimit"
                                @click="toggleShowAllPracticeTopics"
                                class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <i :class="showAllPracticeTopics ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="mr-2"></i>
                                {{ showAllPracticeTopics ? 'Show Less' : 'Show All ' + availableTopicsWithQuestions.length + ' Topics' }}
                            </button>
                            
                            <!-- Browse All Topics Button -->
                            <button
                                @click="showBrowsePracticeTopics"
                                class="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <i class="fas fa-th-list mr-2"></i>
                                Browse by Subject
                            </button>
                        </div>
                    </div>

                    <!-- No Questions Available -->
                    <div v-else class="text-center py-8">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-question-circle text-gray-400 text-2xl"></i>
                        </div>
                        <h4 class="font-medium text-gray-900 mb-2">No Questions Available</h4>
                        <p class="text-gray-600 mb-4">Generate questions first to start practicing</p>
                        <div class="space-y-2 text-sm text-gray-500">
                            <p>1. Select a subject and topic</p>
                            <p>2. Upload study materials</p>
                            <p>3. Generate questions with AI</p>
                            <p>4. Start practicing!</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Statistics Overview -->
            <div v-if="practiceStats" class="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <i class="fas fa-chart-bar mr-3 text-primary-600"></i>
                    Practice Statistics
                    <span class="ml-3 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {{ store.state.subscriptionTier?.toUpperCase() || 'FREE' }}
                    </span>
                </h3>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div class="text-center p-4 bg-blue-50 rounded-lg">
                        <div class="text-2xl font-bold text-blue-600">{{ practiceStats.totalSessions || 0 }}</div>
                        <div class="text-sm text-gray-600">Sessions</div>
                        <div class="text-xs text-gray-500 mt-1">
                            {{ store.state.usage?.questions?.used || 0 }} questions used
                        </div>
                    </div>
                    
                    <div class="text-center p-4 bg-green-50 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">{{ practiceStats.averageScore || 0 }}%</div>
                        <div class="text-sm text-gray-600">Avg Score</div>
                        <div class="text-xs text-gray-500 mt-1">
                            {{ practiceStats.totalCorrect || 0 }}/{{ practiceStats.totalAnswered || 0 }} correct
                        </div>
                    </div>
                    
                    <div class="text-center p-4 bg-purple-50 rounded-lg">
                        <div class="text-2xl font-bold text-purple-600">{{ practiceStats.totalQuestions || 0 }}</div>
                        <div class="text-sm text-gray-600">Questions</div>
                        <div class="text-xs text-gray-500 mt-1">
                            {{ availableTopicsWithQuestions.length }} topics
                        </div>
                    </div>
                    
                    <div class="text-center p-4 bg-orange-50 rounded-lg">
                        <div class="text-2xl font-bold text-orange-600">{{ practiceStats.streak || 0 }}</div>
                        <div class="text-sm text-gray-600">Day Streak</div>
                        <div class="text-xs text-gray-500 mt-1">
                            {{ practiceStats.lastSession ? formatTimeAgo(practiceStats.lastSession) : 'Never' }}
                        </div>
                    </div>
                </div>
                
                <!-- Usage Breakdown -->
                <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">Questions This Month</span>
                            <span class="font-medium">{{ store.state.usage?.questions?.used || 0 }}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="h-2 rounded-full transition-all duration-300" 
                                 :class="questionsUsagePercentage > 90 ? 'bg-red-500' : questionsUsagePercentage > 80 ? 'bg-yellow-500' : 'bg-blue-500'"
                                 :style="{ width: questionsUsagePercentage + '%' }"></div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">Storage Used</span>
                            <span class="font-medium">{{ storageUsedMB }}MB</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                 :style="{ width: storageUsagePercentage + '%' }"></div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">Topics Created</span>
                            <span class="font-medium">{{ store.state.usage?.topics?.used || 0 }}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                                 :style="{ width: topicsUsagePercentage + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        
        // Form state
        const selectedSubject = Vue.ref('');
        const selectedTopic = Vue.ref('');
        const questionCount = Vue.ref(5);
        const availableTopics = Vue.ref([]);
        const availableTopicsWithQuestions = Vue.ref([]);
        const practiceStats = Vue.ref(null);
        
        // Practice topics display state
        const showAllPracticeTopics = Vue.ref(false);
        const practiceTopicsLimit = Vue.ref(8); // Show 8 topics by default instead of 5

        // Usage calculations
        const questionsUsagePercentage = Vue.computed(() => {
            const usage = store.state.usage?.questions;
            if (!usage) return 0;
            return Math.min(Math.max((usage.used / usage.limit) * 100, 0), 100);
        });

        const storageUsagePercentage = Vue.computed(() => {
            const usage = store.state.usage?.storage;
            if (!usage) return 0;
            return Math.min(Math.max((usage.used / usage.limit) * 100, 0), 100);
        });

        const topicsUsagePercentage = Vue.computed(() => {
            const usage = store.state.usage?.topics;
            if (!usage) return 0;
            return Math.min(Math.max((usage.used / usage.limit) * 100, 0), 100);
        });

        const storageUsedMB = Vue.computed(() => {
            return Math.round((store.state.usage?.storage?.used || 0) / (1024 * 1024));
        });

        const remainingQuestions = Vue.computed(() => {
            const usage = store.state.usage?.questions;
            if (!usage) return 50;
            return Math.max(0, usage.limit - usage.used);
        });

        const availableQuestionCounts = Vue.computed(() => {
            const maxCount = Math.min(remainingQuestions.value, store.state.subscriptionTier === 'pro' ? 20 : 10);
            const counts = [];
            for (let i = 1; i <= maxCount; i++) {
                counts.push(i);
            }
            return counts.length > 0 ? counts : [0];
        });

        const canGenerate = Vue.computed(() => {
            return !store.state.generating && 
                   selectedTopic.value && 
                   questionCount.value > 0 && 
                   questionCount.value <= remainingQuestions.value &&
                   remainingQuestions.value > 0;
        });

        const getGenerateButtonText = Vue.computed(() => {
            if (store.state.generating) return 'Generating Questions...';
            if (!selectedTopic.value) return 'Select a topic first';
            if (remainingQuestions.value === 0) return 'Question limit reached';
            if (questionCount.value > remainingQuestions.value) return 'Not enough questions remaining';
            return `Generate ${questionCount.value} Questions`;
        });

        // Available subjects with questions or notes
        const availableSubjects = Vue.computed(() => {
            return store.state.subjects.filter(subject => {
                // You could filter based on whether subjects have topics with notes
                return true;
            });
        });

        // Displayed practice topics (limited or all)
        const displayedPracticeTopics = Vue.computed(() => {
            if (showAllPracticeTopics.value) {
                return availableTopicsWithQuestions.value;
            }
            return availableTopicsWithQuestions.value.slice(0, practiceTopicsLimit.value);
        });

        // Load data
        const loadPracticeData = async () => {
            try {
                // Load topics with questions for practice
                const topicsWithQuestions = await window.api.getTopicsWithQuestions();
                availableTopicsWithQuestions.value = topicsWithQuestions.map(topic => ({
                    ...topic,
                    subjectName: store.getSubjectById(topic.subjectId)?.name || 'Unknown',
                    lastPracticed: topic.lastPracticeSession || 'Never'
                }));

                // Load practice statistics
                const stats = await window.api.getPracticeStats();
                practiceStats.value = stats;
            } catch (error) {
                console.error('Failed to load practice data:', error);
            }
        };

        const handleSubjectChange = async () => {
            selectedTopic.value = '';
            availableTopics.value = [];
            
            if (selectedSubject.value) {
                try {
                    const topics = await window.api.getTopics(selectedSubject.value.id);
                    // Only show topics that have notes
                    availableTopics.value = topics.filter(topic => topic.notesCount > 0);
                } catch (error) {
                    console.error('Failed to load topics:', error);
                    store.showNotification('Failed to load topics', 'error');
                }
            }
        };

        const generateQuestions = async () => {
            if (!canGenerate.value) return;
            
            try {
                store.setGenerating(true);
                
                const result = await window.api.generateQuestions(
                    selectedTopic.value.id,
                    questionCount.value,
                    selectedSubject.value,
                    selectedTopic.value
                );
                
                store.showNotification(`Generated ${result.length} questions successfully!`, 'success');
                
                // Update usage stats
                await store.loadUsageStats();
                
                // Reload practice data
                await loadPracticeData();
                
                // Auto-start practice with new questions
                if (result.length > 0) {
                    startPractice(selectedTopic.value);
                }
                
            } catch (error) {
                console.error('Question generation failed:', error);
                
                if (error.message.includes('limit')) {
                    store.showNotification('Generation failed: ' + error.message, 'error');
                } else {
                    store.showNotification('Failed to generate questions. Please try again.', 'error');
                }
            } finally {
                store.setGenerating(false);
            }
        };

        const startPractice = (topic) => {
            // Handle both field names for compatibility
            const subjectId = topic.subjectId || topic.subject_id;
            const subject = store.getSubjectById(subjectId);
            
            if (!subject) {
                console.error('Subject not found for topic:', topic);
                store.showNotification('Subject not found for this topic', 'error');
                return;
            }
            
            store.selectSubject(subject);
            store.selectTopic(topic);
            store.setCurrentView('practice-session');
        };

        const startGameshow = (topic) => {
            // Handle both field names for compatibility
            const subjectId = topic.subjectId || topic.subject_id;
            const subject = store.getSubjectById(subjectId);
            
            if (!subject) {
                console.error('Subject not found for topic:', topic);
                store.showNotification('Subject not found for this topic', 'error');
                return;
            }
            
            if (!topic.questionCount || topic.questionCount < 5) {
                store.showNotification('Gameshow mode requires at least 5 questions. Generate more questions first!', 'warning');
                return;
            }
            
            store.selectSubject(subject);
            store.selectTopic(topic);
            store.setCurrentView('practice-gameshow');
        };

        const showAllTopics = () => {
            store.setCurrentView('subjects');
        };

        const toggleShowAllPracticeTopics = () => {
            showAllPracticeTopics.value = !showAllPracticeTopics.value;
        };

        const showBrowsePracticeTopics = () => {
            store.setCurrentView('browse-practice');
        };

        const showUpgradeModal = () => {
            store.showNotification('Upgrade to Pro for 1500 questions/month, unlimited topics, and premium features! Contact support for Pro access.', 'info');
        };

        const formatTimeAgo = (dateString) => {
            if (!dateString || dateString === 'Never') return 'never';
            
            const now = new Date();
            const date = new Date(dateString);
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'today';
            if (diffDays === 1) return 'yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            return `${Math.floor(diffDays / 30)} months ago`;
        };

        // Load data on mount
        Vue.onMounted(async () => {
            await loadPracticeData();
        });

        return {
            store,
            selectedSubject,
            selectedTopic,
            questionCount,
            availableTopics,
            availableTopicsWithQuestions,
            practiceStats,
            questionsUsagePercentage,
            storageUsagePercentage,
            topicsUsagePercentage,
            storageUsedMB,
            remainingQuestions,
            availableQuestionCounts,
            canGenerate,
            getGenerateButtonText,
            availableSubjects,
            // Practice topics display
            showAllPracticeTopics,
            practiceTopicsLimit,
            displayedPracticeTopics,
            toggleShowAllPracticeTopics,
            showBrowsePracticeTopics,
            // Methods
            handleSubjectChange,
            generateQuestions,
            startPractice,
            startGameshow,
            showAllTopics,
            showUpgradeModal,
            formatTimeAgo
        };
    }
};