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
        // Return hardcoded subjects instead of querying Supabase
        return [...this.FIXED_SUBJECTS];
    }

    async getSubjectById(subjectId) {
        const subject = this.FIXED_SUBJECTS.find(s => s.id === subjectId);
        return subject || null;
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
                topics!inner(user_id, name, subject_id)
            `)
            .eq('topic_id', topicId)
            .eq('topics.user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Add subject information from fixed subjects
        return data.map(note => {
            const subject = this.FIXED_SUBJECTS.find(s => s.id === note.topics.subject_id);
            return {
                ...note,
                subject_id: note.topics.subject_id,
                topic_name: note.topics.name,
                subject_name: subject ? subject.name : 'Unknown Subject'
            };
        });
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
            
            // Get topics for user with separate queries to avoid complex joins
            const { data: topics, error: topicsError } = await this.supabase
                .from('topics')
                .select('id, subject_id')
                .eq('user_id', userId);
                
            if (topicsError) throw topicsError;
            
            console.log('📋 Found topics for user:', topics.length);
            
            // Group topics by subject_id
            const subjectMap = {};
            const topicIds = topics.map(t => t.id);
            
            // Initialize all subjects with zero counts
            for (const subject of this.FIXED_SUBJECTS) {
                subjectMap[subject.id] = {
                    subject: subject,
                    topic_count: 0,
                    question_count: 0,
                    note_count: 0,
                    avg_accuracy: 0
                };
            }
            
            // Count topics by subject
            topics.forEach(topic => {
                if (subjectMap[topic.subject_id]) {
                    subjectMap[topic.subject_id].topic_count++;
                }
            });
            
            // Get question counts if there are topics
            if (topicIds.length > 0) {
                const { count: questionCount } = await this.supabase
                    .from('questions')
                    .select('id', { count: 'exact' })
                    .in('topic_id', topicIds);
                    
                const { count: noteCount } = await this.supabase
                    .from('notes')
                    .select('id', { count: 'exact' })
                    .in('topic_id', topicIds);
                
                const { data: sessions } = await this.supabase
                    .from('practice_sessions')
                    .select('accuracy_rate, topic_id')
                    .eq('user_id', userId);
                
                // Distribute counts proportionally or aggregate (simplified approach)
                // For now, we'll aggregate across all subjects with data
                const subjectsWithData = topics.reduce((acc, topic) => {
                    if (!acc.includes(topic.subject_id)) {
                        acc.push(topic.subject_id);
                    }
                    return acc;
                }, []);
                
                if (subjectsWithData.length > 0) {
                    // For simplicity, distribute totals across subjects with topics
                    const avgQuestions = Math.floor((questionCount || 0) / subjectsWithData.length);
                    const avgNotes = Math.floor((noteCount || 0) / subjectsWithData.length);
                    const avgAccuracy = sessions?.length > 0 
                        ? Math.round(sessions.reduce((sum, s) => sum + s.accuracy_rate, 0) / sessions.length)
                        : 0;
                    
                    subjectsWithData.forEach(subjectId => {
                        if (subjectMap[subjectId]) {
                            subjectMap[subjectId].question_count = avgQuestions;
                            subjectMap[subjectId].note_count = avgNotes;
                            subjectMap[subjectId].avg_accuracy = avgAccuracy;
                        }
                    });
                }
            }
            
            const result = Object.values(subjectMap);
            console.log('📊 Returning subject stats:', result.length, 'subjects');
            return result;
            
        } catch (error) {
            console.error('❌ Subject stats error:', error);
            // Return all subjects with zero counts on error
            return this.FIXED_SUBJECTS.map(subject => ({
                subject: subject,
                topic_count: 0,
                question_count: 0,
                note_count: 0,
                avg_accuracy: 0
            }));
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
                topics!inner(user_id, name, subject_id)
            `)
            .eq('topics.user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        // Add subject information from fixed subjects
        return data.map(note => {
            const subject = this.FIXED_SUBJECTS.find(s => s.id === note.topics.subject_id);
            return {
                ...note,
                subject_id: note.topics.subject_id,
                topic_name: note.topics.name,
                subject_name: subject ? subject.name : 'Unknown Subject'
            };
        });
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