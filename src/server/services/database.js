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

  // Update createTables method to include categories
  createTables() {
    const tables = [
      // Subject Categories table
      `CREATE TABLE IF NOT EXISTS subject_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        domain_type TEXT NOT NULL,
        ai_instructions TEXT,
        keywords TEXT,
        icon TEXT,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Updated subjects table with category
      `CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES subject_categories (id)
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

    // Add category_id column to existing subjects table if it doesn't exist
    const alterTableQueries = [
      `ALTER TABLE subjects ADD COLUMN category_id TEXT`,
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
        } else {
          // Initialize default categories if this is the first run
          this.initializeDefaultCategories();
        }
      });
    });
  }

  // Initialize default subject categories
  async initializeDefaultCategories() {
    try {
      const categories = await this.getSubjectCategories();
      if (categories.length === 0) {
        console.log('Initializing default subject categories...');
        
        const defaultCategories = [
          {
            id: 'mathematics',
            name: 'Mathematics',
            description: 'Algebra, Calculus, Statistics, Geometry',
            domain_type: 'STEM',
            ai_instructions: 'Create calculation problems, formula applications, and mathematical reasoning questions',
            keywords: 'math,algebra,calculus,geometry,statistics,equation,formula',
            icon: 'fas fa-calculator',
            color: 'bg-blue-500'
          },
          {
            id: 'natural-sciences',
            name: 'Natural Sciences', 
            description: 'Physics, Chemistry, Biology, Earth Science',
            domain_type: 'STEM',
            ai_instructions: 'Create questions about scientific processes, reactions, calculations, and experimental analysis',
            keywords: 'physics,chemistry,biology,science,reaction,experiment,laboratory',
            icon: 'fas fa-atom',
            color: 'bg-green-500'
          },
          {
            id: 'literature',
            name: 'Literature & Writing',
            description: 'English, Creative Writing, Poetry, Drama',
            domain_type: 'Humanities',
            ai_instructions: 'Generate questions about characters, themes, literary devices, and textual analysis',
            keywords: 'literature,english,writing,poetry,novel,character,theme',
            icon: 'fas fa-book-open',
            color: 'bg-purple-500'
          },
          {
            id: 'history',
            name: 'History & Social Studies',
            description: 'World History, Government, Geography, Economics',
            domain_type: 'Social Sciences',
            ai_instructions: 'Create questions about historical facts, chronology, causes, effects, and significance',
            keywords: 'history,government,geography,economics,war,revolution,society',
            icon: 'fas fa-landmark',
            color: 'bg-amber-500'
          },
          {
            id: 'languages',
            name: 'Foreign Languages',
            description: 'Spanish, French, German, Chinese, etc.',
            domain_type: 'Languages',
            ai_instructions: 'Generate vocabulary, grammar, translation, and language usage questions',
            keywords: 'spanish,french,german,chinese,language,grammar,vocabulary',
            icon: 'fas fa-language',
            color: 'bg-red-500'
          },
          {
            id: 'arts',
            name: 'Arts & Humanities',
            description: 'Art History, Music, Philosophy, Theater',
            domain_type: 'Humanities',
            ai_instructions: 'Create questions about artistic techniques, philosophical concepts, and cultural analysis',
            keywords: 'art,music,philosophy,theater,painting,sculpture,ethics',
            icon: 'fas fa-palette',
            color: 'bg-pink-500'
          },
          {
            id: 'computer-science',
            name: 'Computer Science',
            description: 'Programming, Algorithms, Data Structures',
            domain_type: 'STEM',
            ai_instructions: 'Generate coding problems, algorithm questions, and technical concept explanations',
            keywords: 'programming,computer,algorithm,code,software,data,structure',
            icon: 'fas fa-code',
            color: 'bg-indigo-500'
          },
          {
            id: 'business',
            name: 'Business & Economics',
            description: 'Finance, Marketing, Management, Economics',
            domain_type: 'Social Sciences',
            ai_instructions: 'Create questions about business strategies, economic principles, and analytical scenarios',
            keywords: 'business,economics,finance,marketing,management,strategy',
            icon: 'fas fa-chart-line',
            color: 'bg-emerald-500'
          },
          {
            id: 'health-medicine',
            name: 'Health & Medicine',
            description: 'Anatomy, Nursing, Public Health, Psychology',
            domain_type: 'Health Sciences',
            ai_instructions: 'Generate questions about medical facts, health processes, and diagnostic reasoning',
            keywords: 'health,medicine,anatomy,nursing,psychology,medical,hospital',
            icon: 'fas fa-heartbeat',
            color: 'bg-rose-500'
          },
          {
            id: 'other',
            name: 'Other / Custom',
            description: 'Engineering, Agriculture, or specialized fields',
            domain_type: 'General',
            ai_instructions: 'Use general academic questioning with content-based optimization',
            keywords: 'engineering,agriculture,specialized,technical,professional',
            icon: 'fas fa-ellipsis-h',
            color: 'bg-gray-500'
          }
        ];

        for (const category of defaultCategories) {
          await this.createSubjectCategory(category);
        }
        
        console.log('✅ Default subject categories initialized');
      }
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  }

  // Category operations
  async getSubjectCategories() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM subject_categories ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async createSubjectCategory(categoryData) {
    return new Promise((resolve, reject) => {
      const {
        id, name, description, domain_type, ai_instructions, 
        keywords, icon, color
      } = categoryData;
      
      const sql = `INSERT INTO subject_categories 
        (id, name, description, domain_type, ai_instructions, keywords, icon, color) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      this.db.run(sql, [
        id, name, description, domain_type, 
        ai_instructions, keywords, icon, color
      ], function(err) {
        if (err) reject(err);
        else resolve({ id, name, description, domain_type, ai_instructions, keywords, icon, color });
      });
    });
  }

  async getSubjectCategoryById(categoryId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM subject_categories WHERE id = ?', [categoryId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }


  // Subject operations
  // Basic subjects query (no categories)
  async getBasicSubjects() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM subjects ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Add backward compatibility for getSubjects
  async getSubjects() {
    return new Promise((resolve, reject) => {
      // Try to get subjects with categories first
      this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='subject_categories'", (err, row) => {
        if (row) {
          // Categories table exists, use enhanced query
          this.getSubjectsWithCategories().then(resolve).catch(() => {
            // Fallback to basic query if enhanced fails
            this.getBasicSubjects().then(resolve).catch(reject);
          });
        } else {
          // No categories table, use basic query
          this.getBasicSubjects().then(resolve).catch(reject);
        }
      });
    });
  }

  // Update createSubject to be backward compatible
  async createSubject(name, description, categoryId = null) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      
      // Check if the categories table exists first
      this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='subject_categories'", (err, row) => {
        if (err) {
          console.warn('Categories table check failed:', err);
        }
        
        const hasCategories = !!row;
        
        // Use different SQL based on whether categories are available
        let sql, params;
        
        if (hasCategories && categoryId) {
          sql = 'INSERT INTO subjects (id, name, description, category_id) VALUES (?, ?, ?, ?)';
          params = [id, name, description, categoryId];
        } else {
          // Fallback to basic subject creation
          sql = 'INSERT INTO subjects (id, name, description) VALUES (?, ?, ?)';
          params = [id, name, description];
        }
        
        this.db.run(sql, params, function(err) {
          if (err) {
            console.error('Error creating subject:', err);
            reject(err);
          } else {
            resolve({ 
              id, 
              name, 
              description, 
              category_id: categoryId,
              created_at: new Date().toISOString() 
            });
          }
        });
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

  // Safe version of getSubjectsWithCategories
  async getSubjectsWithCategories() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          s.*,
          c.name as category_name,
          c.domain_type,
          c.ai_instructions,
          c.icon as category_icon,
          c.color as category_color
        FROM subjects s
        LEFT JOIN subject_categories c ON s.category_id = c.id
        ORDER BY s.created_at DESC
      `;
      this.db.all(sql, (err, rows) => {
        if (err) {
          console.warn('Enhanced subjects query failed, falling back to basic:', err);
          this.getBasicSubjects().then(resolve).catch(reject);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get enhanced subject by ID with category info
  async getSubjectByIdWithCategory(subjectId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          s.*,
          c.name as category_name,
          c.domain_type,
          c.ai_instructions,
          c.keywords as category_keywords
        FROM subjects s
        LEFT JOIN subject_categories c ON s.category_id = c.id
        WHERE s.id = ?
      `;
      this.db.get(sql, [subjectId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Enhanced topic with subject category info
  async getTopicWithSubjectCategory(topicId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          t.*,
          s.name as subject_name,
          s.description as subject_description,
          s.category_id,
          c.name as category_name,
          c.domain_type,
          c.ai_instructions
        FROM topics t
        JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN subject_categories c ON s.category_id = c.id
        WHERE t.id = ?
      `;
      this.db.get(sql, [topicId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Auto-classify existing subjects (migration helper)
  async autoClassifySubjects() {
    try {
      const subjects = await this.getSubjects();
      const categories = await this.getSubjectCategories();
      
      for (const subject of subjects) {
        if (!subject.category_id) {
          const suggestedCategory = this.suggestCategoryForSubject(subject, categories);
          if (suggestedCategory) {
            await this.updateSubjectCategory(subject.id, suggestedCategory.id);
            console.log(`Auto-classified "${subject.name}" as ${suggestedCategory.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error auto-classifying subjects:', error);
    }
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

  // Suggest category based on subject name and keywords
  suggestCategoryForSubject(subject, categories) {
    const subjectText = (subject.name + ' ' + (subject.description || '')).toLowerCase();
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const category of categories) {
      if (category.keywords) {
        const keywords = category.keywords.split(',');
        const matchCount = keywords.filter(keyword => 
          subjectText.includes(keyword.trim().toLowerCase())
        ).length;
        
        const score = matchCount / keywords.length;
        if (score > bestScore && score > 0.3) { // 30% keyword match threshold
          bestScore = score;
          bestMatch = category;
        }
      }
    }
    
    return bestMatch;
  }

  async updateSubjectCategory(subjectId, categoryId) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE subjects SET category_id = ? WHERE id = ?';
      this.db.run(sql, [categoryId, subjectId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  // Get subjects by category
  async getSubjectsByCategory(categoryId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM subjects WHERE category_id = ? ORDER BY created_at DESC';
      this.db.all(sql, [categoryId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Analytics: Get category usage stats
  async getCategoryStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.id,
          c.name,
          c.domain_type,
          COUNT(s.id) as subject_count,
          COUNT(DISTINCT t.id) as topic_count,
          COUNT(DISTINCT q.id) as question_count
        FROM subject_categories c
        LEFT JOIN subjects s ON c.id = s.category_id
        LEFT JOIN topics t ON s.id = t.subject_id
        LEFT JOIN questions q ON t.id = q.topic_id
        GROUP BY c.id, c.name, c.domain_type
        ORDER BY subject_count DESC
      `;
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
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