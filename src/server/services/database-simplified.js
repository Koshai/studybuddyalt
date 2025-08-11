// src/server/services/database-simplified.js - REFACTORED Modular Database Service
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import modular database services
const SubjectsDbService = require('./subjects-db-service');
const TopicsDbService = require('./topics-db-service');
const NotesDbService = require('./notes-db-service');
const QuestionsDbService = require('./questions-db-service');
const PracticeDbService = require('./practice-db-service');
const DataDbService = require('./data-db-service');

class SimplifiedDatabaseService {
  constructor() {
    this.db = null;
    // Initialize service modules (will be done after database connection)
    this.subjectsService = null;
    this.topicsService = null;
    this.notesService = null;
    this.questionsService = null;
    this.practiceService = null;
    this.dataService = null;
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
        
        // Initialize service modules with database connection
        this.initializeServices();
        
        this.createTables();
        
        // Test the connection immediately
        this.testConnection();
      }
    });
  }

  /**
   * Initialize all service modules with database connection
   */
  initializeServices() {
    this.subjectsService = new SubjectsDbService(this.db);
    this.topicsService = new TopicsDbService(this.db, this.subjectsService);
    this.notesService = new NotesDbService(this.db, this.subjectsService);
    this.questionsService = new QuestionsDbService(this.db);
    this.practiceService = new PracticeDbService(this.db, this.subjectsService);
    this.dataService = new DataDbService(
      this.db, 
      this.subjectsService, 
      this.topicsService, 
      this.notesService, 
      this.questionsService, 
      this.practiceService
    );
    
    console.log('✅ Database service modules initialized');
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
    // Use setTimeout to ensure tables are created first
    setTimeout(() => {
      this.addMissingColumns();
    }, 1000);
    
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

    // Add updated_at columns for sync compatibility
    const tablesNeedingUpdatedAt = ['topics', 'notes', 'questions', 'practice_sessions', 'user_answers'];
    tablesNeedingUpdatedAt.forEach(table => {
      this.db.run(`ALTER TABLE ${table} ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error(`Error adding updated_at to ${table}:`, err.message);
        } else if (!err) {
          console.log(`✅ Added updated_at column to ${table} table`);
        }
      });
    });

    // Add last_synced columns for sync tracking
    tablesNeedingUpdatedAt.forEach(table => {
      this.db.run(`ALTER TABLE ${table} ADD COLUMN last_synced DATETIME`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error(`Error adding last_synced to ${table}:`, err.message);
        } else if (!err) {
          console.log(`✅ Added last_synced column to ${table} table`);
        }
      });
    });
  }

  // ===== SUBJECTS (Delegated to SubjectsDbService) =====
  
  async createSubjectsTable() {
    return this.subjectsService.createSubjectsTable();
  }
  
  async getSubjects() {
    return this.subjectsService.getSubjects();
  }

  async getSubjectById(subjectId) {
    return this.subjectsService.getSubjectById(subjectId);
  }

  // Provide access to FIXED_SUBJECTS for backwards compatibility
  get FIXED_SUBJECTS() {
    return this.subjectsService?.FIXED_SUBJECTS || [];
  }

  // ===== TOPICS (Delegated to TopicsDbService) =====
  
  async getTopics(subjectId) {
    return this.topicsService.getTopics(subjectId);
  }

  async getAllTopics() {
    return this.topicsService.getAllTopics();
  }

  async getTopicById(topicId) {
    return this.topicsService.getTopicById(topicId);
  }

  async createTopic(subjectId, name, description = '') {
    return this.topicsService.createTopic(subjectId, name, description);
  }

  async updateTopic(topicId, name, description) {
    return this.topicsService.updateTopic(topicId, name, description);
  }

  async getTopicWithSubject(topicId) {
    return this.topicsService.getTopicWithSubject(topicId);
  }

  async searchTopics(searchTerm) {
    return this.topicsService.searchTopics(searchTerm);
  }

  async deleteTopic(topicId) {
    return this.topicsService.deleteTopic(topicId);
  }

  // User-specific topic methods
  async getTopicsForUser(subjectId, userId) {
    return this.topicsService.getTopicsForUser(subjectId, userId);
  }

  async createTopicForUser(subjectId, name, description = '', userId) {
    return this.topicsService.createTopicForUser(subjectId, name, description, userId);
  }

  async getTopicWithSubjectForUser(topicId, userId) {
    return this.topicsService.getTopicWithSubjectForUser(topicId, userId);
  }

  async deleteTopicForUser(topicId, userId) {
    return this.topicsService.deleteTopicForUser(topicId, userId);
  }

  async searchTopicsForUser(searchTerm, userId) {
    return this.topicsService.searchTopicsForUser(searchTerm, userId);
  }

  // ===== NOTES (Delegated to NotesDbService) =====
  
  async getNotes(topicId) {
    return this.notesService.getNotes(topicId);
  }

  async getAllNotes() {
    return this.notesService.getAllNotes();
  }

  async getNoteById(noteId) {
    return this.notesService.getNoteById(noteId);
  }

  async createNote(topicId, content, fileName = null) {
    return this.notesService.createNote(topicId, content, fileName);
  }

  async updateNote(noteId, content) {
    return this.notesService.updateNote(noteId, content);
  }

  async deleteNote(noteId) {
    return this.notesService.deleteNote(noteId);
  }

  // User-specific note methods
  async getNotesForUser(topicId, userId) {
    return this.notesService.getNotesForUser(topicId, userId);
  }

  async getNoteWithTopicForUser(noteId, userId) {
    return this.notesService.getNoteWithTopicForUser(noteId, userId);
  }

  async createNoteForUser(topicId, content, fileName = null, userId) {
    return this.notesService.createNoteForUser(topicId, content, fileName, userId);
  }

  async updateNoteForUser(noteId, updateData, userId) {
    return this.notesService.updateNoteForUser(noteId, updateData, userId);
  }

  async deleteNoteForUser(noteId, userId) {
    return this.notesService.deleteNoteForUser(noteId, userId);
  }

  async getNotesWithQuestionCounts(topicId, userId) {
    return this.notesService.getNotesWithQuestionCounts(topicId, userId);
  }

  async getNotesForSubject(subjectId, userId) {
    return this.notesService.getNotesForSubject(subjectId, userId);
  }

  async getAllNotesForUser(userId) {
    return this.notesService.getAllNotesForUser(userId);
  }

  // ===== QUESTIONS (Delegated to QuestionsDbService) =====
  
  async getQuestions(topicId) {
    return this.questionsService.getQuestions(topicId);
  }

  async getAllQuestions() {
    return this.questionsService.getAllQuestions();
  }

  async getQuestionById(questionId) {
    return this.questionsService.getQuestionById(questionId);
  }

  async createQuestion(topicId, questionData) {
    return this.questionsService.createQuestion(topicId, questionData);
  }

  async updateQuestion(questionId, updates) {
    return this.questionsService.updateQuestion(questionId, updates);
  }

  async deleteQuestion(questionId) {
    return this.questionsService.deleteQuestion(questionId);
  }

  async getRandomQuestions(topicId, count = 5) {
    return this.questionsService.getRandomQuestions(topicId, count);
  }

  async getQuestionsByType(topicId, type) {
    return this.questionsService.getQuestionsByType(topicId, type);
  }

  // User-specific question methods
  async getQuestionsForUser(topicId, userId) {
    return this.questionsService.getQuestionsForUser(topicId, userId);
  }

  async createQuestionForUser(questionData, userId) {
    return this.questionsService.createQuestionForUser(questionData, userId);
  }

  async getRandomQuestionsForUser(topicId, count = 5, userId) {
    return this.questionsService.getRandomQuestionsForUser(topicId, count, userId);
  }

  async updateQuestionForUser(questionId, updates, userId) {
    return this.questionsService.updateQuestionForUser(questionId, updates, userId);
  }

  async deleteQuestionForUser(questionId, userId) {
    return this.questionsService.deleteQuestionForUser(questionId, userId);
  }

  // Note-specific question methods
  async getQuestionsForNote(noteId, userId) {
    return this.questionsService.getQuestionsForNote(noteId, userId);
  }

  async getRandomQuestionsForNote(noteId, count = 5, userId) {
    return this.questionsService.getRandomQuestionsForNote(noteId, count, userId);
  }

  async getAllQuestionsForUser(userId) {
    return this.questionsService.getAllQuestionsForUser(userId);
  }

  // ===== PRACTICE SESSIONS (Delegated to PracticeDbService) =====
  
  async recordPracticeSession(topicId, questionsCount, correctAnswers) {
    return this.practiceService.recordPracticeSession(topicId, questionsCount, correctAnswers);
  }

  async getAllPracticeSessions() {
    return this.practiceService.getAllPracticeSessions();
  }

  async getPracticeSessionsForTopic(topicId) {
    return this.practiceService.getPracticeSessionsForTopic(topicId);
  }

  async recordUserAnswer(questionId, practiceSessionId, userAnswer, isCorrect, timeTaken = 0) {
    return this.practiceService.recordUserAnswer(questionId, practiceSessionId, userAnswer, isCorrect, timeTaken);
  }

  async getUserAnswersForSession(practiceSessionId) {
    return this.practiceService.getUserAnswersForSession(practiceSessionId);
  }

  async getAllUserAnswers() {
    return this.practiceService.getAllUserAnswers();
  }

  // User-specific practice methods
  async recordPracticeSessionForUser(topicId, questionsCount, correctAnswers, userId) {
    return this.practiceService.recordPracticeSessionForUser(topicId, questionsCount, correctAnswers, userId);
  }

  async getAllPracticeSessionsForUser(userId) {
    return this.practiceService.getAllPracticeSessionsForUser(userId);
  }

  // ===== STATISTICS (Delegated to PracticeDbService) =====
  
  async getTopicStats(topicId) {
    return this.practiceService.getTopicStats(topicId);
  }

  async getDashboardStats() {
    return this.practiceService.getDashboardStats();
  }

  async getSubjectStats() {
    return this.practiceService.getSubjectStats();
  }

  async getRecentActivity(limit = 10) {
    return this.practiceService.getRecentActivity(limit);
  }

  async getLearningStreak() {
    return this.practiceService.getLearningStreak();
  }

  async getPerformanceTrends(days = 30) {
    return this.practiceService.getPerformanceTrends(days);
  }

  // User-specific statistics
  async getTopicStatsForUser(topicId, userId) {
    return this.practiceService.getTopicStatsForUser(topicId, userId);
  }

  async getDashboardStatsForUser(userId) {
    return this.practiceService.getDashboardStatsForUser(userId);
  }

  async getSubjectStatsForUser(userId) {
    return this.practiceService.getSubjectStatsForUser(userId);
  }

  async getRecentActivityForUser(limit = 10, userId) {
    return this.practiceService.getRecentActivityForUser(limit, userId);
  }

  // ===== DATA MANAGEMENT (Delegated to DataDbService) =====
  
  async exportData() {
    return this.dataService.exportData();
  }

  async importData(data) {
    return this.dataService.importData(data);
  }

  async cleanupOldData(days = 365) {
    return this.dataService.cleanupOldData(days);
  }

  async optimizeDatabase() {
    return this.dataService.optimizeDatabase();
  }

  async getDatabaseInfo() {
    return this.dataService.getDatabaseInfo();
  }

  async testConnection() {
    return this.dataService.testConnection();
  }

  async exportDataForUser(userId) {
    return this.dataService.exportDataForUser(userId);
  }

  // ===== UTILITY METHODS =====
  
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