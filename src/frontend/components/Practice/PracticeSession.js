// components/Practice/PracticeSession.js - Interactive Practice Session
window.PracticeSessionComponent = {
    template: `
    <div class="animate-fade-in max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">{{ selectedTopic?.name }}</h1>
                    <p class="text-gray-600">{{ getSubjectName(selectedTopic?.subject_id) }}</p>
                </div>
                <button 
                    @click="exitPractice"
                    class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <i class="fas fa-times mr-2"></i>Exit Practice
                </button>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                    class="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: progressPercentage + '%' }"
                ></div>
            </div>
            
            <div class="flex items-center justify-between text-sm text-gray-600">
                <span>Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</span>
                <span>{{ Math.round(progressPercentage) }}% Complete</span>
                <span>Score: {{ correctAnswers }}/{{ answeredQuestions }} ({{ scorePercentage }}%)</span>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Loading Questions...</h3>
            <p class="text-gray-600">Preparing your practice session</p>
        </div>

        <!-- No Questions -->
        <div v-else-if="questions.length === 0" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-question-circle text-gray-400 text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No Questions Available</h3>
            <p class="text-gray-600 mb-4">This topic doesn't have any questions yet.</p>
            <button 
                @click="goToGenerate"
                class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
                Generate Questions
            </button>
        </div>

        <!-- Practice Complete -->
        <div v-else-if="practiceComplete" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div class="text-center mb-8">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                     :class="finalScore >= 80 ? 'bg-green-100' : finalScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'">
                    <i class="text-3xl"
                       :class="finalScore >= 80 ? 'fas fa-trophy text-green-600' : finalScore >= 60 ? 'fas fa-medal text-yellow-600' : 'fas fa-thumbs-up text-red-600'"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Practice Complete!</h2>
                <p class="text-gray-600">Great job working through the questions</p>
            </div>

            <!-- Results -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{{ correctAnswers }}/{{ questions.length }}</div>
                    <div class="text-sm text-gray-600">Correct Answers</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">{{ finalScore }}%</div>
                    <div class="text-sm text-gray-600">Final Score</div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">{{ Math.round(averageTime) }}s</div>
                    <div class="text-sm text-gray-600">Avg Time</div>
                </div>
            </div>

            <!-- Advertisement Placement -->
            <div class="mb-6">
                <AdComponent 
                    placement="practice_completion"
                    size="large"
                />
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                    @click="restartPractice"
                    class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    <i class="fas fa-redo mr-2"></i>Practice Again
                </button>
                <button 
                    @click="goToGenerate"
                    class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                    <i class="fas fa-magic mr-2"></i>Generate More Questions
                </button>
                <button 
                    @click="exitPractice"
                    class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <i class="fas fa-arrow-left mr-2"></i>Back to Practice
                </button>
            </div>
        </div>

        <!-- Current Question -->
        <div v-else-if="currentQuestion" class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div class="mb-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ currentQuestion.question }}</h2>
                
                <!-- Multiple Choice -->
                <div v-if="currentQuestion.type === 'multiple_choice' && currentQuestion.options" class="space-y-3">
                    <button
                        v-for="(option, index) in currentQuestion.options"
                        :key="index"
                        @click="selectAnswer(index)"
                        :disabled="answered"
                        class="w-full p-4 text-left border rounded-lg transition-all duration-200 hover:border-primary-300"
                        :class="getOptionClass(index)"
                    >
                        <span class="font-medium">{{ String.fromCharCode(65 + index) }}.</span>
                        {{ option }}
                    </button>
                </div>

                <!-- Short Answer -->
                <div v-else class="space-y-4">
                    <textarea
                        v-model="textAnswer"
                        @keyup.enter="submitTextAnswer"
                        :disabled="answered"
                        placeholder="Type your answer here..."
                        class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        rows="4"
                    ></textarea>
                    <button
                        @click="submitTextAnswer"
                        :disabled="answered || !textAnswer.trim()"
                        class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Submit Answer
                    </button>
                </div>
            </div>

            <!-- Answer Feedback -->
            <div v-if="answered" class="mb-6 p-4 rounded-lg" :class="isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
                <div class="flex items-center mb-2">
                    <i :class="isCorrect ? 'fas fa-check-circle text-green-600' : 'fas fa-times-circle text-red-600'" class="mr-2"></i>
                    <span class="font-medium" :class="isCorrect ? 'text-green-800' : 'text-red-800'">
                        {{ isCorrect ? 'Correct!' : 'Incorrect' }}
                    </span>
                    <!-- AI Confidence Badge -->
                    <span v-if="currentEvaluation && currentEvaluation.confidence" 
                          class="ml-2 px-2 py-1 text-xs rounded-full"
                          :class="currentEvaluation.confidence > 0.8 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'">
                        {{ Math.round(currentEvaluation.confidence * 100) }}% confidence
                    </span>
                </div>
                <div class="text-sm" :class="isCorrect ? 'text-green-700' : 'text-red-700'">
                    <p><strong>Correct Answer:</strong> {{ getCorrectAnswerText() }}</p>
                    
                    <!-- AI Feedback -->
                    <p v-if="currentEvaluation && currentEvaluation.feedback" class="mt-2">
                        <strong>AI Feedback:</strong> {{ currentEvaluation.feedback }}
                    </p>
                    
                    <!-- Explanation -->
                    <p v-if="currentQuestion.explanation" class="mt-2">
                        <strong>Explanation:</strong> {{ currentQuestion.explanation }}
                    </p>
                    
                    <!-- Detailed reasoning for incorrect answers -->
                    <div v-if="!isCorrect && currentEvaluation && currentEvaluation.reasoning" class="mt-3 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                        <p class="text-xs text-gray-600 font-medium">Why this was marked incorrect:</p>
                        <p class="text-xs text-gray-700 mt-1">{{ currentEvaluation.reasoning }}</p>
                    </div>
                </div>
            </div>

            <!-- Navigation -->
            <div class="flex justify-between items-center">
                <button
                    @click="previousQuestion"
                    :disabled="currentQuestionIndex === 0"
                    class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    <i class="fas fa-arrow-left mr-2"></i>Previous
                </button>

                <div class="text-sm text-gray-500">
                    Time: {{ Math.floor(questionTime / 60) }}:{{ String(questionTime % 60).padStart(2, '0') }}
                </div>

                <button
                    @click="nextQuestion"
                    :disabled="!answered"
                    class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {{ currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next' }}
                    <i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    </div>
    `,

    setup() {
        const store = window.store;
        
        // State
        const loading = Vue.ref(true);
        const questions = Vue.ref([]);
        const currentQuestionIndex = Vue.ref(0);
        const answers = Vue.ref([]);
        const answered = Vue.ref(false);
        const selectedAnswer = Vue.ref(null);
        const textAnswer = Vue.ref('');
        const isCorrect = Vue.ref(false);
        const practiceComplete = Vue.ref(false);
        const questionStartTime = Vue.ref(Date.now());
        const questionTime = Vue.ref(0);
        const timer = Vue.ref(null);
        const currentEvaluation = Vue.ref(null);

        // Computed
        const selectedTopic = Vue.computed(() => store.state.selectedTopic);
        const currentQuestion = Vue.computed(() => questions.value[currentQuestionIndex.value]);
        const progressPercentage = Vue.computed(() => 
            questions.value.length > 0 ? ((currentQuestionIndex.value + (answered.value ? 1 : 0)) / questions.value.length) * 100 : 0
        );
        const correctAnswers = Vue.computed(() => answers.value.filter(a => a.isCorrect).length);
        const answeredQuestions = Vue.computed(() => answers.value.length);
        const scorePercentage = Vue.computed(() => 
            answeredQuestions.value > 0 ? Math.round((correctAnswers.value / answeredQuestions.value) * 100) : 0
        );
        const finalScore = Vue.computed(() => 
            questions.value.length > 0 ? Math.round((correctAnswers.value / questions.value.length) * 100) : 0
        );
        const averageTime = Vue.computed(() => {
            const times = answers.value.map(a => a.timeSpent);
            return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        });

        // Methods
        const loadQuestions = async () => {
            if (!selectedTopic.value) {
                store.showNotification('No topic selected', 'error');
                store.setCurrentView('practice');
                return;
            }

            try {
                loading.value = true;
                const response = await window.api.getRandomQuestions(selectedTopic.value.id, 10);
                questions.value = response;
                
                if (questions.value.length === 0) {
                    store.showNotification('No questions available for this topic', 'warning');
                }
            } catch (error) {
                console.error('Failed to load questions:', error);
                store.showNotification('Failed to load questions', 'error');
            } finally {
                loading.value = false;
            }
        };

        const startQuestionTimer = () => {
            questionStartTime.value = Date.now();
            questionTime.value = 0;
            timer.value = setInterval(() => {
                questionTime.value = Math.floor((Date.now() - questionStartTime.value) / 1000);
            }, 1000);
        };

        const stopQuestionTimer = () => {
            if (timer.value) {
                clearInterval(timer.value);
                timer.value = null;
            }
        };

        const selectAnswer = (answerIndex) => {
            if (answered.value) return;
            
            selectedAnswer.value = answerIndex;
            checkAnswer(answerIndex);
        };

        const submitTextAnswer = async () => {
            if (!textAnswer.value.trim() || answered.value) return;
            
            // Show loading state while evaluating
            const originalButtonText = 'Submit Answer';
            
            try {
                // First check with the new AI-powered evaluation
                const userAnswer = textAnswer.value.trim();
                const correctAnswer = currentQuestion.value.answer;
                const question = currentQuestion.value.question;
                
                console.log('🧠 Evaluating answer with AI:', { userAnswer, correctAnswer, question });
                
                const evaluation = await window.api.evaluateTextAnswer(
                    userAnswer, 
                    correctAnswer, 
                    question,
                    getSubjectName(selectedTopic.value?.subject_id)?.toLowerCase() || 'general'
                );
                
                console.log('✅ AI Evaluation result:', evaluation);
                
                // Use the AI evaluation result
                checkAnswer(userAnswer, evaluation.isCorrect, evaluation);
                
            } catch (error) {
                console.warn('❌ AI evaluation failed, falling back to local evaluation:', error);
                
                // Fallback to improved local evaluation
                const isMatch = evaluateAnswerLocally(textAnswer.value.trim(), currentQuestion.value.answer);
                checkAnswer(textAnswer.value.trim(), isMatch);
            }
        };

        // Improved local evaluation as fallback
        const evaluateAnswerLocally = (userAnswer, correctAnswer) => {
            const userLower = userAnswer.toLowerCase();
            const correctLower = correctAnswer.toLowerCase();
            
            // 1. Exact match (case insensitive)
            if (userLower === correctLower) {
                return true;
            }
            
            // 2. Clean both answers and compare
            const cleanUserAnswer = userLower.replace(/[^\w\s]/g, ' ').replace(/\b(the|a|an|is|are|was|were|in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after|above|below|between|among|and|or|but|so|because|if|when|where|why|how)\b/g, '').replace(/\s+/g, ' ').trim();
            const cleanCorrectAnswer = correctLower.replace(/[^\w\s]/g, ' ').replace(/\b(the|a|an|is|are|was|were|in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after|above|below|between|among|and|or|but|so|because|if|when|where|why|how)\b/g, '').replace(/\s+/g, ' ').trim();
            
            if (cleanUserAnswer === cleanCorrectAnswer) {
                return true;
            }
            
            // 3. Bidirectional containment
            if (cleanUserAnswer.includes(cleanCorrectAnswer) || cleanCorrectAnswer.includes(cleanUserAnswer)) {
                return true;
            }
            
            // 4. Key terms matching
            const correctWords = cleanCorrectAnswer.split(' ').filter(word => word.length > 2);
            const userWords = cleanUserAnswer.split(' ');
            
            if (correctWords.length > 0) {
                const matches = correctWords.filter(word => 
                    userWords.some(userWord => 
                        userWord.includes(word) || word.includes(userWord) || 
                        calculateSimilarity(word, userWord) > 0.8
                    )
                );
                
                if (matches.length / correctWords.length > 0.7) {
                    return true;
                }
            }
            
            // 5. Overall similarity
            const similarity = calculateSimilarity(cleanUserAnswer, cleanCorrectAnswer);
            return similarity > 0.75;
        };

        // Simple similarity function using Levenshtein distance
        const calculateSimilarity = (str1, str2) => {
            const len1 = str1.length;
            const len2 = str2.length;
            const matrix = [];

            for (let i = 0; i <= len2; i++) {
                matrix[i] = [i];
            }

            for (let j = 0; j <= len1; j++) {
                matrix[0][j] = j;
            }

            for (let i = 1; i <= len2; i++) {
                for (let j = 1; j <= len1; j++) {
                    if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }

            const maxLen = Math.max(len1, len2);
            return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
        };

        const checkAnswer = (userAnswer, forceCorrect = null, evaluation = null) => {
            stopQuestionTimer();
            answered.value = true;
            
            let correct = false;
            if (forceCorrect !== null) {
                correct = forceCorrect;
            } else if (currentQuestion.value.type === 'multiple_choice') {
                correct = userAnswer === currentQuestion.value.correct_index;
            }
            
            isCorrect.value = correct;
            
            // Store evaluation details for feedback
            if (evaluation) {
                currentEvaluation.value = {
                    feedback: evaluation.feedback,
                    confidence: evaluation.confidence,
                    reasoning: evaluation.reasoning
                };
            } else {
                currentEvaluation.value = null;
            }
            
            // Record the answer
            answers.value[currentQuestionIndex.value] = {
                questionId: currentQuestion.value.id,
                userAnswer: currentQuestion.value.type === 'multiple_choice' ? userAnswer : textAnswer.value,
                isCorrect: correct,
                timeSpent: Math.floor((Date.now() - questionStartTime.value) / 1000),
                evaluation: evaluation
            };
        };

        const nextQuestion = () => {
            if (currentQuestionIndex.value === questions.value.length - 1) {
                completePractice();
            } else {
                currentQuestionIndex.value++;
                resetQuestion();
            }
        };

        const previousQuestion = () => {
            if (currentQuestionIndex.value > 0) {
                currentQuestionIndex.value--;
                resetQuestion();
            }
        };

        const resetQuestion = () => {
            const currentAnswer = answers.value[currentQuestionIndex.value];
            if (currentAnswer) {
                answered.value = true;
                selectedAnswer.value = currentAnswer.userAnswer;
                textAnswer.value = currentQuestion.value.type !== 'multiple_choice' ? currentAnswer.userAnswer : '';
                isCorrect.value = currentAnswer.isCorrect;
                currentEvaluation.value = currentAnswer.evaluation || null;
            } else {
                answered.value = false;
                selectedAnswer.value = null;
                textAnswer.value = '';
                isCorrect.value = false;
                currentEvaluation.value = null;
                startQuestionTimer();
            }
        };

        const completePractice = async () => {
            stopQuestionTimer();
            practiceComplete.value = true;
            
            try {
                // Record the practice session
                await window.api.recordPracticeSession(selectedTopic.value.id, answers.value);
                store.showNotification(`Practice complete! Score: ${finalScore.value}%`, 'success');
            } catch (error) {
                console.error('Failed to record practice session:', error);
                store.showNotification('Practice completed but failed to save results', 'warning');
            }
        };

        const restartPractice = () => {
            currentQuestionIndex.value = 0;
            answers.value = [];
            practiceComplete.value = false;
            resetQuestion();
        };

        const exitPractice = () => {
            stopQuestionTimer();
            store.setCurrentView('practice');
        };

        const goToGenerate = () => {
            stopQuestionTimer();
            store.setCurrentView('practice');
        };

        const getSubjectName = (subjectId) => {
            const subject = store.getSubjectById(subjectId);
            return subject ? subject.name : 'Unknown Subject';
        };

        const getOptionClass = (index) => {
            if (!answered.value) {
                return 'border-gray-300 hover:border-primary-300 hover:bg-primary-50';
            }
            
            if (index === currentQuestion.value.correct_index) {
                return 'border-green-500 bg-green-50 text-green-800';
            }
            
            if (index === selectedAnswer.value && !isCorrect.value) {
                return 'border-red-500 bg-red-50 text-red-800';
            }
            
            return 'border-gray-300 bg-gray-50 text-gray-600';
        };

        const getCorrectAnswerText = () => {
            if (currentQuestion.value.type === 'multiple_choice' && currentQuestion.value.options) {
                const correctOption = currentQuestion.value.options[currentQuestion.value.correct_index];
                return correctOption || currentQuestion.value.answer;
            }
            return currentQuestion.value.answer;
        };

        // Lifecycle
        Vue.onMounted(() => {
            loadQuestions();
        });

        Vue.onUnmounted(() => {
            stopQuestionTimer();
        });

        // Watch for question changes to start timer
        Vue.watch(currentQuestionIndex, () => {
            if (!answered.value) {
                startQuestionTimer();
            }
        });

        return {
            store,
            loading,
            questions,
            currentQuestion,
            currentQuestionIndex,
            answered,
            selectedAnswer,
            textAnswer,
            isCorrect,
            practiceComplete,
            questionTime,
            progressPercentage,
            correctAnswers,
            answeredQuestions,
            scorePercentage,
            finalScore,
            averageTime,
            selectedTopic,
            currentEvaluation,
            selectAnswer,
            submitTextAnswer,
            nextQuestion,
            previousQuestion,
            restartPractice,
            exitPractice,
            goToGenerate,
            getSubjectName,
            getOptionClass,
            getCorrectAnswerText
        };
    }
};