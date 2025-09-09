// src/server/services/feedback-db-service.js - Feedback Database Service Module
const { v4: uuidv4 } = require('uuid');

class FeedbackDbService {
  constructor(db) {
    this.db = db;
    this.initializeSchema();
  }

  /**
   * Initialize feedback table schema
   */
  initializeSchema() {
    const createFeedbackTable = `
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'general', 'other')),
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        user_email TEXT,
        user_id TEXT,
        user_agent TEXT,
        status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'closed')),
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createFeedbackTable, (err) => {
      if (err) {
        console.error('❌ Error creating feedback table:', err);
      } else {
        console.log('✅ Feedback table initialized successfully');
      }
    });

    // Create index for better performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status)',
      'CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type)',
      'CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority)'
    ];

    createIndexes.forEach(indexSql => {
      this.db.run(indexSql, (err) => {
        if (err) {
          console.error('❌ Error creating feedback index:', err);
        }
      });
    });
  }

  /**
   * Submit new feedback
   */
  async submitFeedback(feedbackData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const {
        type,
        subject,
        message,
        userEmail,
        userId,
        userAgent
      } = feedbackData;

      const sql = `
        INSERT INTO feedback (
          id, type, subject, message, user_email, user_id, user_agent, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [id, type, subject, message, userEmail, userId, userAgent], function(err) {
        if (err) {
          console.error('❌ Error inserting feedback:', err);
          reject(err);
        } else {
          console.log('✅ Feedback saved with ID:', id);
          resolve({
            id,
            type,
            subject,
            message,
            userEmail,
            userId,
            userAgent,
            status: 'new',
            priority: 'normal',
            createdAt: new Date().toISOString()
          });
        }
      });
    });
  }

  /**
   * Get all feedback with pagination and filtering
   */
  async getAllFeedback(options = {}) {
    return new Promise((resolve, reject) => {
      const {
        limit = 50,
        offset = 0,
        status = null,
        type = null,
        priority = null,
        orderBy = 'created_at',
        orderDirection = 'DESC'
      } = options;

      let sql = 'SELECT * FROM feedback WHERE 1=1';
      let params = [];

      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }

      if (type) {
        sql += ' AND type = ?';
        params.push(type);
      }

      if (priority) {
        sql += ' AND priority = ?';
        params.push(priority);
      }

      sql += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Error fetching feedback:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get feedback by ID
   */
  async getFeedbackById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM feedback WHERE id = ?';
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('❌ Error fetching feedback by ID:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Update feedback status, priority, or admin notes
   */
  async updateFeedback(id, updates) {
    return new Promise((resolve, reject) => {
      const allowedFields = ['status', 'priority', 'admin_notes'];
      const updateFields = [];
      const params = [];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          params.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        return reject(new Error('No valid fields to update'));
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const sql = `UPDATE feedback SET ${updateFields.join(', ')} WHERE id = ?`;

      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Error updating feedback:', err);
          reject(err);
        } else {
          console.log('✅ Feedback updated:', id);
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats() {
    return new Promise((resolve, reject) => {
      const statsQueries = [
        'SELECT COUNT(*) as total FROM feedback',
        'SELECT COUNT(*) as new FROM feedback WHERE status = "new"',
        'SELECT COUNT(*) as high_priority FROM feedback WHERE priority = "high"',
        'SELECT type, COUNT(*) as count FROM feedback GROUP BY type',
        'SELECT status, COUNT(*) as count FROM feedback GROUP BY status'
      ];

      Promise.all(statsQueries.map(sql => {
        return new Promise((res, rej) => {
          this.db.all(sql, (err, rows) => {
            if (err) rej(err);
            else res(rows);
          });
        });
      })).then(results => {
        resolve({
          total: results[0][0].total,
          new: results[1][0].new,
          highPriority: results[2][0].high_priority,
          byType: results[3],
          byStatus: results[4]
        });
      }).catch(reject);
    });
  }

  /**
   * Delete feedback (admin only)
   */
  async deleteFeedback(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM feedback WHERE id = ?';
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('❌ Error deleting feedback:', err);
          reject(err);
        } else {
          console.log('✅ Feedback deleted:', id);
          resolve({ id, changes: this.changes });
        }
      });
    });
  }
}

module.exports = FeedbackDbService;