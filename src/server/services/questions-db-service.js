// src/server/services/questions-db-service.js - Questions Database Service Module
const { v4: uuidv4 } = require('uuid');

class QuestionsDbService {
  constructor(db) {
    this.db = db;
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
}

module.exports = QuestionsDbService;