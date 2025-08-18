// src/server/services/question-type-manager.js
// Manages distribution of question types (MCQ vs Text-based) per subject

class QuestionTypeManager {
    constructor() {
        console.log('📊 QuestionTypeManager initialized');
    }

    /**
     * Get optimal question type distribution for each subject
     */
    getSubjectQuestionDistribution(subject, totalQuestions = 5) {
        const distributions = {
            // Math: Mostly MCQ for calculations, some text for explanations
            'mathematics': {
                multipleChoice: Math.ceil(totalQuestions * 0.7), // 70% MCQ
                textBased: Math.floor(totalQuestions * 0.3),     // 30% text
                reasoning: 'Math benefits from MCQ for calculations and text for explanations'
            },

            // Literature: Balanced, favoring text for analysis
            'literature': {
                multipleChoice: Math.floor(totalQuestions * 0.4), // 40% MCQ
                textBased: Math.ceil(totalQuestions * 0.6),       // 60% text
                reasoning: 'Literature requires open-ended analysis and interpretation'
            },

            // Science: Balanced between concepts and explanations
            'natural-sciences': {
                multipleChoice: Math.ceil(totalQuestions * 0.6),  // 60% MCQ
                textBased: Math.floor(totalQuestions * 0.4),      // 40% text
                reasoning: 'Science needs both factual recall and process explanation'
            },

            // History: Favoring text for analysis and interpretation
            'history': {
                multipleChoice: Math.floor(totalQuestions * 0.4), // 40% MCQ
                textBased: Math.ceil(totalQuestions * 0.6),       // 60% text
                reasoning: 'History requires analysis of causes, effects, and significance'
            },

            // Computer Science: Mostly MCQ for syntax, some text for concepts
            'computer-science': {
                multipleChoice: Math.ceil(totalQuestions * 0.8),  // 80% MCQ
                textBased: Math.floor(totalQuestions * 0.2),      // 20% text
                reasoning: 'CS benefits from MCQ for syntax/facts and text for algorithm explanation'
            },

            // Languages: Balanced for grammar and comprehension
            'languages': {
                multipleChoice: Math.ceil(totalQuestions * 0.6),  // 60% MCQ
                textBased: Math.floor(totalQuestions * 0.4),      // 40% text
                reasoning: 'Languages need both structured practice and open expression'
            },

            // Business: Balanced for concepts and application
            'business': {
                multipleChoice: Math.ceil(totalQuestions * 0.5),  // 50% MCQ
                textBased: Math.floor(totalQuestions * 0.5),      // 50% text
                reasoning: 'Business requires both factual knowledge and strategic thinking'
            },

            // Arts: Heavily favoring text for interpretation
            'arts': {
                multipleChoice: Math.floor(totalQuestions * 0.3), // 30% MCQ
                textBased: Math.ceil(totalQuestions * 0.7),       // 70% text
                reasoning: 'Arts emphasize creative interpretation and personal analysis'
            },

            // Health/Medicine: Mostly MCQ for accuracy, some text for reasoning
            'health-medicine': {
                multipleChoice: Math.ceil(totalQuestions * 0.8),  // 80% MCQ
                textBased: Math.floor(totalQuestions * 0.2),      // 20% text
                reasoning: 'Health requires high accuracy; MCQ better for medical facts'
            }
        };

        // Default distribution for unknown subjects
        const defaultDistribution = {
            multipleChoice: Math.ceil(totalQuestions * 0.6),  // 60% MCQ
            textBased: Math.floor(totalQuestions * 0.4),      // 40% text
            reasoning: 'Balanced approach for general subjects'
        };

        const distribution = distributions[subject] || defaultDistribution;
        
        // Ensure totals add up correctly
        const actualTotal = distribution.multipleChoice + distribution.textBased;
        if (actualTotal !== totalQuestions) {
            // Adjust text-based to make total correct
            distribution.textBased = totalQuestions - distribution.multipleChoice;
        }

        console.log(`📊 Question distribution for ${subject}:`, distribution);
        return distribution;
    }

    /**
     * Generate a randomized sequence of question types
     */
    generateQuestionTypeSequence(subject, totalQuestions = 5) {
        const distribution = this.getSubjectQuestionDistribution(subject, totalQuestions);
        
        // Create array with the right number of each type
        const sequence = [];
        
        // Add MCQ questions
        for (let i = 0; i < distribution.multipleChoice; i++) {
            sequence.push('multiple_choice');
        }
        
        // Add text-based questions
        for (let i = 0; i < distribution.textBased; i++) {
            sequence.push('text_based');
        }
        
        // Shuffle the sequence for randomization
        this.shuffleArray(sequence);
        
        console.log(`🎲 Generated question sequence for ${subject}:`, sequence);
        return sequence;
    }

    /**
     * Get question type preferences for a specific subject
     */
    getSubjectQuestionTypePreferences(subject) {
        const preferences = {
            'mathematics': {
                mcqTypes: ['calculation', 'formula_application', 'concept_identification'],
                textTypes: ['problem_solving_explanation', 'proof_steps', 'real_world_application'],
                avoidInText: ['pure_calculation'], // These should be MCQ
                encourageInText: ['explanation', 'reasoning', 'interpretation']
            },
            
            'literature': {
                mcqTypes: ['character_identification', 'plot_sequence', 'literary_device_recognition'],
                textTypes: ['theme_analysis', 'character_motivation', 'symbolism_interpretation', 'personal_response'],
                avoidInText: ['factual_recall'], // Who wrote what, when
                encourageInText: ['analysis', 'interpretation', 'critical_thinking']
            },
            
            'natural-sciences': {
                mcqTypes: ['concept_identification', 'process_sequence', 'classification'],
                textTypes: ['process_explanation', 'hypothesis_formation', 'experimental_design'],
                avoidInText: ['simple_facts'],
                encourageInText: ['cause_effect', 'scientific_reasoning', 'application']
            },
            
            'history': {
                mcqTypes: ['date_identification', 'figure_recognition', 'event_sequence'],
                textTypes: ['causation_analysis', 'significance_evaluation', 'perspective_comparison'],
                avoidInText: ['memorization_facts'],
                encourageInText: ['analysis', 'evaluation', 'synthesis']
            },
            
            'computer-science': {
                mcqTypes: ['syntax_questions', 'concept_definitions', 'debugging_identification'],
                textTypes: ['algorithm_explanation', 'design_justification', 'problem_decomposition'],
                avoidInText: ['syntax_rules'],
                encourageInText: ['problem_solving', 'design_thinking', 'optimization']
            }
        };

        return preferences[subject] || {
            mcqTypes: ['concept_identification', 'factual_recall'],
            textTypes: ['explanation', 'analysis', 'application'],
            avoidInText: ['simple_facts'],
            encourageInText: ['critical_thinking', 'application']
        };
    }

    /**
     * Shuffle array in place using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Validate question type distribution
     */
    validateDistribution(distribution, totalQuestions) {
        const total = distribution.multipleChoice + distribution.textBased;
        if (total !== totalQuestions) {
            console.warn(`⚠️ Distribution total (${total}) doesn't match requested (${totalQuestions})`);
            return false;
        }
        return true;
    }

    /**
     * Get recommended question count per type for a subject
     */
    getRecommendedQuestionCounts(subject, totalQuestions = 5) {
        const distribution = this.getSubjectQuestionDistribution(subject, totalQuestions);
        
        return {
            multipleChoice: distribution.multipleChoice,
            textBased: distribution.textBased,
            total: totalQuestions,
            sequence: this.generateQuestionTypeSequence(subject, totalQuestions),
            reasoning: distribution.reasoning
        };
    }
}

module.exports = QuestionTypeManager;