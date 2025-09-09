// src/server/services/web-storage-service.js - Pure Supabase Storage for Web App
const { createClient } = require('@supabase/supabase-js');

class WebStorageService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        
        // Fixed subject categories - same as database service
        this.FIXED_SUBJECTS = [
            {
                id: 'mathematics',
                name: 'Mathematics',
                description: 'Algebra, Calculus, Statistics, Geometry, Arithmetic',
                icon: 'fas fa-calculator',
                color: 'bg-blue-500'
            },
            {
                id: 'natural-sciences',
                name: 'Natural Sciences', 
                description: 'Physics, Chemistry, Biology, Earth Science',
                icon: 'fas fa-atom',
                color: 'bg-green-500'
            },
            {
                id: 'literature',
                name: 'Literature & Writing',
                description: 'English, Creative Writing, Poetry, Drama, Reading',
                icon: 'fas fa-book-open',
                color: 'bg-purple-500'
            },
            {
                id: 'history',
                name: 'History & Social Studies',
                description: 'World History, Government, Geography, Economics',
                icon: 'fas fa-landmark',
                color: 'bg-amber-500'
            },
            {
                id: 'languages',
                name: 'Foreign Languages',
                description: 'Spanish, French, German, Chinese, Language Learning',
                icon: 'fas fa-language',
                color: 'bg-red-500'
            },
            {
                id: 'arts',
                name: 'Arts & Humanities',
                description: 'Art History, Music, Philosophy, Theater, Culture',
                icon: 'fas fa-palette',
                color: 'bg-pink-500'
            },
            {
                id: 'computer-science',
                name: 'Computer Science',
                description: 'Programming, Algorithms, Data Structures, Technology',
                icon: 'fas fa-code',
                color: 'bg-indigo-500'
            },
            {
                id: 'business',
                name: 'Business & Economics',
                description: 'Finance, Marketing, Management, Economics, Trade',
                icon: 'fas fa-chart-line',
                color: 'bg-emerald-500'
            },
            {
                id: 'health-medicine',
                name: 'Health & Medicine',
                description: 'Anatomy, Nursing, Public Health, Psychology, Wellness',
                icon: 'fas fa-heartbeat',
                color: 'bg-rose-500'
            },
            {
                id: 'other',
                name: 'General Studies',
                description: 'Engineering, Agriculture, Specialized fields, Miscellaneous',
                icon: 'fas fa-graduation-cap',
                color: 'bg-gray-500'
            }
        ];
        
        console.log('🌐 Web Storage Service initialized - Supabase only with fixed subjects');
    }

    // ===== SUBJECTS =====
    
    async getSubjects() {
        const { data, error } = await this.supabase
            .from('subjects')
            .select('*')
            .order('name');
            
        if (error) {
            console.error('❌ Error fetching subjects:', error);
            // Fallback to hardcoded subjects if Supabase query fails
            return [...this.FIXED_SUBJECTS];
        }
        return data;
    }

    async getSubjectById(subjectId) {
        const { data, error } = await this.supabase
            .from('subjects')
            .select('*')
            .eq('id', subjectId)
            .single();
            
        if (error) {
            console.error('❌ Error fetching subject:', error);
            // Fallback to hardcoded subject
            const subject = this.FIXED_SUBJECTS.find(s => s.id === subjectId);
            return subject || null;
        }
        return data;
    }

    // ===== TOPICS =====
    
    async createTopic(userId, subjectId, name, description) {
        const { data, error } = await this.supabase
            .from('topics')
            .insert({
                user_id: userId,
                subject_id: subjectId,
                name,
                description
            })
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async getTopicsForUser(userId, subjectId) {
        let query = this.supabase
            .from('topics')
            .select('*')
            .eq('user_id', userId);
            
        if (subjectId !== 'all') {
            query = query.eq('subject_id', subjectId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }

    async getTopicById(topicId) {
        const { data, error } = await this.supabase
            .from('topics')
            .select('*')
            .eq('id', topicId)
            .single();
            
        if (error) throw error;
        return data;
    }

    async updateTopic(topicId, userId, name, description) {
        const { data, error } = await this.supabase
            .from('topics')
            .update({ name, description, updated_at: new Date().toISOString() })
            .eq('id', topicId)
            .eq('user_id', userId)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async deleteTopic(topicId, userId) {
        // Delete related data first (cascade should handle this, but being explicit)
        await this.supabase.from('user_answers').delete()
            .in('question_id', 
                this.supabase.from('questions').select('id').eq('topic_id', topicId)
            );
            
        await this.supabase.from('practice_sessions').delete()
            .eq('topic_id', topicId).eq('user_id', userId);
            
        await this.supabase.from('questions').delete()
            .eq('topic_id', topicId);
            
        await this.supabase.from('notes').delete()
            .eq('topic_id', topicId);
            
        const { error } = await this.supabase
            .from('topics')
            .delete()
            .eq('id', topicId)
            .eq('user_id', userId);
            
        if (error) throw error;
        return { success: true };
    }

    // ===== NOTES =====
    
    async createNote(userId, topicId, content, fileName = null) {
        const { data, error } = await this.supabase
            .from('notes')
            .insert({
                topic_id: topicId,
                content,
                file_name: fileName,
                word_count: content.trim().split(/\s+/).length
            })
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async getNotesForUser(userId, topicId) {
        const { data, error } = await this.supabase
            .from('notes')
            .select(`
                *,
                topics!inner(
                    id,
                    name,
                    subject_id,
                    user_id,
                    subjects(id, name, icon, color)
                )
            `)
            .eq('topic_id', topicId)
            .eq('topics.user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Add subject information from the join
        return data.map(note => ({
            ...note,
            subject_id: note.topics.subject_id,
            topic_name: note.topics.name,
            subject_name: note.topics.subjects.name,
            subject: note.topics.subjects
        }));
    }

    // Add method to get all notes (needed by NotesDisplay component)
    async getAllNotes(userId) {
        return this.getAllNotesForUser(userId);
    }

    async updateNote(noteId, userId, content) {
        // First verify the note belongs to the user (via topic ownership)
        const { data: note } = await this.supabase
            .from('notes')
            .select(`
                id,
                topics!inner(
                    id,
                    user_id
                )
            `)
            .eq('id', noteId)
            .eq('topics.user_id', userId)
            .single();
        
        if (!note) {
            throw new Error('Note not found or access denied');
        }
        
        // Now update the note
        const { data, error } = await this.supabase
            .from('notes')
            .update({ 
                content, 
                word_count: content.trim().split(/\s+/).length,
                updated_at: new Date().toISOString()
            })
            .eq('id', noteId)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    async deleteNote(noteId, userId) {
        const { error } = await this.supabase
            .from('notes')
            .delete()
            .eq('id', noteId)
            .eq('topic_id', this.supabase
                .from('topics')
                .select('id')
                .eq('user_id', userId)
            );
            
        if (error) throw error;
        return { success: true };
    }

    // ===== QUESTIONS =====
    
    async createQuestion(userId, topicId, questionData) {
        const { data, error } = await this.supabase
            .from('questions')
            .insert({
                topic_id: topicId,
                note_id: questionData.noteId || null,
                question: questionData.question,
                answer: questionData.answer,
                type: questionData.type || 'multiple_choice',
                options: questionData.options ? JSON.stringify(questionData.options) : null,
                correct_index: questionData.correctIndex,
                explanation: questionData.explanation
            })
            .select()
            .single();
            
        if (error) throw error;
        return {
            ...data,
            options: data.options ? JSON.parse(data.options) : null
        };
    }

    async getQuestionsForUser(userId, topicId) {
        const { data, error } = await this.supabase
            .from('questions')
            .select(`
                *,
                topics!inner(user_id)
            `)
            .eq('topic_id', topicId)
            .eq('topics.user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        return data.map(q => {
            let options = null;
            if (q.options) {
                try {
                    options = JSON.parse(q.options);
                } catch (parseError) {
                    console.error('❌ Failed to parse question options:', parseError);
                    options = null;
                }
            }
            return {
                ...q,
                options: options
            };
        });
    }

    async getRandomQuestionsForUser(userId, topicId, count = 5) {
        // Supabase doesn't have RANDOM(), so we'll get all and shuffle in memory
        const { data, error } = await this.supabase
            .from('questions')
            .select(`
                *,
                topics!inner(user_id)
            `)
            .eq('topic_id', topicId)
            .eq('topics.user_id', userId);
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            return [];
        }
        
        // Shuffle and take count
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        
        return selected.map(q => {
            let options = null;
            if (q.options) {
                try {
                    options = JSON.parse(q.options);
                } catch (parseError) {
                    console.error('❌ Failed to parse question options:', parseError);
                    options = null;
                }
            }
            return {
                ...q,
                options: options
            };
        });
    }

    // ===== PRACTICE SESSIONS =====
    
    async recordPracticeSession(userId, topicId, questionsCount, correctAnswers) {
        const accuracyRate = questionsCount > 0 ? (correctAnswers / questionsCount) * 100 : 0;
        
        const { data, error } = await this.supabase
            .from('practice_sessions')
            .insert({
                user_id: userId,
                topic_id: topicId,
                questions_count: questionsCount,
                correct_answers: correctAnswers,
                accuracy_rate: accuracyRate
            })
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }

    // ===== STATISTICS =====
    
    async getDashboardStatsForUser(userId) {
        try {
            // First get the user's topic IDs
            const { data: topicIds, error: topicsError } = await this.supabase
                .from('topics')
                .select('id')
                .eq('user_id', userId);
                
            if (topicsError) throw topicsError;
            
            const topicIdArray = topicIds.map(t => t.id);
            
            // Now get stats using the topic IDs
            const [topics, questions, notes, sessions] = await Promise.all([
                this.supabase.from('topics').select('id', { count: 'exact' }).eq('user_id', userId),
                topicIdArray.length > 0 
                    ? this.supabase.from('questions').select('id', { count: 'exact' }).in('topic_id', topicIdArray)
                    : { count: 0 },
                topicIdArray.length > 0 
                    ? this.supabase.from('notes').select('id', { count: 'exact' }).in('topic_id', topicIdArray)
                    : { count: 0 },
                this.supabase.from('practice_sessions').select('accuracy_rate').eq('user_id', userId)
            ]);
            
            const avgAccuracy = sessions.data?.length > 0 
                ? sessions.data.reduce((sum, s) => sum + s.accuracy_rate, 0) / sessions.data.length
                : 0;
            
            return {
                total_topics: topics.count || 0,
                total_questions: questions.count || 0,
                total_notes: notes.count || 0,
                total_practice_sessions: sessions.data?.length || 0,
                overall_accuracy: Math.round(avgAccuracy)
            };
        } catch (error) {
            console.error('Dashboard stats error:', error);
            // Return zero stats on error
            return {
                total_topics: 0,
                total_questions: 0,
                total_notes: 0,
                total_practice_sessions: 0,
                overall_accuracy: 0
            };
        }
    }

    async getSubjectStatsForUser(userId) {
        try {
            console.log('📊 Getting subject stats for user:', userId);
            
            // Get all subjects first
            const subjects = await this.getSubjects();
            console.log('📋 Available subjects:', subjects.length);
            
            // Initialize result with all subjects at zero
            const subjectStats = subjects.map(subject => ({
                subject: subject,
                topic_count: 0,
                question_count: 0,
                note_count: 0,
                avg_accuracy: 0
            }));
            
            // Get user's topics with counts
            const { data: userTopics, error: topicsError } = await this.supabase
                .from('topics')
                .select('id, subject_id')
                .eq('user_id', userId);
                
            if (topicsError) throw topicsError;
            console.log('📝 User topics found:', userTopics.length);
            
            if (userTopics.length === 0) {
                return subjectStats; // Return all zeros if no topics
            }
            
            // Group topics by subject and count them
            const topicsBySubject = {};
            const allTopicIds = [];
            
            userTopics.forEach(topic => {
                if (!topicsBySubject[topic.subject_id]) {
                    topicsBySubject[topic.subject_id] = [];
                }
                topicsBySubject[topic.subject_id].push(topic.id);
                allTopicIds.push(topic.id);
            });
            
            // Get counts for questions and notes
            const [questionsResult, notesResult, sessionsResult] = await Promise.all([
                this.supabase
                    .from('questions')
                    .select('topic_id')
                    .in('topic_id', allTopicIds),
                this.supabase
                    .from('notes')
                    .select('topic_id')
                    .in('topic_id', allTopicIds),
                this.supabase
                    .from('practice_sessions')
                    .select('accuracy_rate, topic_id')
                    .eq('user_id', userId)
            ]);
            
            if (questionsResult.error) throw questionsResult.error;
            if (notesResult.error) throw notesResult.error;
            if (sessionsResult.error) throw sessionsResult.error;
            
            // Count questions and notes by subject
            const questionsBySubject = {};
            const notesBySubject = {};
            const sessionsBySubject = {};
            
            // Group questions by subject
            questionsResult.data.forEach(q => {
                const topic = userTopics.find(t => t.id === q.topic_id);
                if (topic) {
                    if (!questionsBySubject[topic.subject_id]) questionsBySubject[topic.subject_id] = 0;
                    questionsBySubject[topic.subject_id]++;
                }
            });
            
            // Group notes by subject
            notesResult.data.forEach(n => {
                const topic = userTopics.find(t => t.id === n.topic_id);
                if (topic) {
                    if (!notesBySubject[topic.subject_id]) notesBySubject[topic.subject_id] = 0;
                    notesBySubject[topic.subject_id]++;
                }
            });
            
            // Group sessions by subject for accuracy calculation
            sessionsResult.data.forEach(s => {
                const topic = userTopics.find(t => t.id === s.topic_id);
                if (topic) {
                    if (!sessionsBySubject[topic.subject_id]) sessionsBySubject[topic.subject_id] = [];
                    sessionsBySubject[topic.subject_id].push(s.accuracy_rate);
                }
            });
            
            // Update stats for each subject
            subjectStats.forEach(stat => {
                const subjectId = stat.subject.id;
                
                // Topic count
                stat.topic_count = topicsBySubject[subjectId] ? topicsBySubject[subjectId].length : 0;
                
                // Question count
                stat.question_count = questionsBySubject[subjectId] || 0;
                
                // Note count
                stat.note_count = notesBySubject[subjectId] || 0;
                
                // Average accuracy
                if (sessionsBySubject[subjectId] && sessionsBySubject[subjectId].length > 0) {
                    const accuracies = sessionsBySubject[subjectId];
                    stat.avg_accuracy = Math.round(accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length);
                }
            });
            
            console.log('📊 Subject stats calculated successfully');
            return subjectStats;
            
        } catch (error) {
            console.error('❌ Subject stats error:', error);
            // Fallback: get subjects and return zeros
            try {
                const subjects = await this.getSubjects();
                return subjects.map(subject => ({
                    subject: subject,
                    topic_count: 0,
                    question_count: 0,
                    note_count: 0,
                    avg_accuracy: 0
                }));
            } catch (fallbackError) {
                console.error('❌ Subject stats fallback error:', fallbackError);
                return [];
            }
        }
    }

    // ===== DATA EXPORT =====
    
    async exportDataForUser(userId) {
        const [topics, notes, questions, sessions] = await Promise.all([
            this.getTopicsForUser(userId, 'all'),
            this.getAllNotesForUser(userId),
            this.getAllQuestionsForUser(userId),
            this.getAllPracticeSessionsForUser(userId)
        ]);
        
        return {
            user_id: userId,
            topics,
            notes,
            questions,
            practice_sessions: sessions,
            export_date: new Date().toISOString(),
            version: '2.0-web'
        };
    }

    async getAllNotesForUser(userId) {
        const { data, error } = await this.supabase
            .from('notes')
            .select(`
                *,
                topics!inner(
                    id,
                    name,
                    subject_id,
                    user_id,
                    subjects(id, name, icon, color)
                )
            `)
            .eq('topics.user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Add subject information from the join
        return data.map(note => ({
            ...note,
            subject_id: note.topics.subject_id,
            topic_name: note.topics.name,
            subject_name: note.topics.subjects.name,
            subject: note.topics.subjects
        }));
    }

    async getAllQuestionsForUser(userId) {
        const { data, error } = await this.supabase
            .from('questions')
            .select(`
                *,
                topics!inner(user_id, name, subject_id)
            `)
            .eq('topics.user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        return data.map(q => {
            let options = null;
            if (q.options) {
                try {
                    options = JSON.parse(q.options);
                } catch (parseError) {
                    console.error('❌ Failed to parse question options:', parseError);
                    options = null;
                }
            }
            return {
                ...q,
                options: options
            };
        });
    }

    async getAllPracticeSessionsForUser(userId) {
        const { data, error } = await this.supabase
            .from('practice_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('session_date', { ascending: false });
            
        if (error) throw error;
        return data;
    }

    // ===============================
    // FLASHCARD OPERATIONS
    // ===============================

    /**
     * Flashcard Set Operations
     */
    async createFlashcardSet(userId, setData) {
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        
        const flashcardSet = {
            id,
            user_id: userId,
            name: setData.name,
            description: setData.description || null,
            subject_id: setData.subjectId || null,
            topic_id: setData.topicId || null,
            is_shared: setData.isShared || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('flashcard_sets')
            .insert(flashcardSet)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getFlashcardSets(userId) {
        try {
            // First get all flashcard sets
            const { data: sets, error: setsError } = await this.supabase
                .from('flashcard_sets')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (setsError) throw setsError;
            
            console.log(`🔍 Found ${sets?.length || 0} flashcard sets for user ${userId}`);
            
            // Then get card counts for each set
            const setsWithCounts = await Promise.all(
                (sets || []).map(async (set) => {
                    try {
                        const { count, error: countError } = await this.supabase
                            .from('flashcards')
                            .select('*', { count: 'exact', head: true })
                            .eq('set_id', set.id);
                            
                        if (countError) {
                            console.warn(`⚠️ Error getting count for set ${set.id}:`, countError);
                            return { ...set, card_count: 0 };
                        }
                        
                        console.log(`🔍 Set "${set.name}" has ${count || 0} cards`);
                        return { ...set, card_count: count || 0 };
                    } catch (err) {
                        console.warn(`⚠️ Error counting cards for set ${set.id}:`, err);
                        return { ...set, card_count: 0 };
                    }
                })
            );
            
            return setsWithCounts;
        } catch (error) {
            console.error('❌ Error in getFlashcardSets:', error);
            throw error;
        }
    }

    async getFlashcardSet(setId, userId) {
        const { data, error } = await this.supabase
            .from('flashcard_sets')
            .select('*')
            .eq('id', setId)
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    async updateFlashcardSet(setId, userId, updates) {
        const { data, error } = await this.supabase
            .from('flashcard_sets')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', setId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteFlashcardSet(setId, userId) {
        const { error } = await this.supabase
            .from('flashcard_sets')
            .delete()
            .eq('id', setId)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    }

    /**
     * Flashcard Operations
     */
    async createFlashcard(setId, userId, cardData) {
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        
        // Verify user owns the set
        const { data: setCheck } = await this.supabase
            .from('flashcard_sets')
            .select('id')
            .eq('id', setId)
            .eq('user_id', userId)
            .single();
            
        if (!setCheck) {
            throw new Error('Flashcard set not found or access denied');
        }

        const flashcard = {
            id,
            set_id: setId,
            front: cardData.front,
            back: cardData.back,
            hint: cardData.hint || null,
            difficulty: cardData.difficulty || 1,
            tags: Array.isArray(cardData.tags) ? JSON.stringify(cardData.tags) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('flashcards')
            .insert(flashcard)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getFlashcardsInSet(setId) {
        const { data, error } = await this.supabase
            .from('flashcards')
            .select('*')
            .eq('set_id', setId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Parse tags from JSON string
        return data.map(card => ({
            ...card,
            tags: card.tags ? JSON.parse(card.tags) : []
        }));
    }

    async updateFlashcard(cardId, userId, updates) {
        // Verify user owns the flashcard through set ownership
        const { data: cardCheck } = await this.supabase
            .from('flashcards')
            .select(`
                id,
                flashcard_sets!inner(user_id)
            `)
            .eq('id', cardId)
            .eq('flashcard_sets.user_id', userId)
            .single();
            
        if (!cardCheck) {
            throw new Error('Flashcard not found or access denied');
        }

        const updateData = {
            ...updates,
            updated_at: new Date().toISOString()
        };
        
        if (updates.tags) {
            updateData.tags = JSON.stringify(updates.tags);
        }

        const { data, error } = await this.supabase
            .from('flashcards')
            .update(updateData)
            .eq('id', cardId)
            .select()
            .single();

        if (error) throw error;
        
        return {
            ...data,
            tags: data.tags ? JSON.parse(data.tags) : []
        };
    }

    async deleteFlashcard(cardId, userId) {
        // Verify user owns the flashcard through set ownership
        const { data: cardCheck } = await this.supabase
            .from('flashcards')
            .select(`
                id,
                flashcard_sets!inner(user_id)
            `)
            .eq('id', cardId)
            .eq('flashcard_sets.user_id', userId)
            .single();
            
        if (!cardCheck) {
            throw new Error('Flashcard not found or access denied');
        }

        const { error } = await this.supabase
            .from('flashcards')
            .delete()
            .eq('id', cardId);

        if (error) throw error;
        return true;
    }

    /**
     * Flashcard Progress & Study Operations
     */
    async getCardProgress(userId, flashcardId) {
        const { data, error } = await this.supabase
            .from('flashcard_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('flashcard_id', flashcardId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
        return data;
    }

    async updateCardProgress(userId, flashcardId, isCorrect, responseTime) {
        // Implementation of spaced repetition algorithm would go here
        // For now, just basic progress tracking
        const existing = await this.getCardProgress(userId, flashcardId);
        
        const progressData = {
            user_id: userId,
            flashcard_id: flashcardId,
            total_attempts: (existing?.total_attempts || 0) + 1,
            correct_attempts: (existing?.correct_attempts || 0) + (isCorrect ? 1 : 0),
            correct_streak: isCorrect ? (existing?.correct_streak || 0) + 1 : 0,
            last_reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (!existing) {
            const { v4: uuidv4 } = require('uuid');
            progressData.id = uuidv4();
            progressData.created_at = new Date().toISOString();
            
            const { data, error } = await this.supabase
                .from('flashcard_progress')
                .insert(progressData)
                .select()
                .single();
                
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await this.supabase
                .from('flashcard_progress')
                .update(progressData)
                .eq('id', existing.id)
                .select()
                .single();
                
            if (error) throw error;
            return data;
        }
    }

    async getCardsForReview(userId, setId, limit = 10) {
        const { data, error } = await this.supabase
            .from('flashcards')
            .select(`
                *,
                flashcard_progress(*)
            `)
            .eq('set_id', setId)
            .limit(limit);

        if (error) throw error;
        return data.map(card => ({
            ...card,
            tags: card.tags ? JSON.parse(card.tags) : [],
            progress: card.flashcard_progress?.[0] || null
        }));
    }

    async recordStudySession(userId, setId, studyMode, cardsStudied, cardsCorrect, durationSeconds) {
        const { v4: uuidv4 } = require('uuid');
        
        const session = {
            id: uuidv4(),
            user_id: userId,
            set_id: setId,
            study_mode: studyMode,
            cards_studied: cardsStudied,
            cards_correct: cardsCorrect,
            duration_seconds: durationSeconds,
            session_date: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('flashcard_study_sessions')
            .insert(session)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getStudyStats(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await this.supabase
            .from('flashcard_study_sessions')
            .select('*')
            .eq('user_id', userId)
            .gte('session_date', startDate.toISOString())
            .order('session_date', { ascending: false });

        if (error) throw error;
        return data;
    }

    // ===== FILE UPLOAD METHODS =====

    async uploadFile(userId, topicId, fileBuffer, originalFilename) {
        console.log('📤 uploadFile method called with parameters:', {
            userId: userId,
            topicId: topicId,
            bufferSize: fileBuffer?.length || 'undefined',
            filename: originalFilename
        });
        
        const { v4: uuidv4 } = require('uuid');
        const path = require('path');
        
        const fileId = uuidv4();
        const fileExtension = path.extname(originalFilename);
        const fileName = path.basename(originalFilename, fileExtension);
        const storageFilename = `${userId}/${topicId}/${fileId}${fileExtension}`;
        
        try {
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('study-materials')
                .upload(storageFilename, fileBuffer, {
                    contentType: this.getMimeType(fileExtension),
                    upsert: false
                });

            if (uploadError) {
                console.error('❌ Supabase storage upload error:', uploadError);
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from('study-materials')
                .getPublicUrl(storageFilename);

            // Process document and extract text content
            let processedDoc, fileRecord, dbData;
            
            try {
                console.log('📄 Loading document processor...');
                const DocumentProcessor = require('./document-processor');
                const processor = new DocumentProcessor();
                
                console.log('📄 Processing document for text extraction...');
                processedDoc = await processor.processDocument(
                    fileBuffer, 
                    originalFilename, 
                    this.getMimeType(fileExtension)
                );
                
                console.log('📄 Creating file record...');
                fileRecord = processor.createFileRecord(
                    userId,
                    topicId,
                    originalFilename,
                    processedDoc.content,
                    processedDoc.word_count
                );
                
                console.log('📄 Inserting file record into database...');
                console.log('📄 Full file record to insert:', fileRecord);
                console.log('📄 File record summary:', {
                    user_id: fileRecord.user_id,
                    topic_id: fileRecord.topic_id,
                    file_name: fileRecord.file_name,
                    word_count: fileRecord.word_count,
                    content_length: fileRecord.content?.length || 0
                });
                
                console.log('📄 About to call Supabase insert...');
                const { data: insertData, error: dbError } = await this.supabase
                    .from('notes')
                    .insert(fileRecord)
                    .select()
                    .single();
                    
                console.log('📄 Supabase insert response:', { 
                    data: insertData ? 'Got data' : null, 
                    error: dbError || 'No error',
                    errorType: typeof dbError,
                    errorKeys: dbError ? Object.keys(dbError) : []
                });

                if (dbError) {
                    console.error('❌ Database file record error:', dbError);
                    console.error('❌ Error code:', dbError.code);
                    console.error('❌ Error details:', dbError.details);
                    console.error('❌ Error hint:', dbError.hint);
                    throw new Error(`Database error: ${dbError.message} (${dbError.code})`);
                }
                
                dbData = insertData;
                console.log('✅ File record created in database with extracted content');
                
            } catch (processingError) {
                console.error('❌ Document processing error:', processingError);
                
                // Try to clean up the uploaded file
                try {
                    await this.supabase.storage
                        .from('study-materials')
                        .remove([storageFilename]);
                    console.log('🧹 Cleaned up uploaded file after processing error');
                } catch (cleanupError) {
                    console.error('❌ Failed to cleanup uploaded file:', cleanupError);
                }
                
                // Return a simplified response without document processing
                console.log('⚠️ Falling back to basic file upload without text extraction');
                console.log('⚠️ Processing error was:', processingError.message);
                return {
                    id: fileId,
                    filename: originalFilename,
                    size: fileBuffer.length,
                    file_url: publicUrl,
                    file_type: this.getMimeType(fileExtension),
                    upload_date: new Date().toISOString(),
                    success: true,
                    extraction_successful: false,
                    error: 'Text extraction failed, file uploaded to storage only',
                    processing_error: processingError.message
                };
            }

            console.log('✅ File uploaded successfully:', {
                fileId: fileId,
                filename: originalFilename,
                size: fileBuffer.length,
                url: publicUrl
            });

            console.log('✅ Full upload process completed successfully');
            return {
                id: fileRecord.id,
                filename: originalFilename,
                size: fileBuffer.length,
                file_url: publicUrl,
                file_type: processedDoc.file_type,
                word_count: processedDoc.word_count,
                upload_date: fileRecord.created_at,
                database_record: dbData,
                success: true,
                extraction_successful: true
            };

        } catch (error) {
            console.error('❌ File upload failed:', error);
            throw error;
        }
    }

    async getTopicFiles(userId, topicId) {
        const { data, error } = await this.supabase
            .from('files')
            .select('id, topic_id, file_name, word_count, created_at, updated_at, user_id')
            .eq('user_id', userId)
            .eq('topic_id', topicId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform to match expected format
        return (data || []).map(file => ({
            id: file.id,
            filename: file.file_name,
            word_count: file.word_count,
            upload_date: file.created_at,
            file_type: this.getFileTypeFromName(file.file_name),
            size: file.word_count ? file.word_count * 6 : 0 // Rough estimate: 6 chars per word
        }));
    }

    getFileTypeFromName(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        const typeMap = {
            'pdf': 'application/pdf',
            'doc': 'application/msword', 
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain',
            'html': 'text/html',
            'md': 'text/markdown'
        };
        return typeMap[extension] || 'application/octet-stream';
    }

    getMimeType(fileExtension) {
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain',
            '.md': 'text/markdown'
        };
        
        return mimeTypes[fileExtension.toLowerCase()] || 'application/octet-stream';
    }

    // ===== FEEDBACK METHODS =====

    /**
     * Submit new feedback
     */
    async submitFeedback(feedbackData) {
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        
        const feedback = {
            id,
            type: feedbackData.type,
            subject: feedbackData.subject,
            message: feedbackData.message,
            user_email: feedbackData.userEmail || null,
            user_id: feedbackData.userId || null,
            user_agent: feedbackData.userAgent || null,
            status: 'new',
            priority: 'normal',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('feedback')
            .insert(feedback)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get all feedback with filtering and pagination
     */
    async getAllFeedback(options = {}) {
        const {
            limit = 50,
            offset = 0,
            status = null,
            type = null,
            priority = null,
            orderBy = 'created_at',
            orderDirection = 'desc'
        } = options;

        let query = this.supabase
            .from('feedback')
            .select('*');

        if (status) {
            query = query.eq('status', status);
        }

        if (type) {
            query = query.eq('type', type);
        }

        if (priority) {
            query = query.eq('priority', priority);
        }

        query = query
            .order(orderBy, { ascending: orderDirection.toLowerCase() === 'asc' })
            .range(offset, offset + limit - 1);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Get feedback by ID
     */
    async getFeedbackById(id) {
        const { data, error } = await this.supabase
            .from('feedback')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
        return data;
    }

    /**
     * Update feedback status, priority, or admin notes
     */
    async updateFeedback(id, updates) {
        const allowedFields = ['status', 'priority', 'admin_notes'];
        const updateData = {
            updated_at: new Date().toISOString()
        };

        // Only include allowed fields
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = updates[key];
            }
        });

        const { data, error } = await this.supabase
            .from('feedback')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get feedback statistics
     */
    async getFeedbackStats() {
        try {
            // Get total count
            const { count: totalCount, error: totalError } = await this.supabase
                .from('feedback')
                .select('*', { count: 'exact', head: true });

            if (totalError) throw totalError;

            // Get new count
            const { count: newCount, error: newError } = await this.supabase
                .from('feedback')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'new');

            if (newError) throw newError;

            // Get high priority count
            const { count: highPriorityCount, error: highError } = await this.supabase
                .from('feedback')
                .select('*', { count: 'exact', head: true })
                .eq('priority', 'high');

            if (highError) throw highError;

            // Get counts by type
            const { data: typeData, error: typeError } = await this.supabase
                .from('feedback')
                .select('type')
                .order('type');

            if (typeError) throw typeError;

            // Get counts by status
            const { data: statusData, error: statusError } = await this.supabase
                .from('feedback')
                .select('status')
                .order('status');

            if (statusError) throw statusError;

            // Count by type
            const byType = {};
            typeData.forEach(item => {
                byType[item.type] = (byType[item.type] || 0) + 1;
            });

            // Count by status
            const byStatus = {};
            statusData.forEach(item => {
                byStatus[item.status] = (byStatus[item.status] || 0) + 1;
            });

            return {
                total: totalCount || 0,
                new: newCount || 0,
                highPriority: highPriorityCount || 0,
                byType: Object.keys(byType).map(type => ({ type, count: byType[type] })),
                byStatus: Object.keys(byStatus).map(status => ({ status, count: byStatus[status] }))
            };
        } catch (error) {
            console.error('❌ Error getting feedback stats:', error);
            return {
                total: 0,
                new: 0,
                highPriority: 0,
                byType: [],
                byStatus: []
            };
        }
    }

    /**
     * Delete feedback (admin only)
     */
    async deleteFeedback(id) {
        const { error } = await this.supabase
            .from('feedback')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { id, deleted: true };
    }
}

module.exports = WebStorageService;