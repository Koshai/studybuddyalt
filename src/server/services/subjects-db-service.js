// src/server/services/subjects-db-service.js - Subjects Database Service Module
const { v4: uuidv4 } = require('uuid');

class SubjectsDbService {
  constructor(db) {
    this.db = db;
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

  // ===== SUBJECTS (Fixed List + Database Table) =====
  
  /**
   * Create subjects table and populate with fixed subjects
   */
  async createSubjectsTable() {
    return new Promise((resolve, reject) => {
      // Create subjects table
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS subjects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          color TEXT
        )
      `;
      
      this.db.run(createTableSql, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Clear existing subjects and insert fixed subjects
        this.db.run('DELETE FROM subjects', (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Insert all fixed subjects
          const insertSql = `
            INSERT INTO subjects (id, name, description, icon, color) 
            VALUES (?, ?, ?, ?, ?)
          `;
          
          let completed = 0;
          const total = this.FIXED_SUBJECTS.length;
          
          this.FIXED_SUBJECTS.forEach(subject => {
            this.db.run(insertSql, [
              subject.id,
              subject.name, 
              subject.description,
              subject.icon,
              subject.color
            ], (err) => {
              if (err) {
                reject(err);
                return;
              }
              
              completed++;
              if (completed === total) {
                console.log(`✅ Created subjects table with ${total} subjects`);
                resolve(total);
              }
            });
          });
        });
      });
    });
  }
  
  /**
   * Get all subjects (from database if exists, fallback to hardcoded)
   */
  async getSubjects() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM subjects ORDER BY name';
      this.db.all(sql, (err, rows) => {
        if (err) {
          // If subjects table doesn't exist, return hardcoded subjects
          console.log('📝 Subjects table not found, using hardcoded subjects');
          resolve([...this.FIXED_SUBJECTS]);
        } else {
          resolve(rows || [...this.FIXED_SUBJECTS]);
        }
      });
    });
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(subjectId) {
    const subject = this.FIXED_SUBJECTS.find(s => s.id === subjectId);
    return Promise.resolve(subject || null);
  }
}

module.exports = SubjectsDbService;