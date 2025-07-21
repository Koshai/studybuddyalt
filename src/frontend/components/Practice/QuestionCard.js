// components/Practice/QuestionCard.js - IMPROVED with multiple choice and better evaluation
window.QuestionCard = {
    template: `
    <div class="content-card p-8">
        <!-- Question Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {{ store.state.currentQuestionIndex + 1 }}
                </div>
                <div>
                    <h3 class="font-semibold text-gray-900">Question {{ store.state.currentQuestionIndex + 1 }} of {{ store.state.questions.length }}</h3>
                    <p class="text-sm text-gray-600">{{ store.state.selectedTopic?.name }}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span :class="getDifficultyClass(currentQuestion?.difficulty)" class="px-3 py-1 rounded-full text-xs font-medium">
                    {{ currentQuestion?.difficulty || 'medium' }}
                </span>
                <div class="flex space-x-1">
                    <div v-for="i in store.state.questions.length" :key="i" 
                         :class="[
                             'w-3 h-3 rounded-full transition-colors',
                             i <= store.state.currentQuestionIndex + 1 ? 'bg-primary-500' : 'bg-gray-300'
                         ]">
                    </div>
                </div>
            </div>
        </div>

        <!-- Question Content -->
        <div class="mb-8">
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <i class="fas fa-question text-white text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-medium text-blue-900 mb-2">Question:</h4>
                        <p class="text-lg text-blue-800 leading-relaxed">{{ currentQuestion?.question }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Answer Format Toggle -->
        <div class="mb-6">
            <div class="flex items-center space-x-4 mb-4">
                <label class="text-sm font-medium text-gray-700">Answer Format:</label>
                <div class="flex space-x-2">
                    <button
                        @click="answerFormat = 'text'"
                        :class="[
                            'px-3 py-1 rounded-full text-sm transition-colors',
                            answerFormat === 'text' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        ]"
                    >
                        <i class="fas fa-edit mr-1"></i>Written Answer
                    </button>
                    <button
                        @click="generateMultipleChoice"
                        :disabled="answerFormat === 'multiple' && multipleChoiceOptions.length > 0"
                        :class="[
                            'px-3 py-1 rounded-full text-sm transition-colors',
                            answerFormat === 'multiple' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        ]"
                    >
                        <i class="fas fa-list mr-1"></i>Multiple Choice
                    </button>
                </div>
            </div>

            <!-- Text Answer Input -->
            <div v-if="answerFormat === 'text'">
                <label class="block text-sm font-medium text-gray-700 mb-3">Your Answer</label>
                <textarea
                    v-model="store.state.userAnswer"
                    :disabled="store.state.showAnswer"
                    class="form-input w-full px-4 py-3 rounded-lg resize-none focus:outline-none"
                    rows="4"
                    placeholder="Type your answer here..."
                ></textarea>
            </div>

            <!-- Multiple Choice Options -->
            <div v-else-if="answerFormat === 'multiple'" class="space-y-3">
                <label class="block text-sm font-medium text-gray-700 mb-3">Choose the best answer:</label>
                <div v-if="multipleChoiceOptions.length === 0" class="text-center py-4">
                    <div class="w-8 h-8 bg-primary-500 rounded-full mx-auto mb-2 animate-pulse"></div>
                    <p class="text-gray-600 text-sm">Generating options...</p>
                </div>
                <div v-else class="space-y-3">
                    <button
                        v-for="(option, index) in multipleChoiceOptions"
                        :key="index"
                        @click="selectMultipleChoice(index)"
                        :disabled="store.state.showAnswer"
                        :class="[
                            'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
                            selectedChoice === index 
                                ? 'border-primary-500 bg-primary-50' 
                                : 'border-gray-200 hover:border-gray-300 bg-white',
                            store.state.showAnswer && getOptionResultClass(index, option.isCorrect)
                        ]"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <span class="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                                    {{ String.fromCharCode(65 + index) }}
                                </span>
                                <span>{{ option.text }}</span>
                            </div>
                            <div v-if="store.state.showAnswer" class="flex items-center">
                                <i v-if="option.isCorrect" class="fas fa-check text-green-600"></i>
                                <i v-else-if="selectedChoice === index" class="fas fa-times text-red-600"></i>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-4 mb-6">
            <button
                v-if="!store.state.showAnswer"
                @click="checkAnswer"
                :disabled="!canSubmitAnswer"
                class="btn-gradient text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <i class="fas fa-check mr-2"></i>
                Check Answer
            </button>
            
            <button
                v-else
                @click="nextQuestion"
                class="bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
                <i class="fas fa-arrow-right mr-2"></i>
                {{ store.state.currentQuestionIndex < store.state.questions.length - 1 ? 'Next Question' : 'Finish Practice' }}
            </button>

            <button
                v-if="!store.state.showAnswer"
                @click="skipQuestion"
                class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
                <i class="fas fa-forward mr-2"></i>
                Skip Question
            </button>
        </div>

        <!-- Answer Feedback -->
        <div v-if="store.state.showAnswer" class="space-y-4">
            <!-- Result Badge -->
            <div class="flex items-center justify-center mb-4">
                <div :class="[
                    'px-6 py-3 rounded-full font-bold text-lg flex items-center space-x-2',
                    lastAnswerCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                ]">
                    <i :class="lastAnswerCorrect ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                    <span>{{ lastAnswerCorrect ? 'Correct!' : 'Incorrect' }}</span>
                </div>
            </div>

            <!-- Correct Answer -->
            <div class="bg-green-50 border border-green-200 rounded-xl p-6">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-lightbulb text-white text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-green-900">Correct Answer</h4>
                </div>
                <p class="text-green-800 leading-relaxed">{{ currentQuestion?.answer }}</p>
            </div>

            <!-- Answer Analysis (for text answers) -->
            <div v-if="answerFormat === 'text' && answerAnalysis" class="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-chart-line text-white text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-blue-900">Answer Analysis</h4>
                </div>
                <div class="space-y-2">
                    <p class="text-blue-800"><strong>Similarity Score:</strong> {{ answerAnalysis.score }}%</p>
                    <p class="text-blue-800"><strong>Feedback:</strong> {{ answerAnalysis.feedback }}</p>
                    <div v-if="answerAnalysis.keywordMatches.length > 0" class="text-blue-800">
                        <strong>Key concepts mentioned:</strong>
                        <span v-for="keyword in answerAnalysis.keywordMatches" :key="keyword" 
                              class="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs ml-1">
                            {{ keyword }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        const answerFormat = Vue.ref('multiple'); // Default to multiple choice
        const multipleChoiceOptions = Vue.ref([]);
        const selectedChoice = Vue.ref(null);
        const lastAnswerCorrect = Vue.ref(false);
        const answerAnalysis = Vue.ref(null);

        const currentQuestion = Vue.computed(() => {
            console.log('Current question computed:', store.currentQuestion);
            console.log('Store state - questions:', store.state.questions.length);
            console.log('Store state - current index:', store.state.currentQuestionIndex);
            console.log('Store state - practice started:', store.state.practiceStarted);
            return store.currentQuestion;
        });

        const canSubmitAnswer = Vue.computed(() => {
            if (answerFormat.value === 'text') {
                return store.state.userAnswer.trim().length > 0;
            } else {
                return selectedChoice.value !== null;
            }
        });

        const generateMultipleChoice = () => {
            answerFormat.value = 'multiple';
            if (multipleChoiceOptions.value.length > 0) return;

            // Generate 4 options: 1 correct + 3 distractors
            const correctAnswer = currentQuestion.value?.answer || '';
            
            // Simple distractor generation (in a real app, you'd use AI for this)
            const distractors = generateDistractors(correctAnswer);
            
            const options = [
                { text: correctAnswer, isCorrect: true },
                ...distractors.map(text => ({ text, isCorrect: false }))
            ];

            // Shuffle options
            multipleChoiceOptions.value = shuffleArray(options);
        };

        const generateDistractors = (correctAnswer) => {
            // Simple distractor generation - in a real app, use AI
            const words = correctAnswer.split(' ');
            const distractors = [];

            // Create variations by changing key words
            if (words.length > 1) {
                distractors.push(words.slice(0, -1).join(' ') + ' and other factors');
                distractors.push('The opposite of ' + correctAnswer.toLowerCase());
                distractors.push(words.reverse().join(' '));
            } else {
                distractors.push('Not ' + correctAnswer);
                distractors.push(correctAnswer + ' theory');
                distractors.push('Alternative to ' + correctAnswer);
            }

            return distractors.slice(0, 3);
        };

        const shuffleArray = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };

        const selectMultipleChoice = (index) => {
            if (!store.state.showAnswer) {
                selectedChoice.value = index;
            }
        };

        const checkAnswer = async () => {
            let isCorrect = false;

            if (answerFormat.value === 'multiple') {
                isCorrect = multipleChoiceOptions.value[selectedChoice.value]?.isCorrect || false;
            } else {
                // Advanced text answer checking
                const analysis = await analyzeTextAnswer(
                    store.state.userAnswer,
                    currentQuestion.value?.answer || ''
                );
                answerAnalysis.value = analysis;
                isCorrect = analysis.score >= 70; // 70% similarity threshold
            }

            lastAnswerCorrect.value = isCorrect;
            store.submitAnswer(isCorrect);
        };

        const analyzeTextAnswer = async (userAnswer, correctAnswer) => {
            const userWords = userAnswer.toLowerCase().split(/\s+/);
            const correctWords = correctAnswer.toLowerCase().split(/\s+/);
            
            // Find keyword matches
            const keywordMatches = userWords.filter(word => 
                word.length > 3 && correctWords.includes(word)
            );

            // Calculate similarity score
            const score = Math.min(100, (keywordMatches.length / Math.max(correctWords.length * 0.5, 1)) * 100);

            // Generate feedback
            let feedback = '';
            if (score >= 90) {
                feedback = 'Excellent! Your answer covers all key points.';
            } else if (score >= 70) {
                feedback = 'Good answer! You mentioned most important concepts.';
            } else if (score >= 50) {
                feedback = 'Partially correct. You got some key points but missed others.';
            } else {
                feedback = 'Your answer needs improvement. Review the correct answer carefully.';
            }

            return { score: Math.round(score), feedback, keywordMatches };
        };

        const nextQuestion = () => {
            // Reset state for next question
            selectedChoice.value = null;
            multipleChoiceOptions.value = [];
            answerAnalysis.value = null;
            store.nextQuestion();
        };

        const skipQuestion = () => {
            store.submitAnswer(false); // Mark as incorrect
            lastAnswerCorrect.value = false;
        };

        const getDifficultyClass = (difficulty) => {
            const classes = {
                'easy': 'bg-green-100 text-green-700',
                'medium': 'bg-yellow-100 text-yellow-700',
                'hard': 'bg-red-100 text-red-700'
            };
            return classes[difficulty] || classes.medium;
        };

        const getOptionResultClass = (index, isCorrect) => {
            if (isCorrect) {
                return 'border-green-500 bg-green-50';
            } else if (selectedChoice.value === index) {
                return 'border-red-500 bg-red-50';
            }
            return '';
        };

        // Auto-generate multiple choice when question changes
        Vue.watch(currentQuestion, () => {
            if (currentQuestion.value && answerFormat.value === 'multiple') {
                Vue.nextTick(() => {
                    generateMultipleChoice();
                });
            }
        }, { immediate: true });

        return {
            store,
            currentQuestion,
            answerFormat,
            multipleChoiceOptions,
            selectedChoice,
            lastAnswerCorrect,
            answerAnalysis,
            canSubmitAnswer,
            generateMultipleChoice,
            selectMultipleChoice,
            checkAnswer,
            nextQuestion,
            skipQuestion,
            getDifficultyClass,
            getOptionResultClass
        };
    }
};