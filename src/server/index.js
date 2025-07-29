// src/server/index.js - FIXED VERSION with Simplified Routes
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import simplified services
const SimplifiedDatabaseService = require('./services/database-simplified');
const SimplifiedOllamaService = require('./services/ollama-simplified');
const OCRService = require('./services/ocr');
const PDFService = require('./services/pdf');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    console.log(`🔍 File upload attempt: ${file.originalname} (${file.mimetype})`);
    
    // Allowed file extensions
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt)$/i;
    
    // Allowed MIME types
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      
      // Text files
      'text/plain',
      'text/txt',
      'application/txt',
      'text/csv'
    ];
    
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    
    console.log(`📋 File validation:`);
    console.log(`   File: ${file.originalname}`);
    console.log(`   MIME type: ${file.mimetype}`);
    console.log(`   Extension valid: ${extname}`);
    console.log(`   MIME type valid: ${mimetype}`);
    
    if (mimetype && extname) {
      console.log(`✅ File accepted: ${file.originalname}`);
      return cb(null, true);
    } else {
      console.log(`❌ File rejected: ${file.originalname}`);
      console.log(`   Supported extensions: .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .txt`);
      console.log(`   Supported MIME types: ${allowedMimeTypes.join(', ')}`);
      
      const error = new Error(`File type not supported. Supported formats: images (jpg, png, gif), PDFs, Word documents (.doc, .docx), and text files (.txt)`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error);
    }
  }
});

// Initialize simplified services
const db = new SimplifiedDatabaseService();
const ollama = new SimplifiedOllamaService();
const ocr = new OCRService();
const pdf = new PDFService();

// Initialize database
console.log('🔄 Initializing simplified database...');
db.init();

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0-simplified'
  });
});

app.get('/api/ollama/health', async (req, res) => {
  try {
    const healthy = await ollama.isHealthy();
    if (healthy) {
      res.json({ status: 'healthy', message: 'Ollama is running' });
    } else {
      res.status(503).json({ status: 'unhealthy', message: 'Ollama not responding' });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Failed to check Ollama health',
      error: error.message 
    });
  }
});

// ===== SUBJECTS (Fixed/Read-Only) =====
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await db.getSubjects();
    res.json(subjects);
  } catch (error) {
    console.error('Error getting subjects:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subjects/:subjectId', async (req, res) => {
  try {
    const subject = await db.getSubjectById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TOPICS =====
app.get('/api/subjects/:subjectId/topics', async (req, res) => {
  try {
    const topics = await db.getTopics(req.params.subjectId);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subjects/:subjectId/topics', async (req, res) => {
  try {
    const { name, description } = req.body;
    const topic = await db.createTopic(req.params.subjectId, name, description);
    res.json(topic);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/topics/:topicId/with-subject', async (req, res) => {
  try {
    const topicWithSubject = await db.getTopicWithSubject(req.params.topicId);
    if (!topicWithSubject) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json(topicWithSubject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/topics/:topicId', async (req, res) => {
  try {
    const result = await db.deleteTopic(req.params.topicId);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/topics/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    const topics = await db.searchTopics(q.trim());
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== NOTES =====
app.get('/api/topics/:topicId/notes', async (req, res) => {
  try {
    const notes = await db.getNotes(req.params.topicId);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notes/:noteId', async (req, res) => {
  try {
    const result = await db.deleteNote(req.params.noteId);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== FILE UPLOAD (Simplified) =====
app.post('/api/upload-simplified', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { topicId } = req.body;
    if (!topicId) {
      return res.status(400).json({ error: 'Topic ID is required' });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase();

    let extractedText = '';

    console.log(`🔄 Processing ${fileType} file: ${req.file.originalname}`);

    // Process based on file type
    try {
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileType)) {
        extractedText = await ocr.processImage(filePath);
      } else if (fileType === '.pdf') {
        extractedText = await pdf.processPDF(filePath);
      } else if (['.txt'].includes(fileType)) {
        extractedText = fs.readFileSync(filePath, 'utf8');
      } else if (['.doc', '.docx'].includes(fileType)) {
        // For now, treat as text files - you'd need a proper doc parser
        extractedText = fs.readFileSync(filePath, 'utf8');
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
      }

      console.log(`✅ Extracted ${extractedText.length} characters of text`);

    } catch (processError) {
      console.error('❌ File processing error:', processError);
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({ 
        error: 'Failed to process file: ' + processError.message 
      });
    }

    // Save note to database
    try {
      const note = await db.createNote(topicId, extractedText, req.file.originalname);
      
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.log(`✅ Note saved with ID: ${note.id}`);

      res.json({ 
        note, 
        extractedText,
        wordCount: extractedText.trim().split(/\s+/).length
      });

    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(500).json({ error: 'Failed to save note: ' + dbError.message });
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// ===== QUESTIONS =====
app.get('/api/topics/:topicId/questions', async (req, res) => {
  try {
    const questions = await db.getQuestions(req.params.topicId);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/topics/:topicId/random-questions', async (req, res) => {
  try {
    const { count = 5 } = req.query;
    const questions = await db.getRandomQuestions(req.params.topicId, parseInt(count));
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SIMPLIFIED QUESTION GENERATION =====
app.post('/api/topics/:topicId/generate-questions-simplified', async (req, res) => {
  try {
    const { count = 5, subjectCategory, topic } = req.body;
    const topicId = req.params.topicId;
    
    console.log(`🎓 Generating ${count} questions for topic: ${topic?.name || topicId}`);
    console.log(`📚 Subject: ${subjectCategory?.name || 'Unknown'}`);
    
    // Get notes for this topic
    const notes = await db.getNotes(topicId);
    
    if (notes.length === 0) {
      return res.status(400).json({ error: 'No study materials found for this topic' });
    }

    console.log(`📝 Found ${notes.length} notes`);

    // Combine all notes content
    const combinedContent = notes.map(note => note.content).join('\n\n');
    
    if (combinedContent.trim().length < 50) {
      return res.status(400).json({ error: 'Study materials are too short for question generation' });
    }

    console.log(`📄 Combined content: ${combinedContent.length} characters`);

    // Generate questions using simplified approach
    const generatedQuestions = await ollama.generateQuestions(
      combinedContent, 
      count, 
      subjectCategory,
      topic
    );
    
    console.log(`🤖 AI generated ${generatedQuestions.length} questions`);
    
    // Save questions to database
    const savedQuestions = [];
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      
      try {
        const questionData = {
          question: q.question,
          answer: q.answer,
          type: q.type || 'multiple_choice',
          options: q.options || null,
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : null,
          explanation: q.explanation || null
        };
        
        const savedQuestion = await db.createQuestion(topicId, questionData);
        savedQuestions.push(savedQuestion);
        
        console.log(`✅ Question ${i + 1} saved successfully`);
        
      } catch (error) {
        console.error(`❌ Error saving question ${i + 1}:`, error);
      }
    }

    console.log(`📊 Final result: ${savedQuestions.length} questions saved`);
    res.json(savedQuestions);
    
  } catch (error) {
    console.error('❌ Question generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/questions/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const updates = req.body;
    
    const result = await db.updateQuestion(questionId, updates);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/questions/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const result = await db.deleteQuestion(questionId);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== PRACTICE SESSIONS =====
app.post('/api/topics/:topicId/practice-session', async (req, res) => {
  try {
    const { questionsCount, correctAnswers } = req.body;
    const topicId = req.params.topicId;
    
    const session = await db.recordPracticeSession(topicId, questionsCount, correctAnswers);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/topics/:topicId/stats', async (req, res) => {
  try {
    const stats = await db.getTopicStats(req.params.topicId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== STATISTICS =====
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    console.log('📊 Dashboard stats request received');
    
    // Debug: Check if database is initialized
    if (!db || !db.db) {
      console.error('❌ Database not initialized');
      return res.status(500).json({ 
        error: 'Database not initialized',
        debug: {
          dbExists: !!db,
          dbConnectionExists: !!(db && db.db)
        }
      });
    }

    // Debug: Test basic database connectivity
    const testQuery = 'SELECT name FROM sqlite_master WHERE type="table"';
    const tables = await new Promise((resolve, reject) => {
      db.db.all(testQuery, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📋 Available tables:', tables.map(t => t.name));

    // Get dashboard stats with detailed error handling
    const stats = await db.getDashboardStats();
    console.log('✅ Dashboard stats loaded:', stats);
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    
    // Return default stats instead of error to prevent frontend crashes
    const defaultStats = {
      total_topics: 0,
      total_questions: 0,
      total_notes: 0,
      overall_accuracy: 0,
      total_practice_sessions: 0,
      active_subjects: 0,
      error: error.message,
      debug: {
        errorType: error.name,
        stack: error.stack.split('\n').slice(0, 3)
      }
    };
    
    res.json(defaultStats);
  }
});

app.get('/api/subjects/stats', async (req, res) => {
  try {
    const stats = await db.getSubjectStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/activity/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activity = await db.getRecentActivity(parseInt(limit));
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== DATA MANAGEMENT =====
app.get('/api/export', async (req, res) => {
  try {
    const data = await db.exportData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AI MODEL MANAGEMENT =====
app.get('/api/ollama/models', async (req, res) => {
  try {
    const models = await ollama.listModels();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TEST ENDPOINTS =====
app.get('/api/test-ollama-simple', async (req, res) => {
  try {
    console.log('🧪 Testing simplified Ollama service...');
    
    const testContent = `
Mathematics is the study of numbers, shapes, and patterns. Addition is combining two or more numbers to get a sum. 
For example, 5 + 3 = 8. Subtraction is taking one number away from another. For example, 10 - 4 = 6.
Multiplication is repeated addition. For example, 3 × 4 = 12 is the same as 3 + 3 + 3 + 3 = 12.
    `;
    
    const mathSubject = {
      id: 'mathematics',
      name: 'Mathematics',
      description: 'Algebra, Calculus, Statistics, Geometry, Arithmetic'
    };
    
    const testTopic = {
      id: 'test-topic',
      name: 'Basic Arithmetic'
    };
    
    const questions = await ollama.generateQuestions(testContent, 2, mathSubject, testTopic);
    
    res.json({
      status: 'success',
      message: 'Simplified Ollama service is working',
      testResults: {
        contentLength: testContent.length,
        questionsGenerated: questions.length,
        questions: questions.map(q => ({
          question: q.question?.substring(0, 100),
          type: q.type,
          optionsCount: q.options?.length,
          hasExplanation: !!q.explanation
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Simplified Ollama test failed',
      error: error.message
    });
  }
});

// Debug endpoint for database reset
app.post('/api/debug/reset-database', async (req, res) => {
  try {
    // Close current connection
    db.close();
    
    // Delete database file
    const dbPath = path.join(__dirname, '../../data/study_ai_simplified.db');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('🗑️ Database file deleted');
    }
    
    // Reinitialize
    db.init();
    
    res.json({ success: true, message: 'Database reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check database tables
app.get('/api/debug/tables', async (req, res) => {
  try {
    const info = await db.getDatabaseInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add these missing endpoints to your src/server/index.js

// ===== MISSING DASHBOARD ENDPOINTS =====

// Debug endpoint to check what dashboard is trying to load
app.get('/api/debug/dashboard-requests', (req, res) => {
  console.log('🔍 Dashboard debug endpoint hit');
  res.json({ message: 'Dashboard debug endpoint working' });
});

app.get('/api/debug/subject-data', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking subject data...');
    
    // Get all topics
    const allTopics = await db.getAllTopics();
    console.log('📊 All topics:', allTopics.length);
    
    // Group by subject
    const topicsBySubject = {};
    allTopics.forEach(topic => {
      if (!topicsBySubject[topic.subject_id]) {
        topicsBySubject[topic.subject_id] = [];
      }
      topicsBySubject[topic.subject_id].push(topic);
    });
    
    // Get subject stats
    const subjectStats = await db.getSubjectStats();
    
    res.json({
      allTopics: allTopics.length,
      topicsBySubject,
      subjectStats,
      availableSubjects: db.FIXED_SUBJECTS.map(s => s.id)
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all notes endpoint (dashboard might be calling this)
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await db.getAllNotes();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all topics endpoint
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await db.getAllTopics();
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all questions endpoint
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await db.getAllQuestions();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all practice sessions endpoint
app.get('/api/practice-sessions', async (req, res) => {
  try {
    const sessions = await db.getAllPracticeSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced dashboard stats with better error handling
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    console.log('📊 Loading dashboard stats...');
    const stats = await db.getDashboardStats();
    console.log('✅ Dashboard stats loaded:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    // Return default stats instead of error
    res.json({
      total_topics: 0,
      total_questions: 0,
      total_notes: 0,
      overall_accuracy: 0,
      total_practice_sessions: 0
    });
  }
});

// Enhanced subject stats with better error handling
app.get('/api/subjects/stats', async (req, res) => {
  try {
    console.log('📊 Loading subject stats...');
    const stats = await db.getSubjectStats();
    console.log('✅ Subject stats loaded:', stats.length, 'subjects');
    res.json(stats);
  } catch (error) {
    console.error('❌ Subject stats error:', error);
    // Return empty array instead of error
    res.json([]);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error: ' + error.message });
});

// ===== SERVE FRONTEND STATIC FILES =====
// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// ===== SPA FALLBACK =====
// Handle client-side routing - serve index.html for any non-API routes
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StudyAI Simplified Server started on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test-ollama-simple`);
  console.log(`🔧 Reset database: POST http://localhost:${PORT}/api/debug/reset-database`);
  console.log(`📋 Database info: http://localhost:${PORT}/api/debug/tables`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  db.close();
  process.exit(0);
});

module.exports = app;