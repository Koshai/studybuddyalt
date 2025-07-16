// src/server/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const DatabaseService = require('./services/database');
const OllamaService = require('./services/ollama');
const OCRService = require('./services/ocr');
const PDFService = require('./services/pdf');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
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
const db = new DatabaseService();
const ollama = new OllamaService();
const ocr = new OCRService();
const pdf = new PDFService();

// Initialize database
db.init();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await db.getSubjects();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get topics for a subject
app.get('/api/subjects/:subjectId/topics', async (req, res) => {
  try {
    const topics = await db.getTopics(req.params.subjectId);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new subject
app.post('/api/subjects', async (req, res) => {
  try {
    const { name, description } = req.body;
    const subject = await db.createSubject(name, description);
    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new topic
app.post('/api/subjects/:subjectId/topics', async (req, res) => {
  try {
    const { name, description } = req.body;
    const topic = await db.createTopic(req.params.subjectId, name, description);
    res.json(topic);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload and process file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { subjectId, topicId } = req.body;
    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase();

    let extractedText = '';

    // Process based on file type
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileType)) {
      // OCR processing
      extractedText = await ocr.processImage(filePath);
    } else if (fileType === '.pdf') {
      // PDF processing
      extractedText = await pdf.processPDF(filePath);
    } else if (['.txt', '.doc', '.docx'].includes(fileType)) {
      // Text file processing
      extractedText = fs.readFileSync(filePath, 'utf8');
    }

    // Save note to database
    const note = await db.createNote(subjectId, topicId, extractedText, req.file.filename);
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({ note, extractedText });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate questions for a topic
app.post('/api/topics/:topicId/generate-questions', async (req, res) => {
  try {
    const { count = 5, difficulty = 'medium' } = req.body;
    const topicId = req.params.topicId;
    
    // Get notes for this topic
    const notes = await db.getNotes(topicId);
    
    if (notes.length === 0) {
      return res.status(400).json({ error: 'No notes found for this topic' });
    }

    // Combine all notes content
    const combinedContent = notes.map(note => note.content).join('\n\n');
    
    // Generate questions using Ollama
    const questions = await ollama.generateQuestions(combinedContent, count, difficulty);
    
    // Save questions to database
    const savedQuestions = [];
    for (const q of questions) {
      const question = await db.createQuestion(topicId, q.question, q.answer, q.difficulty);
      savedQuestions.push(question);
    }

    res.json(savedQuestions);
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get questions for a topic
app.get('/api/topics/:topicId/questions', async (req, res) => {
  try {
    const questions = await db.getQuestions(req.params.topicId);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get random questions
app.get('/api/topics/:topicId/random-questions', async (req, res) => {
  try {
    const { count = 5 } = req.query;
    const questions = await db.getRandomQuestions(req.params.topicId, parseInt(count));
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ollama model management
app.get('/api/ollama/models', async (req, res) => {
  try {
    const models = await ollama.listModels();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ollama/pull', async (req, res) => {
  try {
    const { model } = req.body;
    await ollama.pullModel(model);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});