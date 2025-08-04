// src/server/services/database-simplified.js - COMPLETE Database Service
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class SimplifiedDatabaseService {
  constructor() {
    this.db = null;
    // Fixed subject categories - no user creation allowed
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
  }

  init() {
    const dbPath = path.join(__dirname, '../../data/study_ai_simplified.db');
    
    console.log('🔍 Database initialization:');
    console.log('  Path:', dbPath);
    console.log('  Path exists:', require('fs').existsSync(dbPath));
    
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(dbPath);
    if (!require('fs').existsSync(dataDir)) {
      console.log('📁 Creating data directory:', dataDir);
      require('fs').mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
      } else {
        console.log('✅ Connected to simplified SQLite database at:', dbPath);
        this.createTables();
        
        // Test the connection immediately
        this.testConnection();
      }
    });
  }

  createTables() {
    const tables = [
      // Simplified topics table - users can only create topics under fixed subjects
      `CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Notes linked to topics
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        content TEXT NOT NULL,
        file_name TEXT,
        word_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
      )`,
      
      // Simplified questions - no difficulty levels
      `CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        type TEXT DEFAULT 'multiple_choice',
        options TEXT,
        correct_index INTEGER,
        explanation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
      )`,
      
      // Practice sessions for analytics
      `CREATE TABLE IF NOT EXISTS practice_sessions (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        user_id TEXT,
        questions_count INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        accuracy_rate REAL DEFAULT 0,
        session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
      )`,

      // User answers for detailed analytics
      `CREATE TABLE IF NOT EXISTS user_answers (
        id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL,
        practice_session_id TEXT,
        user_answer TEXT,
        is_correct BOOLEAN DEFAULT 0,
        time_taken INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
        FOREIGN KEY (practice_session_id) REFERENCES practice_sessions (id) ON DELETE SET NULL
      )`
    ];

    // Create tables and indexes in sequence using serialize
    this.db.serialize(() => {
      // Create tables first
      tables.forEach(sql => {
        this.db.run(sql, (err) => {
          if (err) {
            console.error('Error creating table:', err);
          }
        });
      });

      // Create indexes after tables are created
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics (subject_id)',
        'CREATE INDEX IF NOT EXISTS idx_notes_topic_id ON notes (topic_id)',
        'CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions (topic_id)',
        'CREATE INDEX IF NOT EXISTS idx_practice_sessions_topic_id ON practice_sessions (topic_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers (question_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_answers_session_id ON user_answers (practice_session_id)'
      ];

      indexes.forEach(sql => {
        this.db.run(sql, (err) => {
          if (err && !err.message.includes('already exists')) {
            console.error('Error creating index:', err);
          }
        });
      });
    });

    // Add user_id columns if they don't exist (for existing databases)
    this.addMissingColumns();
    
    console.log('✅ Simplified database schema initialized');
  }

  addMissingColumns() {
    // Add user_id column to topics table if it doesn't exist
    this.db.run(`ALTER TABLE topics ADD COLUMN user_id TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding user_id to topics:', err.message);
      } else if (!err) {
        console.log('✅ Added user_id column to topics table');
      }
    });

    // Add user_id column to practice_sessions table if it doesn't exist  
    this.db.run(`ALTER TABLE practice_sessions ADD COLUMN user_id TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding user_id to practice_sessions:', err.message);
      } else if (!err) {
        console.log('✅ Added user_id column to practice_sessions table');
      }
    });

    // Add note_id column to questions table for note-specific questions
    this.db.run(`ALTER TABLE questions ADD COLUMN note_id TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding note_id to questions:', err.message);
      } else if (!err) {
        console.log('✅ Added note_id column to questions table');
      }
    });
  }

  // ===== FIXED SUBJECTS =====
  
  /**
   * Get all fixed subjects (no database needed)
   */
  async getSubjects() {
    return Promise.resolve([...this.FIXED_SUBJECTS]);
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(subjectId) {
    const subject = this.FIXED_SUBJECTS.find(s => s.id === subjectId);
    return Promise.resolve(subject || null);
  }

  // ===== TOPICS (User Customizable) =====
  
  /**
   * Get topics for a subject
   */
  async getTopics(subjectId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM topics WHERE subject_id = ? ORDER BY created_at DESC';
      this.db.all(sql, [subjectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get all topics across all subjects
   */
  async getAllTopics() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM topics ORDER BY subject_id, created_at DESC';
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get topic by ID
   */
  async getTopicById(topicId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM topics WHERE id = ?';
      this.db.get(sql, [topicId], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  /**
   * Create new topic under a fixed subject
   */
  async createTopic(subjectId, name, description = '') {
    // Validate subject exists in fixed list
    const subject = await this.getSubjectById(subjectId);
    if (!subject) {
      throw new Error(`Invalid subject ID: ${subjectId}`);
    }

    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = 'INSERT INTO topics (id, subject_id, name, description) VALUES (?, ?, ?, ?)';
      
      this.db.run(sql, [id, subjectId, name, description], function(err) {
        if (err) reject(err);
        else {
          resolve({ 
            id, 
            subject_id: subjectId, 
            name, 
            description, 
            created_at: new Date().toISOString() 
          });
        }
      });
    });
  }

  /**
   * Update topic
   */
  async updateTopic(topicId, name, description) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE topics SET name = ?, description = ? WHERE id = ?';
      this.db.run(sql, [name, description, topicId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Get topic with subject information
   */
  async getTopicWithSubject(topicId) {
    return new Promise(async (resolve, reject) => {
      const sql = 'SELECT * FROM topics WHERE id = ?';
      this.db.get(sql, [topicId], async (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          // Add subject information
          const subject = await this.getSubjectById(row.subject_id);
          resolve({
            ...row,
            subject: subject
          });
        }
      });
    });
  }

  /**
   * Search topics by name
   */
  async searchTopics(searchTerm) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM topics 
        WHERE name LIKE ? OR description LIKE ?
        ORDER BY created_at DESC
      `;
      const searchPattern = `%${searchTerm}%`;
      
      this.db.all(sql, [searchPattern, searchPattern], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Delete topic and all related data
   */
  async deleteTopic(topicId) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // Delete user answers first (due to foreign key constraints)
        this.db.run(`DELETE FROM user_answers WHERE question_id IN 
          (SELECT id FROM questions WHERE topic_id = ?)`, [topicId]);
        
        // Delete practice sessions
        this.db.run('DELETE FROM practice_sessions WHERE topic_id = ?', [topicId]);
        
        // Delete questions
        this.db.run('DELETE FROM questions WHERE topic_id = ?', [topicId]);
        
        // Delete notes
        this.db.run('DELETE FROM notes WHERE topic_id = ?', [topicId]);
        
        // Delete topic
        this.db.run('DELETE FROM topics WHERE id = ?', [topicId], function(err) {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
          } else {
            this.db.run('COMMIT');
            resolve({ changes: this.changes });
          }
        });
      });
    });
  }

  // ===== NOTES =====
  
  /**
   * Get notes for a topic
   */
  async getNotes(topicId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM notes WHERE topic_id = ? ORDER BY created_at DESC';
      this.db.all(sql, [topicId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get all notes
   */
  async getAllNotes() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM notes ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get note by ID
   */
  async getNoteById(noteId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM notes WHERE id = ?';
      this.db.get(sql, [noteId], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  /**
     * Create note for a topic - FIXED VERSION
     */
    async createNote(topicId, content, fileName = null) {
    return new Promise((resolve, reject) => {
        const id = uuidv4();
        const wordCount = content.trim().split(/\s+/).length;
        
        // Fixed SQL - removed subject_id column reference
        const sql = 'INSERT INTO notes (id, topic_id, content, file_name, word_count) VALUES (?, ?, ?, ?, ?)';
        
        this.db.run(sql, [id, topicId, content, fileName, wordCount], function(err) {
        if (err) {
            console.error('❌ Database error creating note:', err);
            reject(err);
        } else {
            console.log(`✅ Note created with ID: ${id}`);
            resolve({ 
            id, 
            topic_id: topicId, 
            content, 
            file_name: fileName,
            word_count: wordCount,
            created_at: new Date().toISOString() 
            });
        }
        });
    });
}

  /**
   * Update note
   */
  async updateNote(noteId, content) {
    return new Promise((resolve, reject) => {
      const wordCount = content.trim().split(/\s+/).length;
      const sql = 'UPDATE notes SET content = ?, word_count = ? WHERE id = ?';
      
      this.db.run(sql, [content, wordCount, noteId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Delete note
   */
  async deleteNote(noteId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM notes WHERE id = ?';
      this.db.run(sql, [noteId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  // ===== QUESTIONS =====
  
  /**
   * Get questions for a topic
   */
  async getQuestions(topicId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM questions WHERE topic_id = ? ORDER BY created_at DESC';
      this.db.all(sql, [topicId], (err, rows) => {
        if (err) reject(err);
        else {
          // Parse options for MCQ questions
          const questions = rows.map(row => ({
            ...row,
            options: row.options ? JSON.parse(row.options) : null,
            correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
          }));
          resolve(questions);
        }
      });
    });
  }

  /**
   * Get all questions
   */
  async getAllQuestions() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM questions ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else {
          const questions = rows.map(row => ({
            ...row,
            options: row.options ? JSON.parse(row.options) : null,
            correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
          }));
          resolve(questions);
        }
      });
    });
  }

  /**
   * Get question by ID
   */
  async getQuestionById(questionId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM questions WHERE id = ?';
      this.db.get(sql, [questionId], (err, row) => {
        if (err) reject(err);
        else if (!row) {
          resolve(null);
        } else {
          resolve({
            ...row,
            options: row.options ? JSON.parse(row.options) : null,
            correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
          });
        }
      });
    });
  }

  /**
   * Create question
   */
  async createQuestion(topicId, questionData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const {
        question,
        answer,
        type = 'multiple_choice',
        options = null,
        correctIndex = null,
        explanation = null
      } = questionData;

      const sql = `INSERT INTO questions 
        (id, topic_id, question, answer, type, options, correct_index, explanation) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const optionsJson = options ? JSON.stringify(options) : null;
      
      this.db.run(sql, [
        id, 
        topicId, 
        question, 
        answer, 
        type, 
        optionsJson, 
        correctIndex, 
        explanation
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id, 
            topic_id: topicId, 
            question, 
            answer, 
            type,
            options,
            correct_index: correctIndex,
            explanation,
            created_at: new Date().toISOString() 
          });
        }
      });
    });
  }

  /**
   * Update question
   */
  async updateQuestion(questionId, updates) {
    return new Promise((resolve, reject) => {
      const {
        question,
        answer,
        type,
        options,
        correctIndex,
        explanation
      } = updates;

      const sql = `UPDATE questions SET 
        question = COALESCE(?, question),
        answer = COALESCE(?, answer),
        type = COALESCE(?, type),
        options = COALESCE(?, options),
        correct_index = COALESCE(?, correct_index),
        explanation = COALESCE(?, explanation)
        WHERE id = ?`;
      
      const optionsJson = options ? JSON.stringify(options) : null;
      
      this.db.run(sql, [
        question,
        answer,
        type,
        optionsJson,
        correctIndex,
        explanation,
        questionId
      ], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  /**
   * Delete question
   */
  async deleteQuestion(questionId) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // Delete user answers first
        this.db.run('DELETE FROM user_answers WHERE question_id = ?', [questionId]);
        
        // Delete question
        this.db.run('DELETE FROM questions WHERE id = ?', [questionId], function(err) {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
          } else {
            this.db.run('COMMIT');
            resolve({ changes: this.changes });
          }
        });
      });
    });
  }

  /**
   * Get random questions for practice
   */
  async getRandomQuestions(topicId, count = 5) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM questions WHERE topic_id = ? ORDER BY RANDOM() LIMIT ?';
      this.db.all(sql, [topicId, count], (err, rows) => {
        if (err) reject(err);
        else {
          const questions = rows.map(row => ({
            ...row,
            options: row.options ? JSON.parse(row.options) : null,
            correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
          }));
          resolve(questions);
        }
      });
    });
  }

  /**
   * Get questions by type
   */
  async getQuestionsByType(topicId, type) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM questions WHERE topic_id = ? AND type = ? ORDER BY created_at DESC';
      this.db.all(sql, [topicId, type], (err, rows) => {
        if (err) reject(err);
        else {
          const questions = rows.map(row => ({
            ...row,
            options: row.options ? JSON.parse(row.options) : null,
            correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
          }));
          resolve(questions);
        }
      });
    });
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
            const subject = await this.getSubjectById(row.subject_id);
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
          for (const subject of this.FIXED_SUBJECTS) {
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

  // ===== DATA MANAGEMENT =====
  
  /**
   * Backup data to JSON
   */
  async exportData() {
    try {
      const [topics, notes, questions, sessions, userAnswers] = await Promise.all([
        this.getAllTopics(),
        this.getAllNotes(),
        this.getAllQuestions(),
        this.getAllPracticeSessions(),
        this.getAllUserAnswers()
      ]);

      return {
        subjects: this.FIXED_SUBJECTS,
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

  // ===== USER-SPECIFIC TOPIC METHODS =====
    
    async getTopicsForUser(subjectId, userId) {
        return new Promise((resolve, reject) => {
            let sql, params;
            
            if (subjectId === 'all') {
                sql = 'SELECT * FROM topics WHERE user_id = ? ORDER BY subject_id, created_at DESC';
                params = [userId];
            } else {
                sql = 'SELECT * FROM topics WHERE subject_id = ? AND user_id = ? ORDER BY created_at DESC';
                params = [subjectId, userId];
            }
            
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async createTopicForUser(subjectId, name, description = '', userId) {
        const subject = await this.getSubjectById(subjectId);
        if (!subject) {
            throw new Error(`Invalid subject ID: ${subjectId}`);
        }

        return new Promise((resolve, reject) => {
            const id = require('uuid').v4();
            const sql = 'INSERT INTO topics (id, subject_id, name, description, user_id) VALUES (?, ?, ?, ?, ?)';
            
            this.db.run(sql, [id, subjectId, name, description, userId], function(err) {
                if (err) reject(err);
                else {
                    resolve({ 
                        id, 
                        subject_id: subjectId, 
                        name, 
                        description,
                        user_id: userId,
                        created_at: new Date().toISOString() 
                    });
                }
            });
        });
    }

    async getTopicWithSubjectForUser(topicId, userId) {
        return new Promise(async (resolve, reject) => {
            const sql = 'SELECT * FROM topics WHERE id = ? AND user_id = ?';
            this.db.get(sql, [topicId, userId], async (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    const subject = await this.getSubjectById(row.subject_id);
                    resolve({
                        ...row,
                        subject: subject
                    });
                }
            });
        });
    }

    async deleteTopicForUser(topicId, userId) {
        return new Promise((resolve, reject) => {
            const db = this.db; // Store reference to avoid scope issues
            
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                // Verify topic belongs to user first
                db.get('SELECT id FROM topics WHERE id = ? AND user_id = ?', [topicId, userId], (err, row) => {
                    if (err || !row) {
                        db.run('ROLLBACK');
                        reject(new Error('Topic not found or access denied'));
                        return;
                    }
                    
                    // Delete user answers first
                    db.run(`DELETE FROM user_answers WHERE question_id IN 
                        (SELECT id FROM questions WHERE topic_id = ?)`, [topicId]);
                    
                    // Delete practice sessions
                    db.run('DELETE FROM practice_sessions WHERE topic_id = ? AND user_id = ?', [topicId, userId]);
                    
                    // Delete questions
                    db.run('DELETE FROM questions WHERE topic_id = ?', [topicId]);
                    
                    // Delete notes
                    db.run('DELETE FROM notes WHERE topic_id = ?', [topicId]);
                    
                    // Delete topic
                    db.run('DELETE FROM topics WHERE id = ? AND user_id = ?', [topicId, userId], function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            reject(err);
                        } else {
                            db.run('COMMIT');
                            resolve({ changes: this.changes });
                        }
                    });
                });
            });
        });
    }

    async searchTopicsForUser(searchTerm, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM topics 
                WHERE (name LIKE ? OR description LIKE ?) AND user_id = ?
                ORDER BY created_at DESC
            `;
            const searchPattern = `%${searchTerm}%`;
            
            this.db.all(sql, [searchPattern, searchPattern, userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // ===== USER-SPECIFIC NOTE METHODS =====
    
    async getNotesForUser(topicId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT n.* FROM notes n
                JOIN topics t ON n.topic_id = t.id
                WHERE n.topic_id = ? AND t.user_id = ?
                ORDER BY n.created_at DESC
            `;
            
            this.db.all(sql, [topicId, userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async getNoteWithTopicForUser(noteId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    n.*,
                    t.name as topic_name,
                    t.subject_id,
                    t.id as topic_id
                FROM notes n
                JOIN topics t ON n.topic_id = t.id
                WHERE n.id = ? AND t.user_id = ?
            `;
            
            this.db.get(sql, [noteId, userId], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    // Add subject name from FIXED_SUBJECTS array
                    const subject = this.FIXED_SUBJECTS.find(s => s.id === row.subject_id);
                    const noteWithSubject = {
                        ...row,
                        subject_name: subject ? subject.name : row.subject_id
                    };
                    resolve(noteWithSubject);
                } else {
                    resolve(null);
                }
            });
        });
    }

    async createNoteForUser(topicId, content, fileName = null, userId) {
        return new Promise((resolve, reject) => {
            // First verify topic belongs to user
            this.db.get('SELECT id FROM topics WHERE id = ? AND user_id = ?', [topicId, userId], (err, row) => {
                if (err || !row) {
                    reject(new Error('Topic not found or access denied'));
                    return;
                }
                
                const id = require('uuid').v4();
                const wordCount = content.trim().split(/\s+/).length;
                
                const sql = 'INSERT INTO notes (id, topic_id, content, file_name, word_count) VALUES (?, ?, ?, ?, ?)';
                
                this.db.run(sql, [id, topicId, content, fileName, wordCount], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ 
                            id, 
                            topic_id: topicId, 
                            content, 
                            file_name: fileName,
                            word_count: wordCount,
                            created_at: new Date().toISOString() 
                        });
                    }
                });
            });
        });
    }

    async deleteNoteForUser(noteId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                DELETE FROM notes 
                WHERE id = ? AND topic_id IN (
                    SELECT id FROM topics WHERE user_id = ?
                )
            `;
            
            this.db.run(sql, [noteId, userId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    // ===== USER-SPECIFIC QUESTION METHODS =====
    
    async getQuestionsForUser(topicId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT q.* FROM questions q
                JOIN topics t ON q.topic_id = t.id
                WHERE q.topic_id = ? AND t.user_id = ?
                ORDER BY q.created_at DESC
            `;
            
            this.db.all(sql, [topicId, userId], (err, rows) => {
                if (err) reject(err);
                else {
                    const questions = rows.map(row => ({
                        ...row,
                        options: row.options ? JSON.parse(row.options) : null,
                        correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
                    }));
                    resolve(questions);
                }
            });
        });
    }

    async createQuestionForUser(questionData, userId) {
        return new Promise((resolve, reject) => {
            const { topicId, noteId } = questionData;
            
            // First verify topic belongs to user
            this.db.get('SELECT id FROM topics WHERE id = ? AND user_id = ?', [topicId, userId], (err, row) => {
                if (err || !row) {
                    reject(new Error('Topic not found or access denied'));
                    return;
                }
                
                const id = require('uuid').v4();
                const {
                    question,
                    answer,
                    type = 'multiple_choice',
                    options = null,
                    correctIndex = null,
                    explanation = null
                } = questionData;

                const sql = `INSERT INTO questions 
                    (id, topic_id, note_id, question, answer, type, options, correct_index, explanation) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                
                const optionsJson = options ? JSON.stringify(options) : null;
                
                this.db.run(sql, [
                    id, topicId, noteId, question, answer, type, optionsJson, correctIndex, explanation
                ], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ 
                            id, 
                            topic_id: topicId,
                            note_id: noteId, 
                            question, 
                            answer, 
                            type,
                            options,
                            correct_index: correctIndex,
                            explanation,
                            created_at: new Date().toISOString() 
                        });
                    }
                });
            });
        });
    }

    async getRandomQuestionsForUser(topicId, count = 5, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT q.* FROM questions q
                JOIN topics t ON q.topic_id = t.id
                WHERE q.topic_id = ? AND t.user_id = ?
                ORDER BY RANDOM() LIMIT ?
            `;
            
            this.db.all(sql, [topicId, userId, count], (err, rows) => {
                if (err) reject(err);
                else {
                    const questions = rows.map(row => ({
                        ...row,
                        options: row.options ? JSON.parse(row.options) : null,
                        correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
                    }));
                    resolve(questions);
                }
            });
        });
    }

    async updateQuestionForUser(questionId, updates, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE questions SET 
                question = COALESCE(?, question),
                answer = COALESCE(?, answer),
                type = COALESCE(?, type),
                options = COALESCE(?, options),
                correct_index = COALESCE(?, correct_index),
                explanation = COALESCE(?, explanation)
                WHERE id = ? AND topic_id IN (
                    SELECT id FROM topics WHERE user_id = ?
                )
            `;
            
            const {
                question, answer, type, options, correctIndex, explanation
            } = updates;
            
            const optionsJson = options ? JSON.stringify(options) : null;
            
            this.db.run(sql, [
                question, answer, type, optionsJson, correctIndex, explanation, questionId, userId
            ], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    }

    async deleteQuestionForUser(questionId, userId) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                
                // Delete user answers first
                this.db.run('DELETE FROM user_answers WHERE question_id = ?', [questionId]);
                
                // Delete question (with user verification)
                this.db.run(`
                    DELETE FROM questions 
                    WHERE id = ? AND topic_id IN (
                        SELECT id FROM topics WHERE user_id = ?
                    )
                `, [questionId, userId], function(err) {
                    if (err) {
                        this.db.run('ROLLBACK');
                        reject(err);
                    } else {
                        this.db.run('COMMIT');
                        resolve({ changes: this.changes });
                    }
                });
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
                
                const id = require('uuid').v4();
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
                        const subject = await this.getSubjectById(row.subject_id);
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
                    for (const subject of this.FIXED_SUBJECTS) {
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

    async exportDataForUser(userId) {
        try {
            const [topics, notes, questions, sessions] = await Promise.all([
                this.getTopicsForUser('all', userId),
                this.getAllNotesForUser(userId),
                this.getAllQuestionsForUser(userId),
                this.getAllPracticeSessionsForUser(userId)
            ]);

            return {
                subjects: this.FIXED_SUBJECTS,
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

    async getAllNotesForUser(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT n.* FROM notes n
                JOIN topics t ON n.topic_id = t.id
                WHERE t.user_id = ?
                ORDER BY n.created_at DESC
            `;
            
            this.db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async getAllQuestionsForUser(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT q.* FROM questions q
                JOIN topics t ON q.topic_id = t.id
                WHERE t.user_id = ?
                ORDER BY q.created_at DESC
            `;
            
            this.db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else {
                    const questions = rows.map(row => ({
                        ...row,
                        options: row.options ? JSON.parse(row.options) : null,
                        correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
                    }));
                    resolve(questions);
                }
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

    // ===== NOTE-SPECIFIC QUESTION METHODS =====

    async getQuestionsForNote(noteId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT q.* FROM questions q
                JOIN topics t ON q.topic_id = t.id
                WHERE q.note_id = ? AND t.user_id = ?
                ORDER BY q.created_at DESC
            `;
            
            this.db.all(sql, [noteId, userId], (err, rows) => {
                if (err) reject(err);
                else {
                    const questions = rows.map(row => ({
                        ...row,
                        options: row.options ? JSON.parse(row.options) : null,
                        correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
                    }));
                    resolve(questions);
                }
            });
        });
    }

    async getRandomQuestionsForNote(noteId, count = 5, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT q.* FROM questions q
                JOIN topics t ON q.topic_id = t.id
                WHERE q.note_id = ? AND t.user_id = ?
                ORDER BY RANDOM() LIMIT ?
            `;
            
            this.db.all(sql, [noteId, userId, count], (err, rows) => {
                if (err) reject(err);
                else {
                    const questions = rows.map(row => ({
                        ...row,
                        options: row.options ? JSON.parse(row.options) : null,
                        correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
                    }));
                    resolve(questions);
                }
            });
        });
    }

    async getNotesWithQuestionCounts(topicId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    n.*,
                    COUNT(q.id) as question_count
                FROM notes n
                JOIN topics t ON n.topic_id = t.id
                LEFT JOIN questions q ON n.id = q.note_id
                WHERE n.topic_id = ? AND t.user_id = ?
                GROUP BY n.id
                ORDER BY n.created_at DESC
            `;
            
            this.db.all(sql, [topicId, userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async getNotesForSubject(subjectId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    n.*,
                    t.name as topic_name,
                    t.subject_id
                FROM notes n
                JOIN topics t ON n.topic_id = t.id
                WHERE t.subject_id = ? AND t.user_id = ?
                ORDER BY n.created_at DESC
            `;
            
            this.db.all(sql, [subjectId, userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Add subject name from FIXED_SUBJECTS array
                    const subject = this.FIXED_SUBJECTS.find(s => s.id === subjectId);
                    const notesWithSubject = (rows || []).map(row => ({
                        ...row,
                        subject_name: subject ? subject.name : subjectId
                    }));
                    resolve(notesWithSubject);
                }
            });
        });
    }

    async getAllNotesForUser(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    n.*,
                    t.name as topic_name,
                    t.subject_id
                FROM notes n
                JOIN topics t ON n.topic_id = t.id
                WHERE t.user_id = ?
                ORDER BY n.created_at DESC
            `;
            
            this.db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Add subject names from FIXED_SUBJECTS array
                    const notesWithSubjects = (rows || []).map(row => {
                        const subject = this.FIXED_SUBJECTS.find(s => s.id === row.subject_id);
                        return {
                            ...row,
                            subject_name: subject ? subject.name : row.subject_id
                        };
                    });
                    resolve(notesWithSubjects);
                }
            });
        });
    }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = SimplifiedDatabaseService;