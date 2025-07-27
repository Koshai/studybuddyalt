// src/server/routes-simplified.js - Updated server routes for simplified system

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and document files are allowed'));
    }
  }
});

// Initialize services
const db = new SimplifiedDatabaseService();
const ollama = new SimplifiedOllamaService();
const ocr = new OCRService();
const pdf = new PDFService();

// Initialize database
db.init();

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase();

    let extractedText = '';

    // Process based on file type
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileType)) {
      extractedText = await ocr.processImage(filePath);
    } else if (fileType === '.pdf') {
      extractedText = await pdf.processPDF(filePath);
    } else if (['.txt', '.doc', '.docx'].includes(fileType)) {
      extractedText = fs.readFileSync(filePath, 'utf8');
    }

    // Save note to database
    const note = await db.createNote(topicId, extractedText, req.file.filename);
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({ 
      note, 
      extractedText,
      wordCount: extractedText.trim().split(/\s+/).length
    });
  } catch (error) {
    console.error('Upload error:', error);
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

    console.log(`📝 Found ${notes.length} notes with total content`);

    // Combine all notes content
    const combinedContent = notes.map(note => note.content).join('\n\n');
    
    if (combinedContent.trim().length < 50) {
      return res.status(400).json({ error: 'Study materials are too short for question generation' });
    }

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
    console.error('Question generation error:', error);
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
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    console.error('Test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Simplified Ollama test failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Simplified StudyAI server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test-ollama-simple`);
});

module.exports = app;