// src/server/services/data-db-service.js - Data Management Database Service Module

class DataDbService {
  constructor(db, subjectsService, topicsService, notesService, questionsService, practiceService) {
    this.db = db;
    this.subjectsService = subjectsService;
    this.topicsService = topicsService;
    this.notesService = notesService;
    this.questionsService = questionsService;
    this.practiceService = practiceService;
  }

  // ===== DATA MANAGEMENT =====
  
  /**
   * Backup data to JSON
   */
  async exportData() {
    try {
      const [topics, notes, questions, sessions, userAnswers] = await Promise.all([
        this.topicsService.getAllTopics(),
        this.notesService.getAllNotes(),
        this.questionsService.getAllQuestions(),
        this.practiceService.getAllPracticeSessions(),
        this.practiceService.getAllUserAnswers()
      ]);

      return {
        subjects: this.subjectsService.FIXED_SUBJECTS,
        topics,
        notes,
        questions,
        practice_sessions: sessions,
        user_answers: userAnswers,
        export_date: new Date().toISOString(),
        version: '2.0'
      };
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Import data from JSON
   */
  async importData(data) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        try {
          // Clear existing data
          this.db.run('DELETE FROM user_answers');
          this.db.run('DELETE FROM practice_sessions');
          this.db.run('DELETE FROM questions');
          this.db.run('DELETE FROM notes');
          this.db.run('DELETE FROM topics');
          
          // Import topics
          if (data.topics) {
            for (const topic of data.topics) {
              this.db.run(
                'INSERT INTO topics (id, subject_id, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
                [topic.id, topic.subject_id, topic.name, topic.description, topic.created_at]
              );
            }
          }
          
          // Import notes
          if (data.notes) {
            for (const note of data.notes) {
              this.db.run(
                'INSERT INTO notes (id, topic_id, content, file_name, word_count, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                [note.id, note.topic_id, note.content, note.file_name, note.word_count, note.created_at]
              );
            }
          }
          
          // Import questions
          if (data.questions) {
            for (const question of data.questions) {
              const optionsJson = question.options ? JSON.stringify(question.options) : null;
              this.db.run(
                'INSERT INTO questions (id, topic_id, question, answer, type, options, correct_index, explanation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [question.id, question.topic_id, question.question, question.answer, question.type, optionsJson, question.correct_index, question.explanation, question.created_at]
              );
            }
          }
          
          // Import practice sessions
          if (data.practice_sessions) {
            for (const session of data.practice_sessions) {
              this.db.run(
                'INSERT INTO practice_sessions (id, topic_id, questions_count, correct_answers, accuracy_rate, session_date) VALUES (?, ?, ?, ?, ?, ?)',
                [session.id, session.topic_id, session.questions_count, session.correct_answers, session.accuracy_rate, session.session_date]
              );
            }
          }
          
          // Import user answers
          if (data.user_answers) {
            for (const answer of data.user_answers) {
              this.db.run(
                'INSERT INTO user_answers (id, question_id, practice_session_id, user_answer, is_correct, time_taken, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [answer.id, answer.question_id, answer.practice_session_id, answer.user_answer, answer.is_correct, answer.time_taken, answer.created_at]
              );
            }
          }
          
          this.db.run('COMMIT');
          resolve({ success: true, message: 'Data imported successfully' });
          
        } catch (error) {
          this.db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  }

  /**
   * Clean up old data (older than specified days)
   */
  async cleanupOldData(days = 365) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // Delete old practice sessions and related user answers
        this.db.run(`
          DELETE FROM user_answers 
          WHERE practice_session_id IN (
            SELECT id FROM practice_sessions 
            WHERE session_date < datetime('now', '-${days} days')
          )
        `);
        
        this.db.run(`
          DELETE FROM practice_sessions 
          WHERE session_date < datetime('now', '-${days} days')
        `, function(err) {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
          } else {
            this.db.run('COMMIT');
            resolve({ 
              success: true, 
              deletedSessions: this.changes,
              message: `Cleaned up data older than ${days} days`
            });
          }
        });
      });
    });
  }

  /**
   * Optimize database (vacuum and analyze)
   */
  async optimizeDatabase() {
    return new Promise((resolve, reject) => {
      this.db.run('VACUUM', (err) => {
        if (err) {
          reject(err);
        } else {
          this.db.run('ANALYZE', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve({ success: true, message: 'Database optimized successfully' });
            }
          });
        }
      });
    });
  }

  /**
   * Get database size and info
   */
  async getDatabaseInfo() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          name,
          (SELECT COUNT(*) FROM sqlite_master WHERE type='table') as table_count,
          (SELECT COUNT(*) FROM topics) as topics_count,
          (SELECT COUNT(*) FROM notes) as notes_count,
          (SELECT COUNT(*) FROM questions) as questions_count,
          (SELECT COUNT(*) FROM practice_sessions) as sessions_count,
          (SELECT COUNT(*) FROM user_answers) as answers_count
        FROM pragma_database_list WHERE name='main'
      `;
      
      this.db.get(sql, (err, row) => {
        if (err) reject(err);
        else resolve({
          database_name: row.name,
          table_count: row.table_count,
          total_records: {
            topics: row.topics_count,
            notes: row.notes_count,
            questions: row.questions_count,
            practice_sessions: row.sessions_count,
            user_answers: row.answers_count
          }
        });
      });
    });
  }

  async testConnection() {
    return new Promise((resolve) => {
      this.db.get('SELECT 1 as test', (err, row) => {
        if (err) {
          console.error('❌ Database connection test failed:', err);
          resolve(false);
        } else {
          console.log('✅ Database connection test passed:', row);
          resolve(true);
        }
      });
    });
  }

  async exportDataForUser(userId) {
    try {
      const [topics, notes, questions, sessions] = await Promise.all([
        this.topicsService.getTopicsForUser('all', userId),
        this.notesService.getAllNotesForUser(userId),
        this.questionsService.getAllQuestionsForUser(userId),
        this.practiceService.getAllPracticeSessionsForUser(userId)
      ]);

      return {
        subjects: this.subjectsService.FIXED_SUBJECTS,
        topics,
        notes,
        questions,
        practice_sessions: sessions,
        user_id: userId,
        export_date: new Date().toISOString(),
        version: '2.0-with-auth'
      };
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }
}

module.exports = DataDbService;