// src/server/services/practice-db-service.js - Practice Sessions and Analytics Database Service Module
const { v4: uuidv4 } = require('uuid');

class PracticeDbService {
  constructor(db, subjectsService) {
    this.db = db;
    this.subjectsService = subjectsService;
  }

  // ===== PRACTICE SESSIONS =====
  
  /**
   * Record practice session
   */
  async recordPracticeSession(topicId, questionsCount, correctAnswers) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const accuracyRate = questionsCount > 0 ? (correctAnswers / questionsCount) * 100 : 0;
      
      const sql = `INSERT INTO practice_sessions 
        (id, topic_id, questions_count, correct_answers, accuracy_rate) 
        VALUES (?, ?, ?, ?, ?)`;
      
      this.db.run(sql, [id, topicId, questionsCount, correctAnswers, accuracyRate], function(err) {
        if (err) reject(err);
        else {
          resolve({ 
            id, 
            topic_id: topicId, 
            questions_count: questionsCount,
            correct_answers: correctAnswers,
            accuracy_rate: accuracyRate,
            session_date: new Date().toISOString() 
          });
        }
      });
    });
  }

  /**
   * Get all practice sessions
   */
  async getAllPracticeSessions() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM practice_sessions ORDER BY session_date DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get practice sessions for a topic
   */
  async getPracticeSessionsForTopic(topicId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM practice_sessions WHERE topic_id = ? ORDER BY session_date DESC';
      this.db.all(sql, [topicId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // ===== USER ANSWERS =====
  
  /**
   * Record user answer
   */
  async recordUserAnswer(questionId, practiceSessionId, userAnswer, isCorrect, timeTaken = 0) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = `INSERT INTO user_answers 
        (id, question_id, practice_session_id, user_answer, is_correct, time_taken) 
        VALUES (?, ?, ?, ?, ?, ?)`;
      
      this.db.run(sql, [id, questionId, practiceSessionId, userAnswer, isCorrect, timeTaken], function(err) {
        if (err) reject(err);
        else {
          resolve({ 
            id, 
            question_id: questionId,
            practice_session_id: practiceSessionId,
            user_answer: userAnswer,
            is_correct: isCorrect,
            time_taken: timeTaken,
            created_at: new Date().toISOString() 
          });
        }
      });
    });
  }

  /**
   * Get user answers for a practice session
   */
  async getUserAnswersForSession(practiceSessionId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM user_answers WHERE practice_session_id = ? ORDER BY created_at';
      this.db.all(sql, [practiceSessionId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get all user answers
   */
  async getAllUserAnswers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM user_answers ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // ===== STATISTICS =====
  
  /**
   * Get topic statistics
   */
  async getTopicStats(topicId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(DISTINCT q.id) as total_questions,
          COUNT(DISTINCT n.id) as total_notes,
          COALESCE(AVG(ps.accuracy_rate), 0) as avg_accuracy_rate,
          COUNT(DISTINCT ps.id) as practice_sessions_count,
          MAX(ps.session_date) as last_practice_date,
          COALESCE(SUM(n.word_count), 0) as total_word_count,
          COUNT(DISTINCT CASE WHEN q.type = 'multiple_choice' THEN q.id END) as mcq_count,
          COUNT(DISTINCT CASE WHEN q.type = 'text' THEN q.id END) as text_count
        FROM topics t
        LEFT JOIN questions q ON t.id = q.topic_id
        LEFT JOIN notes n ON t.id = n.topic_id
        LEFT JOIN practice_sessions ps ON t.id = ps.topic_id
        WHERE t.id = ?
      `;
      
      this.db.get(sql, [topicId], (err, row) => {
        if (err) reject(err);
        else resolve({
          total_questions: row.total_questions || 0,
          total_notes: row.total_notes || 0,
          avg_accuracy_rate: Math.round(row.avg_accuracy_rate || 0),
          practice_sessions_count: row.practice_sessions_count || 0,
          last_practice_date: row.last_practice_date,
          total_word_count: row.total_word_count || 0,
          mcq_count: row.mcq_count || 0,
          text_count: row.text_count || 0
        });
      });
    });
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    return new Promise((resolve, reject) => {
      console.log('🔍 Getting dashboard stats...');
      
      // Use separate queries to isolate issues
      const queries = {
        topics: 'SELECT COUNT(*) as count FROM topics',
        questions: 'SELECT COUNT(*) as count FROM questions', 
        notes: 'SELECT COUNT(*) as count FROM notes',
        sessions: 'SELECT COUNT(*) as count FROM practice_sessions',
        accuracy: 'SELECT COALESCE(AVG(accuracy_rate), 0) as avg FROM practice_sessions'
      };
      
      const results = {};
      let completed = 0;
      const total = Object.keys(queries).length;
      
      for (const [key, sql] of Object.entries(queries)) {
        this.db.get(sql, (err, row) => {
          if (err) {
            console.error(`❌ Error in ${key} query:`, err);
            results[key] = 0; // Default to 0 on error
          } else {
            results[key] = row.count || row.avg || 0;
            console.log(`✅ ${key}: ${results[key]}`);
          }
          
          completed++;
          if (completed === total) {
            // Calculate unique subjects
            this.db.get('SELECT COUNT(DISTINCT subject_id) as count FROM topics', (err, row) => {
              const finalStats = {
                total_topics: results.topics || 0,
                total_questions: results.questions || 0,
                total_notes: results.notes || 0,
                total_practice_sessions: results.sessions || 0,
                overall_accuracy: Math.round(results.accuracy || 0),
                active_subjects: row ? (row.count || 0) : 0
              };
              
              console.log('📊 Final dashboard stats:', finalStats);
              resolve(finalStats);
            });
          }
        });
      }
    });
  }

  /**
   * Get subject-wise statistics
   */
  async getSubjectStats() {
    return new Promise(async (resolve, reject) => {
      console.log('📊 Getting subject stats...');
      
      try {
        // First, get all topics grouped by subject
        const sql = `
          SELECT 
            t.subject_id,
            COUNT(DISTINCT t.id) as topic_count,
            COUNT(DISTINCT q.id) as question_count,
            COUNT(DISTINCT n.id) as note_count,
            COALESCE(AVG(ps.accuracy_rate), 0) as avg_accuracy,
            COALESCE(SUM(n.word_count), 0) as total_word_count,
            COUNT(DISTINCT ps.id) as practice_sessions_count,
            MAX(ps.session_date) as last_practice_date
          FROM topics t
          LEFT JOIN questions q ON t.id = q.topic_id
          LEFT JOIN notes n ON t.id = n.topic_id
          LEFT JOIN practice_sessions ps ON t.id = ps.topic_id
          GROUP BY t.subject_id
        `;
        
        this.db.all(sql, async (err, rows) => {
          if (err) {
            console.error('❌ Subject stats query error:', err);
            reject(err);
            return;
          }

          console.log('📋 Raw subject stats from DB:', rows);

          // Add subject information to stats
          const subjectStats = [];
          
          // Process existing data
          for (const row of rows) {
            const subject = await this.subjectsService.getSubjectById(row.subject_id);
            if (subject) {
              const stats = {
                subject: subject,
                topic_count: row.topic_count || 0,
                question_count: row.question_count || 0,
                note_count: row.note_count || 0,
                avg_accuracy: Math.round(row.avg_accuracy || 0),
                total_word_count: row.total_word_count || 0,
                practice_sessions_count: row.practice_sessions_count || 0,
                last_practice_date: row.last_practice_date
              };
              
              console.log(`✅ Subject ${subject.name}: ${stats.topic_count} topics`);
              subjectStats.push(stats);
            }
          }
          
          // Add subjects with no data (very important!)
          for (const subject of this.subjectsService.FIXED_SUBJECTS) {
            if (!subjectStats.find(s => s.subject.id === subject.id)) {
              console.log(`📝 Adding empty stats for ${subject.name}`);
              subjectStats.push({
                subject: subject,
                topic_count: 0,
                question_count: 0,
                note_count: 0,
                avg_accuracy: 0,
                total_word_count: 0,
                practice_sessions_count: 0,
                last_practice_date: null
              });
            }
          }
          
          console.log(`📊 Final subject stats: ${subjectStats.length} subjects`);
          resolve(subjectStats);
        });
      } catch (error) {
        console.error('❌ Subject stats error:', error);
        reject(error);
      }
    });
  }

  /**
   * Get recent activity (latest questions, notes, practice sessions)
   */
  async getRecentActivity(limit = 10) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          'question' as type,
          q.id,
          SUBSTR(q.question, 1, 100) as title,
          q.created_at,
          t.name as topic_name,
          t.subject_id
        FROM questions q
        JOIN topics t ON q.topic_id = t.id
        
        UNION ALL
        
        SELECT 
          'note' as type,
          n.id,
          CASE 
            WHEN n.file_name IS NOT NULL THEN 'Uploaded: ' || n.file_name
            ELSE SUBSTR(n.content, 1, 100)
          END as title,
          n.created_at,
          t.name as topic_name,
          t.subject_id
        FROM notes n
        JOIN topics t ON n.topic_id = t.id
        
        UNION ALL
        
        SELECT 
          'practice' as type,
          ps.id,
          'Practice Session - ' || ps.correct_answers || '/' || ps.questions_count || ' (' || ROUND(ps.accuracy_rate) || '%)' as title,
          ps.session_date as created_at,
          t.name as topic_name,
          t.subject_id
        FROM practice_sessions ps
        JOIN topics t ON ps.topic_id = t.id
        
        UNION ALL
        
        SELECT 
          'topic' as type,
          t.id,
          'New Topic: ' || t.name as title,
          t.created_at,
          t.name as topic_name,
          t.subject_id
        FROM topics t
        
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      this.db.all(sql, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get learning streak (consecutive days with practice)
   */
  async getLearningStreak() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT DISTINCT DATE(session_date) as practice_date
        FROM practice_sessions
        ORDER BY practice_date DESC
      `;
      
      this.db.all(sql, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          let streak = 0;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          for (let i = 0; i < rows.length; i++) {
            const practiceDate = new Date(rows[i].practice_date);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);
            
            if (practiceDate.getTime() === expectedDate.getTime()) {
              streak++;
            } else {
              break;
            }
          }
          
          resolve({
            current_streak: streak,
            total_practice_days: rows.length,
            last_practice_date: rows.length > 0 ? rows[0].practice_date : null
          });
        }
      });
    });
  }

  /**
   * Get performance trends (accuracy over time)
   */
  async getPerformanceTrends(days = 30) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          DATE(session_date) as date,
          AVG(accuracy_rate) as avg_accuracy,
          COUNT(*) as session_count,
          SUM(questions_count) as total_questions,
          SUM(correct_answers) as total_correct
        FROM practice_sessions
        WHERE session_date >= datetime('now', '-${days} days')
        GROUP BY DATE(session_date)
        ORDER BY date DESC
      `;
      
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else {
          const trends = rows.map(row => ({
            date: row.date,
            avg_accuracy: Math.round(row.avg_accuracy || 0),
            session_count: row.session_count,
            total_questions: row.total_questions,
            total_correct: row.total_correct
          }));
          resolve(trends);
        }
      });
    });
  }

  // ===== USER-SPECIFIC PRACTICE SESSION METHODS =====
    
  async recordPracticeSessionForUser(topicId, questionsCount, correctAnswers, userId) {
    return new Promise((resolve, reject) => {
      // First verify topic belongs to user
      this.db.get('SELECT id FROM topics WHERE id = ? AND user_id = ?', [topicId, userId], (err, row) => {
        if (err || !row) {
          reject(new Error('Topic not found or access denied'));
          return;
        }
        
        const id = uuidv4();
        const accuracyRate = questionsCount > 0 ? (correctAnswers / questionsCount) * 100 : 0;
        
        const sql = `INSERT INTO practice_sessions 
          (id, topic_id, user_id, questions_count, correct_answers, accuracy_rate) 
          VALUES (?, ?, ?, ?, ?, ?)`;
        
        this.db.run(sql, [id, topicId, userId, questionsCount, correctAnswers, accuracyRate], function(err) {
          if (err) reject(err);
          else {
            resolve({ 
              id, 
              topic_id: topicId,
              user_id: userId,
              questions_count: questionsCount,
              correct_answers: correctAnswers,
              accuracy_rate: accuracyRate,
              session_date: new Date().toISOString() 
            });
          }
        });
      });
    });
  }

  async getTopicStatsForUser(topicId, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(DISTINCT q.id) as total_questions,
          COUNT(DISTINCT n.id) as total_notes,
          COALESCE(AVG(ps.accuracy_rate), 0) as avg_accuracy_rate,
          COUNT(DISTINCT ps.id) as practice_sessions_count,
          MAX(ps.session_date) as last_practice_date,
          COALESCE(SUM(n.word_count), 0) as total_word_count
        FROM topics t
        LEFT JOIN questions q ON t.id = q.topic_id
        LEFT JOIN notes n ON t.id = n.topic_id
        LEFT JOIN practice_sessions ps ON t.id = ps.topic_id AND ps.user_id = t.user_id
        WHERE t.id = ? AND t.user_id = ?
      `;
      
      this.db.get(sql, [topicId, userId], (err, row) => {
        if (err) reject(err);
        else resolve({
          total_questions: row.total_questions || 0,
          total_notes: row.total_notes || 0,
          avg_accuracy_rate: Math.round(row.avg_accuracy_rate || 0),
          practice_sessions_count: row.practice_sessions_count || 0,
          last_practice_date: row.last_practice_date,
          total_word_count: row.total_word_count || 0
        });
      });
    });
  }

  // ===== USER-SPECIFIC DASHBOARD METHODS =====
    
  async getDashboardStatsForUser(userId) {
    return new Promise((resolve, reject) => {
      const queries = {
        topics: 'SELECT COUNT(*) as count FROM topics WHERE user_id = ?',
        questions: 'SELECT COUNT(*) as count FROM questions WHERE topic_id IN (SELECT id FROM topics WHERE user_id = ?)',
        notes: 'SELECT COUNT(*) as count FROM notes WHERE topic_id IN (SELECT id FROM topics WHERE user_id = ?)',
        sessions: 'SELECT COUNT(*) as count FROM practice_sessions WHERE user_id = ?',
        accuracy: 'SELECT AVG(accuracy_rate) as avg FROM practice_sessions WHERE user_id = ?'
      };
      
      const results = {};
      let completed = 0;
      const total = Object.keys(queries).length;
      
      for (const [key, sql] of Object.entries(queries)) {
        this.db.get(sql, [userId], (err, row) => {
          if (err) {
            console.error(`❌ Error in ${key} query for user ${userId}:`, err);
            results[key] = 0;
          } else {
            results[key] = row.count || row.avg || 0;
          }
          
          completed++;
          if (completed === total) {
            const finalStats = {
              total_topics: results.topics || 0,
              total_questions: results.questions || 0,
              total_notes: results.notes || 0,
              total_practice_sessions: results.sessions || 0,
              overall_accuracy: Math.round(results.accuracy || 0)
            };
            
            resolve(finalStats);
          }
        });
      }
    });
  }

  async getSubjectStatsForUser(userId) {
    return new Promise(async (resolve, reject) => {
      try {
        const sql = `
          SELECT 
            t.subject_id,
            COUNT(DISTINCT t.id) as topic_count,
            COUNT(DISTINCT q.id) as question_count,
            COUNT(DISTINCT n.id) as note_count,
            COALESCE(AVG(ps.accuracy_rate), 0) as avg_accuracy
          FROM topics t
          LEFT JOIN questions q ON t.id = q.topic_id
          LEFT JOIN notes n ON t.id = n.topic_id
          LEFT JOIN practice_sessions ps ON t.id = ps.topic_id AND ps.user_id = t.user_id
          WHERE t.user_id = ?
          GROUP BY t.subject_id
        `;
        
        this.db.all(sql, [userId], async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          const subjectStats = [];
          
          // Process existing data
          for (const row of rows) {
            const subject = await this.subjectsService.getSubjectById(row.subject_id);
            if (subject) {
              subjectStats.push({
                subject: subject,
                topic_count: row.topic_count || 0,
                question_count: row.question_count || 0,
                note_count: row.note_count || 0,
                avg_accuracy: Math.round(row.avg_accuracy || 0)
              });
            }
          }
          
          // Add subjects with no data
          for (const subject of this.subjectsService.FIXED_SUBJECTS) {
            if (!subjectStats.find(s => s.subject.id === subject.id)) {
              subjectStats.push({
                subject: subject,
                topic_count: 0,
                question_count: 0,
                note_count: 0,
                avg_accuracy: 0
              });
            }
          }
          
          resolve(subjectStats);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async getRecentActivityForUser(limit = 10, userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          'question' as type,
          q.id,
          SUBSTR(q.question, 1, 100) as title,
          q.created_at,
          t.name as topic_name,
          t.subject_id
        FROM questions q
        JOIN topics t ON q.topic_id = t.id
        WHERE t.user_id = ?
        
        UNION ALL
        
        SELECT 
          'note' as type,
          n.id,
          CASE 
            WHEN n.file_name IS NOT NULL THEN 'Uploaded: ' || n.file_name
            ELSE SUBSTR(n.content, 1, 100)
          END as title,
          n.created_at,
          t.name as topic_name,
          t.subject_id
        FROM notes n
        JOIN topics t ON n.topic_id = t.id
        WHERE t.user_id = ?
        
        UNION ALL
        
        SELECT 
          'practice' as type,
          ps.id,
          'Practice Session - ' || ps.correct_answers || '/' || ps.questions_count || ' (' || ROUND(ps.accuracy_rate) || '%)' as title,
          ps.session_date as created_at,
          t.name as topic_name,
          t.subject_id
        FROM practice_sessions ps
        JOIN topics t ON ps.topic_id = t.id
        WHERE ps.user_id = ?
        
        UNION ALL
        
        SELECT 
          'topic' as type,
          t.id,
          'New Topic: ' || t.name as title,
          t.created_at,
          t.name as topic_name,
          t.subject_id
        FROM topics t
        WHERE t.user_id = ?
        
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      this.db.all(sql, [userId, userId, userId, userId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getAllPracticeSessionsForUser(userId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM practice_sessions WHERE user_id = ? ORDER BY session_date DESC';
      this.db.all(sql, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = PracticeDbService;