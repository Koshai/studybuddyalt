// src/server/services/topics-db-service.js - Topics Database Service Module
const { v4: uuidv4 } = require('uuid');

class TopicsDbService {
  constructor(db, subjectsService) {
    this.db = db;
    this.subjectsService = subjectsService;
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
    const subject = await this.subjectsService.getSubjectById(subjectId);
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
          const subject = await this.subjectsService.getSubjectById(row.subject_id);
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
    const subject = await this.subjectsService.getSubjectById(subjectId);
    if (!subject) {
      throw new Error(`Invalid subject ID: ${subjectId}`);
    }

    return new Promise((resolve, reject) => {
      const id = uuidv4();
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
          const subject = await this.subjectsService.getSubjectById(row.subject_id);
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
}

module.exports = TopicsDbService;