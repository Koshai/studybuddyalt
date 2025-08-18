// components/Practice/GameshowPractice.js - TV Gameshow Style Practice
window.GameshowPracticeComponent = {
    template: `
    <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <!-- TV Studio Background -->
        <div class="absolute inset-0">
            <!-- Spotlights -->
            <div class="absolute top-10 left-1/4 w-32 h-32 bg-yellow-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
            <div class="absolute top-20 right-1/4 w-24 h-24 bg-pink-300 rounded-full opacity-20 blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
            
            <!-- Audience Silhouettes -->
            <div class="absolute bottom-0 left-0 right-0 h-32 bg-black opacity-30">
                <div class="flex justify-center items-end h-full space-x-2 px-8">
                    <div v-for="n in 20" :key="n" class="bg-gray-800 rounded-t-full animate-bounce" 
                         :style="{
                             width: Math.random() * 20 + 10 + 'px',
                             height: Math.random() * 60 + 40 + 'px',
                             animationDelay: Math.random() * 2 + 's',
                             animationDuration: (Math.random() * 1 + 1.5) + 's'
                         }">
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Game Area -->
        <div class="relative z-10 container mx-auto px-4 py-8">
            <!-- Game Header -->
            <div class="text-center mb-8">
                <h1 class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-4 animate-pulse">
                    {{ gameMode.title }}
                </h1>
                <div class="flex justify-center items-center space-x-8 text-white">
                    <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div class="text-2xl font-bold text-yellow-400">{{ currentScore.toLocaleString() }}</div>
                        <div class="text-sm opacity-80">POINTS</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div class="text-2xl font-bold text-green-400">{{ currentStreak }}</div>
                        <div class="text-sm opacity-80">STREAK</div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div class="text-2xl font-bold text-blue-400">{{ Math.round(accuracyPercentage) }}%</div>
                        <div class="text-sm opacity-80">ACCURACY</div>
                    </div>
                </div>
            </div>

            <!-- Game Mode Selection -->
            <div v-if="!gameStarted && !gameComplete" class="max-w-4xl mx-auto">
                <h2 class="text-3xl font-bold text-white text-center mb-8">Choose Your Challenge!</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div v-for="mode in gameModes" :key="mode.id" 
                         @click="startGame(mode)"
                         class="group cursor-pointer transform hover:scale-105 transition-all duration-300">
                        <div class="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:border-yellow-400/50 hover:shadow-2xl hover:shadow-yellow-400/20">
                            <div class="text-center">
                                <div class="text-6xl mb-4">{{ mode.icon }}</div>
                                <h3 class="text-2xl font-bold text-white mb-2">{{ mode.title }}</h3>
                                <p class="text-white/80 mb-4">{{ mode.description }}</p>
                                <div class="flex justify-center space-x-2 text-sm">
                                    <span class="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full">{{ mode.duration }}</span>
                                    <span class="bg-purple-400/20 text-purple-400 px-3 py-1 rounded-full">{{ mode.difficulty }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Game In Progress -->
            <div v-if="gameStarted && !gameComplete && currentQuestion" class="max-w-4xl mx-auto">
                <!-- Progress & Timer -->
                <div class="mb-8">
                    <div class="flex justify-between items-center mb-4">
                        <div class="text-white text-lg">
                            Question {{ currentQuestionIndex + 1 }} of {{ totalQuestions }}
                        </div>
                        <div v-if="showTimer" class="text-right">
                            <div class="text-3xl font-bold" :class="timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-yellow-400'">
                                {{ timeLeft }}s
                            </div>
                            <div class="text-sm text-white/70">Time Left</div>
                        </div>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full transition-all duration-500 relative"
                             :style="{ width: ((currentQuestionIndex + 1) / totalQuestions * 100) + '%' }">
                            <div class="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <!-- Question Card -->
                <div class="bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md rounded-3xl p-8 shadow-2xl mb-8 border border-white/30">
                    <!-- Question -->
                    <div class="text-center mb-8">
                        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-relaxed">
                            {{ currentQuestion.question }}
                        </h2>
                        
                        <!-- Question Type Badge -->
                        <div class="inline-flex items-center bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                            <i class="fas fa-question-circle mr-2"></i>
                            {{ currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'Fill in the Blank' }}
                        </div>
                    </div>

                    <!-- Multiple Choice Options -->
                    <div v-if="currentQuestion.type === 'multiple_choice' && currentQuestion.options" class="space-y-4">
                        <button v-for="(option, index) in currentQuestion.options" 
                                :key="index"
                                @click="selectAnswer(index)"
                                :disabled="answered"
                                class="w-full text-left p-6 rounded-xl transition-all duration-300 transform hover:scale-102 relative overflow-hidden group"
                                :class="getOptionClass(index)">
                            
                            <!-- Option Background Effect -->
                            <div class="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                                 :class="{
                                     'from-blue-400 to-purple-500': !answered,
                                     'from-green-400 to-green-600': answered && index === correctAnswerIndex,
                                     'from-red-400 to-red-600': answered && index === selectedAnswerIndex && selectedAnswerIndex !== correctAnswerIndex
                                 }">
                            </div>
                            
                            <!-- Option Content -->
                            <div class="relative flex items-center space-x-4">
                                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
                                     :class="{
                                         'bg-gray-200 text-gray-700': !answered,
                                         'bg-green-500 text-white': answered && index === correctAnswerIndex,
                                         'bg-red-500 text-white': answered && index === selectedAnswerIndex && selectedAnswerIndex !== correctAnswerIndex,
                                         'bg-gray-300 text-gray-600': answered && index !== correctAnswerIndex && index !== selectedAnswerIndex
                                     }">
                                    {{ String.fromCharCode(65 + index) }}
                                </div>
                                <div class="flex-1 text-lg font-medium">{{ option }}</div>
                                
                                <!-- Answer Icons -->
                                <div v-if="answered" class="flex-shrink-0">
                                    <i v-if="index === correctAnswerIndex" class="fas fa-check-circle text-green-500 text-2xl animate-bounce"></i>
                                    <i v-else-if="index === selectedAnswerIndex && selectedAnswerIndex !== correctAnswerIndex" 
                                       class="fas fa-times-circle text-red-500 text-2xl animate-shake"></i>
                                </div>
                            </div>
                        </button>
                    </div>

                    <!-- Fill in the Blank -->
                    <div v-else-if="currentQuestion.type === 'fill_blank'" class="text-center">
                        <div class="mb-6">
                            <input v-model="blankAnswer" 
                                   @keyup.enter="submitBlankAnswer"
                                   :disabled="answered"
                                   placeholder="Type your answer..."
                                   class="text-xl font-medium bg-yellow-100 border-2 border-yellow-300 rounded-xl px-6 py-4 text-center focus:outline-none focus:ring-4 focus:ring-yellow-400/50 focus:border-yellow-500 transition-all duration-300"
                                   :class="{ 'bg-green-100 border-green-400': answered && blankCorrect, 'bg-red-100 border-red-400': answered && !blankCorrect }">
                        </div>
                        
                        <button v-if="!answered" 
                                @click="submitBlankAnswer"
                                :disabled="!blankAnswer.trim()"
                                class="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                            <i class="fas fa-paper-plane mr-2"></i>Submit Answer
                        </button>
                        
                        <div v-if="answered" class="mt-4">
                            <div v-if="blankCorrect" class="text-green-600 text-lg font-bold">
                                <i class="fas fa-check-circle mr-2"></i>Correct!
                            </div>
                            <div v-else class="text-red-600 text-lg font-bold">
                                <i class="fas fa-times-circle mr-2"></i>Correct answer: {{ currentQuestion.correct_answer || currentQuestion.answer }}
                            </div>
                        </div>
                    </div>

                    <!-- Answer Explanation -->
                    <div v-if="answered && currentQuestion.explanation" class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h4 class="font-semibold text-blue-900 mb-2">
                            <i class="fas fa-lightbulb mr-2"></i>Explanation:
                        </h4>
                        <p class="text-blue-800">{{ currentQuestion.explanation }}</p>
                    </div>

                    <!-- Next Button -->
                    <div v-if="answered" class="text-center mt-6">
                        <button @click="nextQuestion" 
                                class="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                            <i class="fas fa-arrow-right mr-2"></i>
                            {{ currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Game' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Game Complete -->
            <div v-if="gameComplete" class="max-w-4xl mx-auto text-center">
                <!-- Victory Animation -->
                <div class="mb-8">
                    <div class="text-8xl animate-bounce mb-4">🎉</div>
                    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500 mb-2">
                        GAME COMPLETE!
                    </h2>
                    <p class="text-xl text-white/80">{{ getCompletionMessage() }}</p>
                </div>

                <!-- Final Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-2xl p-6 border border-green-400/30">
                        <div class="text-3xl font-bold text-green-400 mb-2">{{ finalStats.score.toLocaleString() }}</div>
                        <div class="text-white/80">Total Points</div>
                    </div>
                    <div class="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-6 border border-blue-400/30">
                        <div class="text-3xl font-bold text-blue-400 mb-2">{{ finalStats.correct }}/{{ finalStats.total }}</div>
                        <div class="text-white/80">Correct Answers</div>
                    </div>
                    <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-purple-400/30">
                        <div class="text-3xl font-bold text-purple-400 mb-2">{{ Math.round(finalStats.accuracy) }}%</div>
                        <div class="text-white/80">Accuracy</div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button @click="playAgain" 
                            class="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                        <i class="fas fa-redo mr-2"></i>Play Again
                    </button>
                    <button @click="exitGame" 
                            class="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Practice
                    </button>
                </div>
            </div>
        </div>

        <!-- Confetti Animation -->
        <div v-if="showConfetti" class="fixed inset-0 pointer-events-none z-50">
            <div v-for="n in 50" :key="n" 
                 class="absolute animate-bounce"
                 :style="{
                     left: Math.random() * 100 + '%',
                     animationDelay: Math.random() * 3 + 's',
                     animationDuration: (Math.random() * 2 + 1) + 's'
                 }">
                <div class="w-2 h-2 bg-yellow-400 transform rotate-45"></div>
            </div>
        </div>
    </div>
    `,

    props: {
        topic: Object,
        questions: Array
    },

    setup(props, { emit }) {
        const store = window.store;

        // Game State
        const gameStarted = Vue.ref(false);
        const gameComplete = Vue.ref(false);
        const currentGameMode = Vue.ref(null);
        const showConfetti = Vue.ref(false);

        // Question State  
        const currentQuestionIndex = Vue.ref(0);
        const currentQuestion = Vue.ref(null);
        const answered = Vue.ref(false);
        const selectedAnswerIndex = Vue.ref(null);
        const correctAnswerIndex = Vue.ref(null);
        const blankAnswer = Vue.ref('');
        const blankCorrect = Vue.ref(false);

        // Game Stats
        const currentScore = Vue.ref(0);
        const currentStreak = Vue.ref(0);
        const maxStreak = Vue.ref(0);
        const correctAnswers = Vue.ref(0);
        const totalAnswered = Vue.ref(0);

        // Timer
        const timeLeft = Vue.ref(0);
        const timer = Vue.ref(null);
        const showTimer = Vue.computed(() => currentGameMode.value?.hasTimer);

        // Game Modes
        const gameModes = Vue.ref([
            {
                id: 'rapid_fire',
                title: 'Brain Buster',
                icon: '⚡',
                description: 'Answer as many questions as possible in 60 seconds!',
                duration: '60 seconds',
                difficulty: 'Fast',
                hasTimer: true,
                timeLimit: 60,
                questionsLimit: null
            },
            {
                id: 'millionaire',
                title: 'Million Dollar Scholar',
                icon: '💰',
                description: 'Climb the money ladder without getting one wrong!',
                duration: '15 questions',
                difficulty: 'High Stakes',
                hasTimer: false,
                timeLimit: null,
                questionsLimit: 15
            },
            {
                id: 'classic',
                title: 'Classic Challenge',
                icon: '🧠',
                description: 'Traditional quiz format with all your questions',
                duration: 'All questions',
                difficulty: 'Balanced',
                hasTimer: false,
                timeLimit: null,
                questionsLimit: null
            },
            {
                id: 'speed_round',
                title: 'Speed Round',
                icon: '🏃',
                description: '10 questions, 5 seconds each - think fast!',
                duration: '50 seconds',
                difficulty: 'Lightning',
                hasTimer: true,
                timeLimit: 5,
                questionsLimit: 10
            }
        ]);

        // Computed
        const gameMode = Vue.computed(() => currentGameMode.value || gameModes.value[0]);
        const totalQuestions = Vue.computed(() => {
            if (!gameMode.value.questionsLimit) return props.questions.length;
            return Math.min(gameMode.value.questionsLimit, props.questions.length);
        });
        const accuracyPercentage = Vue.computed(() => 
            totalAnswered.value > 0 ? (correctAnswers.value / totalAnswered.value) * 100 : 0
        );
        const finalStats = Vue.computed(() => ({
            score: currentScore.value,
            correct: correctAnswers.value,
            total: totalAnswered.value,
            accuracy: accuracyPercentage.value,
            maxStreak: maxStreak.value
        }));

        // Methods
        const startGame = (mode) => {
            currentGameMode.value = mode;
            gameStarted.value = true;
            currentQuestionIndex.value = 0;
            currentScore.value = 0;
            currentStreak.value = 0;
            maxStreak.value = 0;
            correctAnswers.value = 0;
            totalAnswered.value = 0;
            
            // Shuffle questions for variety
            const shuffledQuestions = [...props.questions].sort(() => Math.random() - 0.5);
            const gameQuestions = mode.questionsLimit ? 
                shuffledQuestions.slice(0, mode.questionsLimit) : shuffledQuestions;
            
            loadQuestion(gameQuestions[0]);
            
            // Start timer if needed
            if (mode.hasTimer) {
                startTimer();
            }
        };

        const loadQuestion = (question) => {
            currentQuestion.value = question;
            answered.value = false;
            selectedAnswerIndex.value = null;
            correctAnswerIndex.value = null;
            blankAnswer.value = '';
            blankCorrect.value = false;

            // Find correct answer index for multiple choice
            if (question.type === 'multiple_choice' && question.options) {
                const correctAnswer = question.correct_answer || question.answer;
                correctAnswerIndex.value = question.options.findIndex(option => 
                    option.toLowerCase() === correctAnswer.toLowerCase()
                );
            }

            // Set timer for speed rounds
            if (gameMode.value.id === 'speed_round') {
                timeLeft.value = 5;
                startQuestionTimer();
            }
        };

        const selectAnswer = (index) => {
            if (answered.value) return;
            
            selectedAnswerIndex.value = index;
            answered.value = true;
            totalAnswered.value++;
            
            const correct = index === correctAnswerIndex.value;
            processAnswer(correct);
        };

        const submitBlankAnswer = async () => {
            if (answered.value || !blankAnswer.value.trim()) return;
            
            answered.value = true;
            totalAnswered.value++;
            
            const correctAnswer = currentQuestion.value.correct_answer || currentQuestion.value.answer;
            
            try {
                // Use AI-powered evaluation for fill-in-the-blank answers too
                const evaluation = await window.api.evaluateTextAnswer(
                    blankAnswer.value.trim(),
                    correctAnswer,
                    currentQuestion.value.question,
                    'general' // Could be enhanced to detect subject from props
                );
                
                console.log('🎮 Gameshow AI evaluation:', evaluation);
                blankCorrect.value = evaluation.isCorrect;
                processAnswer(evaluation.isCorrect);
                
            } catch (error) {
                console.warn('❌ AI evaluation failed in gameshow, using basic comparison:', error);
                
                // Fallback to basic comparison
                const correct = blankAnswer.value.toLowerCase().trim() === 
                    correctAnswer.toLowerCase().trim();
                blankCorrect.value = correct;
                processAnswer(correct);
            }
        };

        const processAnswer = (correct) => {
            if (correct) {
                correctAnswers.value++;
                currentStreak.value++;
                maxStreak.value = Math.max(maxStreak.value, currentStreak.value);
                
                // Calculate points
                let points = 10; // Base points
                if (timeLeft.value > 7) points += 5; // Speed bonus
                if (currentStreak.value >= 5) points += 10; // Streak bonus
                if (totalAnswered.value === 1) points += 5; // First try bonus
                
                currentScore.value += points;
                
                // Celebration effects
                if (currentStreak.value === 5) {
                    triggerCelebration();
                }
            } else {
                currentStreak.value = 0;
            }
            
            // Play sound effects
            if (correct) {
                playSound('correct');
            } else {
                playSound('incorrect');
            }
            
            // Clear question timer
            if (timer.value) {
                clearInterval(timer.value);
                timer.value = null;
            }
        };

        const nextQuestion = () => {
            currentQuestionIndex.value++;
            
            if (currentQuestionIndex.value >= totalQuestions.value || 
                (gameMode.value.id === 'millionaire' && !answered.value && selectedAnswerIndex.value !== correctAnswerIndex.value)) {
                endGame();
                return;
            }
            
            const nextQ = props.questions[currentQuestionIndex.value];
            loadQuestion(nextQ);
        };

        const startTimer = () => {
            timeLeft.value = gameMode.value.timeLimit;
            timer.value = setInterval(() => {
                timeLeft.value--;
                if (timeLeft.value <= 0) {
                    endGame();
                }
            }, 1000);
        };

        const startQuestionTimer = () => {
            timer.value = setInterval(() => {
                timeLeft.value--;
                if (timeLeft.value <= 0) {
                    if (!answered.value) {
                        // Auto-submit wrong answer
                        answered.value = true;
                        totalAnswered.value++;
                        processAnswer(false);
                    }
                }
            }, 1000);
        };

        const endGame = () => {
            gameComplete.value = true;
            if (timer.value) {
                clearInterval(timer.value);
                timer.value = null;
            }
            
            // Trigger celebration
            triggerCelebration();
            playSound('victory');
        };

        const triggerCelebration = () => {
            showConfetti.value = true;
            setTimeout(() => {
                showConfetti.value = false;
            }, 3000);
        };

        const playSound = (type) => {
            // Simple audio feedback using Web Audio API
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                if (type === 'correct') {
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
                } else if (type === 'incorrect') {
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                } else if (type === 'victory') {
                    oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C
                    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E
                    oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G
                }
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } catch (error) {
                // Silently fail if Web Audio API not supported
            }
        };

        const getOptionClass = (index) => {
            if (!answered.value) {
                return 'bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg';
            }
            
            if (index === correctAnswerIndex.value) {
                return 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400';
            }
            
            if (index === selectedAnswerIndex.value && selectedAnswerIndex.value !== correctAnswerIndex.value) {
                return 'bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-400';
            }
            
            return 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 opacity-60';
        };

        const getCompletionMessage = () => {
            const accuracy = accuracyPercentage.value;
            if (accuracy >= 90) return "OUTSTANDING! You're a true scholar! 🌟";
            if (accuracy >= 80) return "EXCELLENT! Great job mastering this topic! 👏";
            if (accuracy >= 70) return "GOOD WORK! You're getting there! 👍";
            if (accuracy >= 60) return "NICE TRY! Keep practicing to improve! 💪";
            return "KEEP LEARNING! Every question makes you smarter! 📚";
        };

        const playAgain = () => {
            gameStarted.value = false;
            gameComplete.value = false;
            currentGameMode.value = null;
        };

        const exitGame = () => {
            emit('exit-gameshow');
        };

        // Cleanup
        Vue.onUnmounted(() => {
            if (timer.value) {
                clearInterval(timer.value);
            }
        });

        return {
            gameStarted,
            gameComplete,
            gameModes,
            gameMode,
            currentQuestion,
            currentQuestionIndex,
            totalQuestions,
            answered,
            selectedAnswerIndex,
            correctAnswerIndex,
            blankAnswer,
            blankCorrect,
            currentScore,
            currentStreak,
            accuracyPercentage,
            finalStats,
            timeLeft,
            showTimer,
            showConfetti,
            startGame,
            selectAnswer,
            submitBlankAnswer,
            nextQuestion,
            getOptionClass,
            getCompletionMessage,
            playAgain,
            exitGame
        };
    }
};