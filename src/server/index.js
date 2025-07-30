// src/server/index.js - COMPLETE VERSION with Authentication Integration
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import services - Updated for authentication
const SimplifiedDatabaseService = require('./services/database-simplified');
const AuthService = require('./services/auth-service');
const UsageService = require('./services/usage-service');
const OpenAIService = require('./services/openai-service'); // We'll create this
const OCRService = require('./services/ocr');
const PDFService = require('./services/pdf');

// Import middleware
const authMiddleware = require('./middleware/auth-middleware');

// Import routes
const authRoutes = require('./routes/auth-routes');

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// SECURITY & MIDDLEWARE SETUP
// =============================================================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openai.com"]
        }
    }
}));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit auth attempts
    message: {
        error: 'Too many authentication attempts, please try again later.'
    }
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Basic middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// =============================================================================
// FILE UPLOAD CONFIGURATION
// =============================================================================

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration with user-specific paths
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create user-specific upload directory
    const userId = req.user?.id || 'anonymous';
    const userUploadDir = path.join(uploadsDir, userId);
    
    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }
    
    cb(null, userUploadDir);
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
    console.log(`🔍 File upload attempt by user ${req.user?.id}: ${file.originalname} (${file.mimetype})`);
    
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt)$/i;
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/txt', 'application/txt', 'text/csv'
    ];
    
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    
    if (mimetype && extname) {
      console.log(`✅ File accepted: ${file.originalname}`);
      return cb(null, true);
    } else {
      console.log(`❌ File rejected: ${file.originalname}`);
      const error = new Error(`File type not supported. Supported formats: images (jpg, png, gif), PDFs, Word documents (.doc, .docx), and text files (.txt)`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error);
    }
  }
});

// =============================================================================
// SERVICE INITIALIZATION
// =============================================================================

// Initialize services
const db = new SimplifiedDatabaseService();
const authService = new AuthService();
const usageService = new UsageService();
const ocr = new OCRService();
const pdf = new PDFService();

// Initialize OpenAI service factory
const createOpenAIService = (userTier) => {
  return new OpenAIService(userTier);
};

// Initialize database
console.log('🔄 Initializing database...');
db.init();

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

app.use('/api/auth', authRoutes);

// =============================================================================
// HEALTH CHECK & STATUS
// =============================================================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0-with-auth',
    environment: process.env.NODE_ENV || 'development'
  });
});

// =============================================================================
// SUBJECTS (Read-Only, Available to All Users)
// =============================================================================

app.get('/api/subjects', authMiddleware.optionalAuth, async (req, res) => {
  try {
    const subjects = await db.getSubjects();
    res.json(subjects);
  } catch (error) {
    console.error('Error getting subjects:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subjects/:subjectId', authMiddleware.optionalAuth, async (req, res) => {
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

// =============================================================================
// TOPICS (User-Specific, Protected Routes)
// =============================================================================

app.get('/api/subjects/:subjectId/topics', authMiddleware.authenticateToken, async (req, res) => {
  try {
    // Only get topics for the authenticated user
    const topics = await db.getTopicsForUser(req.params.subjectId, req.user.id);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subjects/:subjectId/topics', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const subjectId = req.params.subjectId;
    const userId = req.user.id;
    
    // Check topic limit for user's subscription tier
    await usageService.checkTopicLimit(userId, req.user.subscriptionTier, subjectId);
    
    const topic = await db.createTopicForUser(subjectId, name, description, userId);
    res.json(topic);
  } catch (error) {
    if (error.message.includes('limit')) {
      res.status(403).json({ error: error.message, upgradeRequired: true });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/api/topics/:topicId/with-subject', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const topicWithSubject = await db.getTopicWithSubjectForUser(req.params.topicId, req.user.id);
    if (!topicWithSubject) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json(topicWithSubject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/topics/:topicId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const result = await db.deleteTopicForUser(req.params.topicId, req.user.id);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/topics/search', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    const topics = await db.searchTopicsForUser(q.trim(), req.user.id);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// NOTES (User-Specific, Protected Routes)
// =============================================================================

app.get('/api/topics/:topicId/notes', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const notes = await db.getNotesForUser(req.params.topicId, req.user.id);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notes/:noteId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const result = await db.deleteNoteForUser(req.params.noteId, req.user.id);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// FILE UPLOAD (Protected, With Usage Tracking)
// =============================================================================

app.post('/api/upload-simplified', 
  authMiddleware.authenticateToken,
  upload.single('file'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { topicId } = req.body;
      if (!topicId) {
        return res.status(400).json({ error: 'Topic ID is required' });
      }

      // Verify topic belongs to user
      const topic = await db.getTopicWithSubjectForUser(topicId, req.user.id);
      if (!topic) {
        return res.status(404).json({ error: 'Topic not found or access denied' });
      }

      // Check storage limit
      await usageService.checkStorageLimit(req.user.id, req.user.subscriptionTier, req.file.size);

      const filePath = req.file.path;
      const fileType = path.extname(req.file.originalname).toLowerCase();

      let extractedText = '';

      console.log(`🔄 Processing ${fileType} file: ${req.file.originalname} for user: ${req.user.id}`);

      // Process based on file type
      try {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileType)) {
          extractedText = await ocr.processImage(filePath);
        } else if (fileType === '.pdf') {
          extractedText = await pdf.processPDF(filePath);
        } else if (['.txt'].includes(fileType)) {
          extractedText = fs.readFileSync(filePath, 'utf8');
        } else if (['.doc', '.docx'].includes(fileType)) {
          extractedText = fs.readFileSync(filePath, 'utf8');
        }

        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error('No text could be extracted from the file');
        }

        console.log(`✅ Extracted ${extractedText.length} characters of text`);

      } catch (processError) {
        console.error('❌ File processing error:', processError);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({ 
          error: 'Failed to process file: ' + processError.message 
        });
      }

      // Save note to database
      try {
        const note = await db.createNoteForUser(topicId, extractedText, req.file.originalname, req.user.id);
        
        // Update storage usage
        await usageService.incrementStorageUsage(req.user.id, req.file.size);
        
        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        console.log(`✅ Note saved with ID: ${note.id} for user: ${req.user.id}`);

        res.json({ 
          note, 
          extractedText,
          wordCount: extractedText.trim().split(/\s+/).length
        });

      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(500).json({ error: 'Failed to save note: ' + dbError.message });
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      if (error.message.includes('limit')) {
        res.status(403).json({ error: error.message, upgradeRequired: true });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
);

// =============================================================================
// QUESTIONS (User-Specific, Protected Routes)
// =============================================================================

app.get('/api/topics/:topicId/questions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const questions = await db.getQuestionsForUser(req.params.topicId, req.user.id);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/topics/:topicId/random-questions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { count = 5 } = req.query;
    const questions = await db.getRandomQuestionsForUser(req.params.topicId, parseInt(count), req.user.id);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// OPENAI QUESTION GENERATION (Protected, With Usage Tracking)
// =============================================================================

app.post('/api/topics/:topicId/generate-questions-openai', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { count = 5, subjectCategory, topic } = req.body;
    const topicId = req.params.topicId;
    const userId = req.user.id;
    const userTier = req.user.subscriptionTier;
    
    console.log(`🎓 Generating ${count} questions for user ${userId} (${userTier}) - topic: ${topic?.name || topicId}`);
    
    // Check usage limits
    await usageService.checkQuestionLimit(userId, userTier);
    
    // Verify topic belongs to user
    const topicData = await db.getTopicWithSubjectForUser(topicId, userId);
    if (!topicData) {
      return res.status(404).json({ error: 'Topic not found or access denied' });
    }
    
    // Get notes for this topic
    const notes = await db.getNotesForUser(topicId, userId);
    
    if (notes.length === 0) {
      return res.status(400).json({ error: 'No study materials found for this topic' });
    }

    console.log(`📝 Found ${notes.length} notes for user ${userId}`);

    // Combine all notes content
    const combinedContent = notes.map(note => note.content).join('\n\n');
    
    if (combinedContent.trim().length < 50) {
      return res.status(400).json({ error: 'Study materials are too short for question generation' });
    }

    console.log(`📄 Combined content: ${combinedContent.length} characters`);

    // Create OpenAI service instance for user's tier
    const openaiService = createOpenAIService(userTier);
    
    // Generate questions using OpenAI
    const generatedQuestions = await openaiService.generateQuestions(
      combinedContent, 
      count, 
      subjectCategory,
      topic
    );
    
    console.log(`🤖 OpenAI generated ${generatedQuestions.length} questions for user ${userId}`);
    
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
        
        const savedQuestion = await db.createQuestionForUser(topicId, questionData, userId);
        savedQuestions.push(savedQuestion);
        
        console.log(`✅ Question ${i + 1} saved for user ${userId}`);
        
      } catch (error) {
        console.error(`❌ Error saving question ${i + 1} for user ${userId}:`, error);
      }
    }

    // Update usage tracking
    await usageService.incrementQuestionUsage(userId, savedQuestions.length);

    console.log(`📊 Final result for user ${userId}: ${savedQuestions.length} questions saved`);
    res.json(savedQuestions);
    
  } catch (error) {
    console.error(`❌ Question generation error for user ${req.user?.id}:`, error);
    
    if (error.message.includes('limit')) {
      res.status(403).json({ error: error.message, upgradeRequired: true });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Keep the old endpoint for backward compatibility but redirect to OpenAI
app.post('/api/topics/:topicId/generate-questions-simplified', authMiddleware.authenticateToken, async (req, res) => {
  console.log('🔄 Redirecting legacy endpoint to OpenAI generation');
  req.url = req.url.replace('generate-questions-simplified', 'generate-questions-openai');
  return app._router.handle(req, res);
});

app.put('/api/questions/:questionId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const updates = req.body;
    
    const result = await db.updateQuestionForUser(questionId, updates, req.user.id);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/questions/:questionId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const result = await db.deleteQuestionForUser(questionId, req.user.id);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// PRACTICE SESSIONS (User-Specific, Protected Routes)
// =============================================================================

app.post('/api/topics/:topicId/practice-session', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { questionsCount, correctAnswers } = req.body;
    const topicId = req.params.topicId;
    const userId = req.user.id;
    
    // Verify topic belongs to user
    const topic = await db.getTopicWithSubjectForUser(topicId, userId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found or access denied' });
    }
    
    const session = await db.recordPracticeSessionForUser(topicId, questionsCount, correctAnswers, userId);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/topics/:topicId/stats', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const stats = await db.getTopicStatsForUser(req.params.topicId, req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// USER DASHBOARD & STATISTICS (Protected Routes)
// =============================================================================

app.get('/api/dashboard/stats', authMiddleware.authenticateToken, async (req, res) => {
  try {
    console.log(`📊 Dashboard stats request for user: ${req.user.id}`);
    
    const stats = await db.getDashboardStatsForUser(req.user.id);
    const usage = await usageService.getUsageStats(req.user.id);
    
    console.log(`✅ Dashboard stats loaded for user ${req.user.id}:`, stats);
    
    res.json({
      ...stats,
      usage: usage
    });
  } catch (error) {
    console.error(`❌ Dashboard stats error for user ${req.user?.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subjects/stats', authMiddleware.authenticateToken, async (req, res) => {
  try {
    console.log(`📊 Getting subject stats for user: ${req.user.id}`);
    const stats = await db.getSubjectStatsForUser(req.user.id);
    console.log(`✅ Subject stats loaded for user ${req.user.id}: ${stats.length} subjects`);
    
    res.json(stats);
  } catch (error) {
    console.error(`❌ Subject stats error for user ${req.user?.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/activity/recent', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activity = await db.getRecentActivityForUser(parseInt(limit), req.user.id);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// USER PROFILE & USAGE (Protected Routes)
// =============================================================================

app.get('/api/user/usage', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const usage = await usageService.getUsageStats(req.user.id);
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// DATA MANAGEMENT (Protected Routes)
// =============================================================================

app.get('/api/export', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const data = await db.exportDataForUser(req.user.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// LEGACY/DEBUG ENDPOINTS (Remove in production)
// =============================================================================

app.get('/api/debug/user-data', authMiddleware.authenticateToken, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    const userData = {
      user: req.user,
      topics: await db.getTopicsForUser('all', req.user.id),
      usage: await usageService.getUsageStats(req.user.id)
    };
    
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      error: 'File too large. Maximum size is 50MB.',
      upgradeRequired: req.user?.subscriptionTier === 'free'
    });
  }
  
  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ error: error.message });
  }
  
  // Handle authentication errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Authentication token expired' });
  }
  
  // Generic error response
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// =============================================================================
// SERVE FRONTEND STATIC FILES
// =============================================================================

app.use(express.static(path.join(__dirname, '../frontend')));

// =============================================================================
// SPA FALLBACK
// =============================================================================

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`🚀 StudyAI Server with Authentication started on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`🧪 Test auth: node test-auth.js`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n🔧 Development endpoints:`);
    console.log(`   - Registration: POST /api/auth/register`);
    console.log(`   - Login: POST /api/auth/login`);
    console.log(`   - Profile: GET /api/auth/profile`);
    console.log(`   - Upload: POST /api/upload-simplified`);
    console.log(`   - Generate: POST /api/topics/:id/generate-questions-openai`);
  }
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

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