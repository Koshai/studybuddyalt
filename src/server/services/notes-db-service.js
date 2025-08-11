// src/server/services/notes-db-service.js - Notes Database Service Module
const { v4: uuidv4 } = require('uuid');

class NotesDbService {
  constructor(db, subjectsService) {
    this.db = db;
    this.subjectsService = subjectsService;
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
          t.id as topic_id,
          s.name as subject_name
        FROM notes n
        JOIN topics t ON n.topic_id = t.id
        JOIN subjects s ON t.subject_id = s.id
        WHERE n.id = ? AND t.user_id = ?
      `;
      
      this.db.get(sql, [noteId, userId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          // Add subject name from FIXED_SUBJECTS array
          const subject = this.subjectsService.FIXED_SUBJECTS.find(s => s.id === row.subject_id);
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
        
        const id = uuidv4();
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

  async updateNoteForUser(noteId, updateData, userId) {
    return new Promise((resolve, reject) => {
      // Build dynamic SQL based on provided fields
      const allowedFields = ['content', 'file_name']; // Only fields that exist in the table
      const updates = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      if (updates.length === 0) {
        return reject(new Error('No valid fields to update'));
      }
      
      // Add noteId and userId to values for WHERE clause
      values.push(noteId, userId);
      
      const sql = `
        UPDATE notes 
        SET ${updates.join(', ')}
        WHERE id = ? AND topic_id IN (
          SELECT id FROM topics WHERE user_id = ?
        )
      `;
      
      this.db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
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
          const subject = this.subjectsService.FIXED_SUBJECTS.find(s => s.id === subjectId);
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
            const subject = this.subjectsService.FIXED_SUBJECTS.find(s => s.id === row.subject_id);
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
}

module.exports = NotesDbService;