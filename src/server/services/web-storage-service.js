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
        const { data, error } = await this.supabase
            .from('notes')
            .update({ 
                content, 
                word_count: content.trim().split(/\s+/).length,
                updated_at: new Date().toISOString()
            })
            .eq('id', noteId)
            .eq('topic_id', this.supabase
                .from('topics')
                .select('id')
                .eq('user_id', userId)
            )
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
        
        return data.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null
        }));
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
        
        // Shuffle and take count
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        
        return selected.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null
        }));
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
        
        return data.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null
        }));
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
}

module.exports = WebStorageService;