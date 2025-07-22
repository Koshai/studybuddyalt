// src/server/services/database.js - FIXED VERSION for MCQ
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DatabaseService {
  constructor() {
    this.db = null;
  }

  init() {
    const dbPath = path.join(__dirname, '../../data/study_ai.db');
    
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(dbPath);
    if (!require('fs').existsSync(dataDir)) {
      require('fs').mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES subjects (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        content TEXT NOT NULL,
        file_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subject_id) REFERENCES subjects (id),
        FOREIGN KEY (topic_id) REFERENCES topics (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        difficulty TEXT DEFAULT 'medium',
        type TEXT DEFAULT 'text',
        options TEXT,
        correct_index INTEGER,
        explanation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_attempts (
        id TEXT PRIMARY KEY,
        question_id TEXT NOT NULL,
        user_answer TEXT,
        is_correct BOOLEAN,
        attempt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions (id)
      )`
    ];

    // Add new columns to existing questions table if they don't exist
    const alterTableQueries = [
      `ALTER TABLE questions ADD COLUMN type TEXT DEFAULT 'text'`,
      `ALTER TABLE questions ADD COLUMN options TEXT`,
      `ALTER TABLE questions ADD COLUMN correct_index INTEGER`,
      `ALTER TABLE questions ADD COLUMN explanation TEXT`
    ];

    alterTableQueries.forEach(sql => {
      this.db.run(sql, (err) => {
        // Ignore errors for already existing columns
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error altering table:', err);
        }
      });
    });

    tables.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err) {
          console.error('Error creating table:', err);
        }
      });
    });
  }

  // Subject operations
  async getSubjects() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM subjects ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async createSubject(name, description) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = 'INSERT INTO subjects (id, name, description) VALUES (?, ?, ?)';
      
      this.db.run(sql, [id, name, description], function(err) {
        if (err) reject(err);
        else {
          resolve({ id, name, description, created_at: new Date().toISOString() });
        }
      });
    });
  }

  // Topic operations
  async getTopics(subjectId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM topics WHERE subject_id = ? ORDER BY created_at DESC';
      this.db.all(sql, [subjectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async createTopic(subjectId, name, description) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = 'INSERT INTO topics (id, subject_id, name, description) VALUES (?, ?, ?, ?)';
      
      this.db.run(sql, [id, subjectId, name, description], function(err) {
        if (err) reject(err);
        else {
          resolve({ id, subject_id: subjectId, name, description, created_at: new Date().toISOString() });
        }
      });
    });
  }

  // Note operations
  async getNotes(topicId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM notes WHERE topic_id = ? ORDER BY created_at DESC';
      this.db.all(sql, [topicId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async createNote(subjectId, topicId, content, fileName) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = 'INSERT INTO notes (id, subject_id, topic_id, content, file_name) VALUES (?, ?, ?, ?, ?)';
      
      this.db.run(sql, [id, subjectId, topicId, content, fileName], function(err) {
        if (err) reject(err);
        else {
          resolve({ 
            id, 
            subject_id: subjectId, 
            topic_id: topicId, 
            content, 
            file_name: fileName,
            created_at: new Date().toISOString() 
          });
        }
      });
    });
  }

  // Enhanced Question operations with proper MCQ support
  async getQuestions(topicId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM questions WHERE topic_id = ? ORDER BY created_at DESC';
      this.db.all(sql, [topicId], (err, rows) => {
        if (err) reject(err);
        else {
          // Parse options and ensure correct_index is a number
          const questions = rows.map(row => {
            const question = {
              ...row,
              options: row.options ? JSON.parse(row.options) : null,
              correct_index: row.correct_index !== null ? parseInt(row.correct_index) : null
            };
            
            console.log('Retrieved question from DB:', {
              id: question.id,
              type: question.type,
              correct_index: question.correct_index,
              options: question.options
            });
            
            return question;
          });
          resolve(questions);
        }
      });
    });
  }

  async getRandomQuestions(topicId, count = 5) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM questions WHERE topic_id = ? ORDER BY RANDOM() LIMIT ?';
      this.db.all(sql, [topicId, count], (err, rows) => {
        if (err) reject(err);
        else {
          // Parse options and ensure correct_index is a number
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

  async createQuestion(topicId, questionData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const {
        question,
        answer,
        difficulty = 'medium',
        type = 'text',
        options = null,
        correctIndex = null,
        explanation = null
      } = questionData;

      console.log('Creating question in DB:', {
        id,
        topicId,
        question: question.substring(0, 50) + '...',
        type,
        correctIndex,
        optionsCount: options ? options.length : 0
      });

      const sql = `INSERT INTO questions 
        (id, topic_id, question, answer, difficulty, type, options, correct_index, explanation) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const optionsJson = options ? JSON.stringify(options) : null;
      
      this.db.run(sql, [
        id, 
        topicId, 
        question, 
        answer, 
        difficulty, 
        type, 
        optionsJson, 
        correctIndex, 
        explanation
      ], function(err) {
        if (err) {
          console.error('Error creating question:', err);
          reject(err);
        } else {
          console.log('Question created successfully:', id);
          resolve({ 
            id, 
            topic_id: topicId, 
            question, 
            answer, 
            difficulty,
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

  // Backward compatibility method for old API calls
  async createQuestionLegacy(topicId, question, answer, difficulty = 'medium') {
    return this.createQuestion(topicId, {
      question,
      answer,
      difficulty,
      type: 'text'
    });
  }

  // User attempt operations
  async createUserAttempt(questionId, userAnswer, isCorrect) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = 'INSERT INTO user_attempts (id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)';
      
      this.db.run(sql, [id, questionId, userAnswer, isCorrect], function(err) {
        if (err) reject(err);
        else {
          resolve({ 
            id, 
            question_id: questionId, 
            user_answer: userAnswer, 
            is_correct: isCorrect,
            attempt_date: new Date().toISOString() 
          });
        }
      });
    });
  }

  async getTopicStats(topicId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(DISTINCT q.id) as total_questions,
          COUNT(DISTINCT ua.id) as total_attempts,
          AVG(CASE WHEN ua.is_correct = 1 THEN 1.0 ELSE 0.0 END) as accuracy_rate,
          COUNT(DISTINCT CASE WHEN q.type = 'multiple_choice' THEN q.id END) as mcq_count,
          COUNT(DISTINCT CASE WHEN q.type = 'text' THEN q.id END) as text_count
        FROM questions q
        LEFT JOIN user_attempts ua ON q.id = ua.question_id
        WHERE q.topic_id = ?
      `;
      
      this.db.get(sql, [topicId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

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

module.exports = DatabaseService;