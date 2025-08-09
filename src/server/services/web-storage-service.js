// src/server/services/web-storage-service.js - Pure Supabase Storage for Web App
const { createClient } = require('@supabase/supabase-js');

class WebStorageService {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        
        console.log('🌐 Web Storage Service initialized - Supabase only');
    }

    // ===== SUBJECTS =====
    
    async getSubjects() {
        const { data, error } = await this.supabase
            .from('subjects')
            .select('*')
            .order('name');
            
        if (error) throw error;
        return data;
    }

    async getSubjectById(subjectId) {
        const { data, error } = await this.supabase
            .from('subjects')
            .select('*')
            .eq('id', subjectId)
            .single();
            
        if (error) throw error;
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
                topics!inner(user_id)
            `)
            .eq('topic_id', topicId)
            .eq('topics.user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
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
        const { data, error } = await this.supabase
            .from('topics')
            .select(`
                subject_id,
                subjects(name, description, icon, color),
                questions(id),
                notes(id),
                practice_sessions(accuracy_rate)
            `)
            .eq('user_id', userId);
            
        if (error) throw error;
        
        // Group by subject
        const subjectMap = {};
        data.forEach(topic => {
            if (!subjectMap[topic.subject_id]) {
                subjectMap[topic.subject_id] = {
                    subject: topic.subjects,
                    topic_count: 0,
                    question_count: 0,
                    note_count: 0,
                    sessions: []
                };
            }
            
            subjectMap[topic.subject_id].topic_count++;
            subjectMap[topic.subject_id].question_count += topic.questions.length;
            subjectMap[topic.subject_id].note_count += topic.notes.length;
            subjectMap[topic.subject_id].sessions.push(...topic.practice_sessions);
        });
        
        return Object.values(subjectMap).map(stats => ({
            ...stats,
            avg_accuracy: stats.sessions.length > 0
                ? Math.round(stats.sessions.reduce((sum, s) => sum + s.accuracy_rate, 0) / stats.sessions.length)
                : 0
        }));
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
        return data;
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