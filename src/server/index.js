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
const OpenAIService = require('./services/openai-service');
const aiServiceSelector = require('./services/ai-service-selector'); // Smart AI service selection
const OCRService = require('./services/ocr');
const PDFService = require('./services/pdf');

// Import middleware
const authMiddleware = require('./middleware/auth-middleware');

// Import routes
const authRoutes = require('./routes/auth-routes');
const configRoutes = require('./routes/config-routes');
const syncRoutes = require('./routes/sync-routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Railway proxy for rate limiting with proper configuration
if (process.env.RAILWAY_ENVIRONMENT_NAME) {
    app.set('trust proxy', 1); // Trust only the first proxy (Railway)
    console.log('✅ Railway proxy trust enabled');
}

// =============================================================================
// SECURITY & MIDDLEWARE SETUP
// =============================================================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "'unsafe-eval'",
                "https://cdn.tailwindcss.com",
                "https://unpkg.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.quilljs.com",
                "https://pagead2.googlesyndication.com",
                "https://www.googletagservices.com"
            ],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.quilljs.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: [
                "'self'", 
                "https://api.openai.com",
                "http://localhost:3001",
                "https://*.up.railway.app",
                "https://jaquizy.com",
                "https://www.jaquizy.com"
            ]
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
app.use('/api/config', configRoutes);
app.use('/api/sync', syncRoutes);

// =============================================================================
// HEALTH CHECK & STATUS
// =============================================================================

// =============================================================================
// OFFLINE SETUP ENDPOINTS
// =============================================================================

const OfflineSetupService = require('./services/offline-setup-service');
const offlineSetupService = new OfflineSetupService();

app.get('/api/setup/offline/status', async (req, res) => {
    try {
        const status = await offlineSetupService.getInstallationStatus();
        res.json({ status: 'success', ...status });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/setup/offline/requirements', async (req, res) => {
    try {
        const requirements = await offlineSetupService.checkSystemRequirements();
        res.json({ status: 'success', ...requirements });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/setup/offline/install', async (req, res) => {
    try {
        // Set up Server-Sent Events for progress updates
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        const sendProgress = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        const result = await offlineSetupService.installOllama(sendProgress);
        
        sendProgress({ ...result, completed: true });
        res.end();

    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message, completed: true })}\n\n`);
        res.end();
    }
});

app.get('/api/setup/offline/test', async (req, res) => {
    try {
        const testResult = await offlineSetupService.testOfflineInstallation();
        res.json({ status: 'success', ...testResult });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// =============================================================================
// HEALTH CHECK ENDPOINTS
// =============================================================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0-with-auth',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple test endpoint to check if new routes work
app.get('/api/test-new-route', (req, res) => {
  res.json({ 
    message: 'New route works!',
    timestamp: new Date().toISOString()
  });
});

// Create subjects table manually for debugging
app.post('/api/admin/create-subjects', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
  try {
    console.log('🔧 Manually creating subjects table...');
    
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, '../data/study_ai_simplified.db');
    
    const db = new sqlite3.Database(dbPath);
    
    // Create subjects table
    const createSubjectsSQL = `
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT DEFAULT '📚',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await new Promise((resolve, reject) => {
      db.run(createSubjectsSQL, (err) => {
        if (err) {
          console.error('❌ Failed to create subjects table:', err);
          reject(err);
        } else {
          console.log('✅ Subjects table created successfully');
          resolve();
        }
      });
    });
    
    // Insert the complete list of fixed subjects (matching database-simplified.js)
    const fixedSubjects = [
      { name: 'Mathematics', description: 'Algebra, Calculus, Statistics, Geometry, Arithmetic', icon: '🔢' },
      { name: 'Natural Sciences', description: 'Physics, Chemistry, Biology, Earth Science', icon: '🔬' },
      { name: 'Literature & Writing', description: 'English, Creative Writing, Poetry, Drama, Reading', icon: '📖' },
      { name: 'History & Social Studies', description: 'World History, Government, Geography, Economics', icon: '📜' },
      { name: 'Foreign Languages', description: 'Spanish, French, German, Chinese, Language Learning', icon: '🗣️' },
      { name: 'Arts & Humanities', description: 'Art History, Music, Philosophy, Theater, Culture', icon: '🎨' },
      { name: 'Computer Science', description: 'Programming, Algorithms, Data Structures, Technology', icon: '💻' },
      { name: 'Business & Economics', description: 'Finance, Marketing, Management, Economics, Trade', icon: '📊' },
      { name: 'Health & Medicine', description: 'Anatomy, Nursing, Public Health, Psychology, Wellness', icon: '🏥' },
      { name: 'General Studies', description: 'Engineering, Agriculture, Specialized fields, Miscellaneous', icon: '🎓' }
    ];
    
    for (const subject of fixedSubjects) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO subjects (name, description, icon) VALUES (?, ?, ?)',
          [subject.name, subject.description, subject.icon],
          (err) => {
            if (err) {
              console.warn(`⚠️ Failed to insert subject ${subject.name}:`, err.message);
            } else {
              console.log(`✅ Inserted subject: ${subject.name}`);
            }
            resolve(); // Continue even if one fails
          }
        );
      });
    }
    
    db.close();
    
    res.json({
      success: true,
      message: 'Subjects table created and populated',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Manual subjects creation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug Supabase data for user
app.get('/api/admin/debug-supabase/:email', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
  try {
    const userEmail = req.params.email;
    console.log(`🔍 Debugging Supabase data for: ${userEmail}`);
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    // Get user ID
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', userEmail)
      .single();
    
    if (profileError) {
      return res.json({ error: 'User not found', details: profileError });
    }
    
    const userId = profileData.id;
    
    // Check all tables
    const [topicsResult, notesResult, questionsResult] = await Promise.all([
      supabase.from('topics').select('*').eq('user_id', userId),
      supabase.from('notes').select('*').eq('user_id', userId),
      supabase.from('questions').select('*').eq('user_id', userId)
    ]);
    
    res.json({
      userEmail,
      userId,
      data: {
        topics: { 
          count: topicsResult.data?.length || 0, 
          data: topicsResult.data,
          error: topicsResult.error 
        },
        notes: { 
          count: notesResult.data?.length || 0, 
          data: notesResult.data,
          error: notesResult.error 
        },
        questions: { 
          count: questionsResult.data?.length || 0, 
          data: questionsResult.data,
          error: questionsResult.error 
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple admin debug endpoint (moved up for testing)
app.get('/api/admin/debug', (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    const dbPath = path.join(__dirname, '../data/study_ai_simplified.db');
    
    res.json({
      success: true,
      server_status: 'running',
      database_file_exists: fs.existsSync(dbPath),
      database_path: dbPath,
      environment: process.env.RAILWAY_ENVIRONMENT_NAME || 'local',
      nodejs_version: process.version,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple admin auth test endpoint
app.get('/api/admin/auth-test', authMiddleware.authenticateToken, authMiddleware.requireAdmin, (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Admin authentication successful',
      user: {
        email: req.user.email,
        id: req.user.id,
        subscriptionTier: req.user.subscriptionTier
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin sync status endpoint (moved up for testing)
app.get('/api/admin/sync/status', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
  try {
    console.log(`🔍 Admin sync status requested by ${req.user.email}`);
    
    // Get database table information with error handling
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const fs = require('fs');
    const dbPath = path.join(__dirname, '../data/study_ai_simplified.db');
    
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database file does not exist:', dbPath);
      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        sqlite: {
          dbPath: dbPath,
          exists: false,
          error: 'Database file not found'
        },
        supabase: { connected: false, error: 'Database not available' },
        environment: process.env.RAILWAY_ENVIRONMENT_NAME || 'local'
      });
    }
    
    const checkDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err);
      }
    });
    
    const tableInfo = {};
    const tables = ['subjects', 'topics', 'notes', 'questions', 'practice_sessions', 'user_answers'];
    
    const getTableInfo = (tableName) => {
      return new Promise((resolve) => {
        // Check if table exists and get count
        checkDb.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, result) => {
          if (err) {
            tableInfo[tableName] = { exists: false, count: 0, error: err.message };
          } else {
            tableInfo[tableName] = { exists: true, count: result.count };
          }
          resolve();
        });
      });
    };
    
    // Check all tables with proper error handling
    try {
      await Promise.all(tables.map(table => getTableInfo(table)));
    } catch (dbError) {
      console.error('❌ Database table check failed:', dbError);
      // Continue anyway with empty table info
    }
    
    // Get Supabase connection status
    let supabaseStatus = { connected: false, error: null };
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        const { data, error } = await supabase.from('subjects').select('count', { count: 'exact' }).limit(1);
        if (error) {
          supabaseStatus = { connected: false, error: error.message };
        } else {
          supabaseStatus = { connected: true, subjectsCount: data.length };
        }
      } else {
        supabaseStatus = { connected: false, error: 'Supabase environment variables missing' };
      }
    } catch (error) {
      supabaseStatus = { connected: false, error: error.message };
    }
    
    try {
      checkDb.close();
    } catch (closeError) {
      console.warn('Warning: Could not close database connection:', closeError.message);
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      sqlite: {
        dbPath: dbPath,
        tables: tableInfo
      },
      supabase: supabaseStatus,
      environment: process.env.RAILWAY_ENVIRONMENT_NAME || 'local'
    });
    
  } catch (error) {
    console.error('❌ Admin sync status failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple admin sync logs endpoint (moved up to avoid 404)
app.get('/api/admin/sync/logs', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    console.log(`📋 Admin sync logs requested by ${req.user.email} (limit: ${limit})`);
    
    // For now, return sample logs since we don't have a logs table yet
    const logs = [
      {
        timestamp: new Date().toISOString(),
        type: 'info',
        message: 'Admin sync logs endpoint accessed',
        user: req.user.email
      },
      {
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        type: 'sync',
        message: 'Database tables recreated successfully',
        details: 'All 10 subjects populated'
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        type: 'sync',
        message: 'Auto-sync service initialized',
        details: 'Service ready for sync operations'
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        type: 'admin',
        message: 'Admin dashboard accessed',
        user: req.user.email
      }
    ];
    
    res.json({
      success: true,
      logs: logs,
      total: logs.length,
      limit: limit,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Admin sync logs failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin manual sync trigger endpoint (moved up to avoid issues)
app.post('/api/admin/sync/trigger', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
  try {
    const { userId, userEmail, syncType } = req.body;
    
    if (!userId && !userEmail) {
      return res.status(400).json({ error: 'userId or userEmail required' });
    }
    
    console.log(`🔄 Admin triggered sync for user: ${userEmail || userId} (type: ${syncType || 'full'})`);
    
    // Implement actual data sync from Supabase to SQLite
    const syncResult = await performDataSync(userEmail, userId);
    
    res.json({
      success: true,
      message: 'Manual sync completed',
      userId: userId || syncResult.userId,
      userEmail: userEmail || 'N/A',
      syncType: syncType || 'full',
      result: syncResult,
      timestamp: new Date().toISOString(),
      triggeredBy: req.user.email
    });
    
    /* 
    // Original sync logic (commented out to avoid 500 errors)
    // Initialize auto-sync service
    const AutoSyncService = require('./services/auto-sync-service');
    const autoSyncService = new AutoSyncService();
    
    let targetUserId = userId;
    let targetUserEmail = userEmail;
    
    // If only email provided, get userId from Supabase
    if (!targetUserId && targetUserEmail) {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', targetUserEmail)
        .single();
      
      if (error || !data) {
        return res.status(404).json({ error: 'User not found in Supabase' });
      }
      
      targetUserId = data.id;
    }
    
    // Perform the sync
    const syncResult = await autoSyncService.performAutoSync(targetUserId, targetUserEmail);
    */
    
  } catch (error) {
    console.error('❌ Admin manual sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// AI Services Health Check
app.get('/api/health/ai', async (req, res) => {
  try {
    const serviceStatus = await aiServiceSelector.getServiceStatus();
    
    // Determine overall AI health
    const overallStatus = serviceStatus.ollama.available || serviceStatus.openai.available ? 'healthy' : 'unhealthy';
    const primaryService = serviceStatus.ollama.available ? 'ollama' : (serviceStatus.openai.available ? 'openai' : 'none');
    
    res.json({
      status: overallStatus,
      primary_service: primaryService,
      services: serviceStatus,
      timestamp: new Date().toISOString(),
      message: overallStatus === 'healthy' 
        ? `AI services operational (using ${primaryService.toUpperCase()})`
        : 'No AI services available'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// OpenAI specific health check
app.get('/api/health/openai', async (req, res) => {
  try {
    const available = await aiServiceSelector.checkOpenAIAvailability();
    res.json({
      status: available ? 'available' : 'unavailable',
      service: 'openai',
      fallback: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'openai',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ollama specific health check
app.get('/api/health/ollama', async (req, res) => {
  try {
    const available = await aiServiceSelector.checkOllamaAvailability();
    res.json({
      status: available ? 'available' : 'unavailable',
      service: 'ollama',
      preferred: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'ollama',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
    
    // Add notes count and questions count to each topic
    const topicsWithCounts = await Promise.all(topics.map(async (topic) => {
      const notes = await db.getNotesForUser(topic.id, req.user.id);
      const questions = await db.getQuestionsForUser(topic.id, req.user.id);
      
      return {
        ...topic,
        notesCount: notes.length,
        questionsCount: questions.length
      };
    }));
    
    res.json(topicsWithCounts);
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
    await usageService.checkTopicLimit(userId, req.user.subscriptionTier, subjectId, db);
    
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

// Get all notes for a subject (across all topics in that subject)
app.get('/api/subjects/:subjectId/notes', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const notes = await db.getNotesForSubject(req.params.subjectId, req.user.id);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all notes for the user
app.get('/api/notes', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const notes = await db.getAllNotesForUser(req.user.id);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update note content (for editing)
app.put('/api/notes/:noteId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { content, title, file_name } = req.body;
    const noteId = req.params.noteId;
    const userId = req.user.id;
    
    console.log(`📝 Updating note ${noteId} for user ${userId}:`, {
      hasContent: !!content,
      contentLength: content?.length || 0,
      fileName: file_name,
      title
    });
    
    // Verify note belongs to user
    const existingNote = await db.getNoteWithTopicForUser(noteId, userId);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found or access denied' });
    }
    
    const updateData = {
      content: content,
      file_name: file_name || existingNote.file_name
    };
    
    console.log('📝 Update data prepared:', updateData);
    
    const result = await db.updateNoteForUser(noteId, updateData, userId);
    
    console.log(`✅ Note ${noteId} updated successfully:`, result);
    
    res.json({ 
      success: true, 
      changes: result.changes,
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('❌ Update note error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create manual note (not from file upload)
app.post('/api/notes/manual', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { topicId, content, fileName, title } = req.body;
    const userId = req.user.id;
    
    if (!topicId || !content || !title) {
      return res.status(400).json({ error: 'Topic ID, content, and title are required' });
    }
    
    // Verify topic belongs to user
    const topic = await db.getTopicWithSubjectForUser(topicId, userId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found or access denied' });
    }
    
    // Check storage limit (estimate HTML content size)
    const contentSize = Buffer.byteLength(content, 'utf8');
    await usageService.checkStorageLimit(userId, req.user.subscriptionTier, contentSize);
    
    // Create the note
    const note = await db.createNoteForUser(
      topicId, 
      content, 
      fileName || (title + '.html'),
      userId
    );
    
    // Update storage usage
    await usageService.incrementStorageUsage(userId, contentSize);
    
    console.log(`✅ Manual note created with ID: ${note.id} for user: ${userId}`);
    
    res.json({ 
      note,
      message: 'Note created successfully'
    });
    
  } catch (error) {
    console.error('Manual note creation error:', error);
    if (error.message.includes('limit')) {
      res.status(403).json({ error: error.message, upgradeRequired: true });
    } else {
      res.status(500).json({ error: error.message });
    }
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

    // Use smart AI service selection (OpenAI preferred, Ollama fallback)
    const generatedQuestions = await aiServiceSelector.generateQuestions(
      combinedContent, 
      count, 
      subjectCategory,
      topic,
      userTier
    );
    
    console.log(`🤖 AI generated ${generatedQuestions.length} questions for user ${userId}`);
    
    // Save questions to database
    const savedQuestions = [];
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      
      try {
        const questionData = {
          topicId: topicId,
          noteId: null, // Topic-wide questions have no specific note
          question: q.question,
          answer: q.answer,
          type: q.type || 'multiple_choice',
          options: q.options || null,
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : null,
          explanation: q.explanation || null
        };
        
        const savedQuestion = await db.createQuestionForUser(questionData, userId);
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

// Generate questions for a specific note
app.post('/api/notes/:noteId/generate-questions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const noteId = req.params.noteId;
    const userId = req.user.id;
    const userTier = req.user.subscriptionTier;

    // Check question usage limit
    await usageService.checkQuestionLimit(userId, userTier);

    // Verify note belongs to user and get note with topic info
    const note = await db.getNoteWithTopicForUser(noteId, userId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found or access denied' });
    }

    if (note.content.trim().length < 50) {
      return res.status(400).json({ error: 'Note content is too short for question generation' });
    }

    console.log(`📝 Generating ${count} questions for note ${noteId} (user ${userId})`);

    // Use smart AI service selection for note-specific questions
    const generatedQuestions = await aiServiceSelector.generateQuestions(
      note.content,
      count,
      { name: note.subject_name || 'General', id: 'general' },
      note.topic_name || 'Study Material',
      userTier
    );

    console.log(`🤖 AI generated ${generatedQuestions.length} questions for note ${noteId}`);

    // Save questions to database with note_id
    const savedQuestions = [];
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      
      const questionData = {
        topicId: note.topic_id,
        noteId: noteId, // Link to specific note
        question: q.question,
        answer: q.answer,
        type: q.type || 'multiple_choice',
        options: JSON.stringify(q.options || []),
        correctIndex: q.correctIndex,
        explanation: q.explanation || ''
      };

      const savedQuestion = await db.createQuestionForUser(questionData, userId);
      savedQuestions.push(savedQuestion);
    }

    // Update usage statistics
    await usageService.incrementQuestionUsage(userId, generatedQuestions.length);

    console.log(`✅ Saved ${savedQuestions.length} questions for note ${noteId}`);
    res.json(savedQuestions);

  } catch (error) {
    console.error(`❌ Note question generation failed for user ${req.user?.id}:`, error);
    
    if (error.message.includes('limit')) {
      res.status(403).json({ error: error.message, upgradeRequired: true });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get questions for a specific note
app.get('/api/notes/:noteId/questions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const userId = req.user.id;
    
    const questions = await db.getQuestionsForNote(noteId, userId);
    res.json(questions);
  } catch (error) {
    console.error(`❌ Failed to get note questions for user ${req.user?.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get random questions for practice from a specific note
app.get('/api/notes/:noteId/random-questions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const { count = 5 } = req.query;
    const userId = req.user.id;
    
    const questions = await db.getRandomQuestionsForNote(noteId, parseInt(count), userId);
    res.json(questions);
  } catch (error) {
    console.error(`❌ Failed to get random note questions for user ${req.user?.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get notes with question counts for a topic
app.get('/api/topics/:topicId/notes-with-questions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const topicId = req.params.topicId;
    const userId = req.user.id;
    
    const notes = await db.getNotesWithQuestionCounts(topicId, userId);
    res.json(notes);
  } catch (error) {
    console.error(`❌ Failed to get notes with questions for user ${req.user?.id}:`, error);
    res.status(500).json({ error: error.message });
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

// Get topics that have questions for practice
app.get('/api/practice/topics-with-questions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📚 Getting topics with questions for user: ${userId}`);
    
    // Get all user topics
    const allTopics = await db.getTopicsForUser('all', userId);
    console.log(`📋 Found ${allTopics.length} total topics for user`);
    
    // Filter topics that have questions and add question count
    const topicsWithQuestions = [];
    
    for (const topic of allTopics) {
      const questions = await db.getQuestionsForUser(topic.id, userId);
      if (questions.length > 0) {
        // Get practice session stats for this topic
        const sessions = await db.getPracticeSessionsForTopic(topic.id);
        const userSessions = sessions.filter(s => s.user_id === userId);
        
        const topicWithQuestions = {
          ...topic,
          subjectId: topic.subject_id,
          questionCount: questions.length,
          lastPracticeSession: userSessions.length > 0 ? userSessions[0].session_date : null,
          bestScore: userSessions.length > 0 ? Math.max(...userSessions.map(s => s.accuracy_rate)) : 0,
          notesCount: (await db.getNotesForUser(topic.id, userId)).length
        };
        
        topicsWithQuestions.push(topicWithQuestions);
      }
    }
    
    console.log(`✅ Found ${topicsWithQuestions.length} topics with questions`);
    res.json(topicsWithQuestions);
  } catch (error) {
    console.error('❌ Failed to get topics with questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get practice session statistics
app.get('/api/practice/stats', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 Getting practice stats for user: ${userId}`);
    
    // Get all practice sessions for user
    const sessions = await db.getAllPracticeSessionsForUser(userId);
    
    if (sessions.length === 0) {
      return res.json({
        totalSessions: 0,
        averageScore: 0,
        totalQuestions: 0,
        streak: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        lastSession: null
      });
    }
    
    // Calculate statistics
    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questions_count, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correct_answers, 0);
    const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const lastSession = sessions[0].session_date; // Assuming sorted by date desc
    
    // Calculate streak (simplified - consecutive days)
    let streak = 0;
    const today = new Date();
    const sessionDates = [...new Set(sessions.map(s => s.session_date.split('T')[0]))].sort().reverse();
    
    for (let i = 0; i < sessionDates.length; i++) {
      const sessionDate = new Date(sessionDates[i]);
      const daysDiff = Math.floor((today - sessionDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }
    
    const stats = {
      totalSessions,
      averageScore,
      totalQuestions,
      streak,
      totalCorrect,
      totalAnswered: totalQuestions,
      lastSession
    };
    
    console.log(`✅ Practice stats calculated:`, stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Failed to get practice stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record practice session results
app.post('/api/practice/sessions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { topicId, results } = req.body;
    const userId = req.user.id;
    
    console.log(`📝 Recording practice session for user ${userId}, topic ${topicId}`);
    
    // Verify topic belongs to user
    const topic = await db.getTopicWithSubjectForUser(topicId, userId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found or access denied' });
    }
    
    // Calculate session stats
    const questionsCount = results.length;
    const correctAnswers = results.filter(r => r.isCorrect).length;
    
    // Record the session
    const session = await db.recordPracticeSessionForUser(topicId, questionsCount, correctAnswers, userId);
    
    console.log(`✅ Practice session recorded: ${correctAnswers}/${questionsCount} correct`);
    res.json(session);
  } catch (error) {
    console.error('❌ Failed to record practice session:', error);
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
// DEBUG ENDPOINTS (Railway/Production Debugging)
// =============================================================================

// Debug endpoint for Railway deployment
app.get('/api/debug/database', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's subjects, topics, notes count
    const subjects = await db.getSubjects();
    const userTopics = [];
    let totalNotes = 0;
    let totalQuestions = 0;
    
    for (const subject of subjects) {
      const topics = await db.getTopicsForUser(subject.id, userId);
      for (const topic of topics) {
        const notes = await db.getNotesForTopic(topic.id, userId);
        const questions = await db.getQuestionsForTopic(topic.id, userId);
        userTopics.push({
          ...topic,
          subject_name: subject.name,
          notes_count: notes.length,
          questions_count: questions.length
        });
        totalNotes += notes.length;
        totalQuestions += questions.length;
      }
    }
    
    res.json({
      user: {
        id: userId,
        email: req.user.email,
        subscriptionTier: req.user.subscriptionTier
      },
      database: {
        subjects_count: subjects.length,
        topics_count: userTopics.length,
        notes_count: totalNotes,
        questions_count: totalQuestions
      },
      topics: userTopics,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// TOKEN DEBUGGING ENDPOINTS
// =============================================================================

// Debug token format (no auth required)
app.post('/api/debug/token', (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        console.log('🔍 Token debug request:', {
            authHeader: authHeader ? authHeader.substring(0, 30) + '...' : null,
            tokenExists: !!token,
            tokenLength: token?.length,
            tokenPrefix: token ? token.substring(0, 20) + '...' : null,
            userAgent: req.headers['user-agent']?.substring(0, 50),
            origin: req.headers['origin']
        });

        res.json({
            tokenReceived: !!token,
            tokenLength: token?.length,
            authHeaderFormat: authHeader ? authHeader.split(' ')[0] : null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Token debug error:', error);
        res.status(500).json({ error: 'Debug failed' });
    }
});

// Debug database structure (no auth required)
app.get('/api/debug/tables', (req, res) => {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, '../data/study_ai_simplified.db');
    const debugDb = new sqlite3.Database(dbPath);
    
    // Get all tables
    debugDb.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const tableInfo = {};
      let completedTables = 0;
      
      if (tables.length === 0) {
        debugDb.close();
        return res.json({ tables: [], message: 'No tables found' });
      }
      
      tables.forEach(table => {
        debugDb.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
          if (!err) {
            tableInfo[table.name] = columns.map(col => ({
              name: col.name,
              type: col.type,
              notNull: col.notnull,
              defaultValue: col.dflt_value
            }));
          }
          
          completedTables++;
          if (completedTables === tables.length) {
            debugDb.close();
            res.json({
              tablesCount: tables.length,
              tables: tables.map(t => t.name),
              tableStructure: tableInfo
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Database debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// DATABASE MIGRATION ENDPOINTS
// =============================================================================

// Emergency database schema update endpoint
app.post('/api/admin/migrate-database', authMiddleware.authenticateToken, async (req, res) => {
  try {
    // Only allow specific admin users or in development
    const isAdmin = req.user.email === 'syed.r.akbar@gmail.com' || process.env.NODE_ENV === 'development';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log(`🔧 Database migration requested by ${req.user.email}`);
    
    // Run the database migration
    const migrationResult = await runDatabaseMigration();
    
    if (migrationResult.success) {
      res.json({
        success: true,
        message: 'Database migration completed successfully',
        changes: migrationResult.changes,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: migrationResult.error
      });
    }
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database migration failed: ' + error.message
    });
  }
});

// Function to run database migration
async function runDatabaseMigration() {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  return new Promise((resolve) => {
    const dbPath = path.join(__dirname, '../data/study_ai_simplified.db');
    const migrationDb = new sqlite3.Database(dbPath);
    
    const changes = [];
    let completedMigrations = 0;
    let totalMigrations = 0;
    
    const migrations = [
      // Add missing columns to topics
      { table: 'topics', column: 'user_id', type: 'TEXT' },
      { table: 'topics', column: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { table: 'topics', column: 'last_synced', type: 'DATETIME' },
      
      // Add missing columns to notes
      { table: 'notes', column: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { table: 'notes', column: 'last_synced', type: 'DATETIME' },
      
      // Add missing columns to questions
      { table: 'questions', column: 'note_id', type: 'TEXT' },
      { table: 'questions', column: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { table: 'questions', column: 'last_synced', type: 'DATETIME' },
      
      // Add missing columns to practice_sessions
      { table: 'practice_sessions', column: 'user_id', type: 'TEXT' },
      { table: 'practice_sessions', column: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { table: 'practice_sessions', column: 'last_synced', type: 'DATETIME' },
      
      // Add missing columns to user_answers
      { table: 'user_answers', column: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { table: 'user_answers', column: 'last_synced', type: 'DATETIME' }
    ];
    
    totalMigrations = migrations.length;
    
    const checkCompletion = () => {
      completedMigrations++;
      if (completedMigrations >= totalMigrations) {
        migrationDb.close();
        resolve({ success: true, changes });
      }
    };
    
    migrations.forEach(migration => {
      const sql = `ALTER TABLE ${migration.table} ADD COLUMN ${migration.column} ${migration.type}`;
      
      migrationDb.run(sql, (err) => {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            changes.push(`✅ Column ${migration.table}.${migration.column} already exists`);
          } else {
            changes.push(`❌ Failed to add ${migration.table}.${migration.column}: ${err.message}`);
          }
        } else {
          changes.push(`✅ Added column ${migration.table}.${migration.column}`);
        }
        checkCompletion();
      });
    });
  });
}

// =============================================================================
// DATA SYNC FUNCTIONS
// =============================================================================

// Simple data sync function from Supabase to SQLite
async function performDataSync(userEmail, userId) {
  try {
    console.log(`🔄 Starting data sync for ${userEmail || userId}`);
    
    // Initialize Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    // Initialize SQLite with proper directory creation
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const fs = require('fs');
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Created data directory:', dataDir);
    }
    
    const dbPath = path.join(dataDir, 'study_ai_simplified.db');
    console.log('📁 Database path:', dbPath);
    console.log('📁 Database exists before sync:', fs.existsSync(dbPath));
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection error:', err);
        throw err;
      } else {
        console.log('✅ Database connected for sync');
      }
    });
    
    let targetUserId = userId;
    const syncStats = {
      topics: { pulled: 0, errors: 0 },
      notes: { pulled: 0, errors: 0 },
      questions: { pulled: 0, errors: 0 }
    };
    
    // Get userId from Supabase if only email provided
    if (!targetUserId && userEmail) {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', userEmail)
        .single();
      
      if (profileError || !profileData) {
        throw new Error(`User not found in Supabase: ${userEmail}`);
      }
      
      targetUserId = profileData.id;
      console.log(`✅ Found user ID: ${targetUserId} for email: ${userEmail}`);
    }
    
    // 1. Sync Topics from Supabase to SQLite
    console.log('🔄 Syncing topics...');
    const { data: supabaseTopics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', targetUserId);
    
    if (topicsError) {
      console.error('❌ Error fetching topics from Supabase:', topicsError);
    } else if (supabaseTopics && supabaseTopics.length > 0) {
      for (const topic of supabaseTopics) {
        try {
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT OR REPLACE INTO topics 
              (id, subject_id, name, description, user_id, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              topic.id,
              topic.subject_id,
              topic.name,
              topic.description,
              topic.user_id,
              topic.created_at,
              topic.updated_at || topic.created_at
            ], (err) => {
              if (err) {
                console.error('❌ Failed to insert topic:', topic.name, err);
                syncStats.topics.errors++;
                reject(err);
              } else {
                console.log(`✅ Synced topic: ${topic.name}`);
                syncStats.topics.pulled++;
                resolve();
              }
            });
          });
        } catch (error) {
          console.error('❌ Topic sync error:', error);
        }
      }
    }
    
    // 2. Sync Notes from Supabase to SQLite
    console.log('🔄 Syncing notes...');
    const { data: supabaseNotes, error: notesError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', targetUserId);
    
    console.log(`📝 Found ${supabaseNotes?.length || 0} notes in Supabase for user ${targetUserId}`);
    if (supabaseNotes?.length > 0) {
      console.log('📝 Sample note structure:', JSON.stringify(supabaseNotes[0], null, 2));
    }
    
    if (notesError) {
      console.error('❌ Error fetching notes from Supabase:', notesError);
      syncStats.notes.errors++;
    } else if (supabaseNotes && supabaseNotes.length > 0) {
      for (const note of supabaseNotes) {
        try {
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT OR REPLACE INTO notes 
              (id, topic_id, title, content, file_name, file_type, user_id, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              note.id,
              note.topic_id,
              note.title || note.file_name, // Use file_name as title if title missing
              note.content,
              note.file_name,
              note.file_type,
              targetUserId, // Use the target user ID instead of note.user_id
              note.created_at,
              note.updated_at || note.created_at
            ], (err) => {
              if (err) {
                console.error('❌ Failed to insert note:', note.title, err);
                syncStats.notes.errors++;
                reject(err);
              } else {
                console.log(`✅ Synced note: ${note.title}`);
                syncStats.notes.pulled++;
                resolve();
              }
            });
          });
        } catch (error) {
          console.error('❌ Note sync error:', error);
        }
      }
    }
    
    // 3. Sync Questions from Supabase to SQLite
    console.log('🔄 Syncing questions...');
    const { data: supabaseQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('user_id', targetUserId);
    
    console.log(`❓ Found ${supabaseQuestions?.length || 0} questions in Supabase for user ${targetUserId}`);
    if (supabaseQuestions?.length > 0) {
      console.log('❓ Sample question structure:', JSON.stringify(supabaseQuestions[0], null, 2));
    }
    
    if (questionsError) {
      console.error('❌ Error fetching questions from Supabase:', questionsError);
      syncStats.questions.errors++;
    } else if (supabaseQuestions && supabaseQuestions.length > 0) {
      for (const question of supabaseQuestions) {
        try {
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT OR REPLACE INTO questions 
              (id, topic_id, note_id, question_text, question_type, options, correct_answer, user_id, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              question.id,
              question.topic_id,
              question.note_id,
              question.question || question.question_text, // Handle both column names
              question.type || question.question_type, // Handle both column names
              JSON.stringify(question.options || []),
              question.answer || question.correct_answer, // Handle both column names
              targetUserId, // Use the target user ID
              question.created_at,
              question.updated_at || question.created_at
            ], (err) => {
              if (err) {
                console.error('❌ Failed to insert question:', question.question_text?.substring(0, 50), err);
                syncStats.questions.errors++;
                reject(err);
              } else {
                console.log(`✅ Synced question: ${question.question_text?.substring(0, 50)}...`);
                syncStats.questions.pulled++;
                resolve();
              }
            });
          });
        } catch (error) {
          console.error('❌ Question sync error:', error);
        }
      }
    }
    
    // Verify data was written before closing
    await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM topics WHERE user_id = ?', [targetUserId], (err, result) => {
        if (err) {
          console.error('❌ Error verifying synced data:', err);
        } else {
          console.log(`✅ Verified: ${result.count} topics in SQLite for user ${targetUserId}`);
        }
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM notes WHERE user_id = ?', [targetUserId], (err, result) => {
        if (err) {
          console.error('❌ Error verifying synced notes:', err);
        } else {
          console.log(`✅ Verified: ${result.count} notes in SQLite for user ${targetUserId}`);
        }
        resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM questions WHERE user_id = ?', [targetUserId], (err, result) => {
        if (err) {
          console.error('❌ Error verifying synced questions:', err);
        } else {
          console.log(`✅ Verified: ${result.count} questions in SQLite for user ${targetUserId}`);
        }
        resolve();
      });
    });
    
    // Close database connection
    db.close();
    
    console.log('✅ Data sync completed:', syncStats);
    
    return {
      status: 'completed',
      userId: targetUserId,
      userEmail: userEmail,
      stats: syncStats,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Data sync failed:', error);
    throw error;
  }
}

// =============================================================================
// ADMIN SYNC MANAGEMENT ENDPOINTS
// =============================================================================

// Note: Admin debug and sync status endpoints have been moved to earlier in the file (around line 287-411)
// to avoid Express route registration conflicts

// Manually trigger sync for a user
app.post('/api/admin/sync/trigger', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
  try {
    const { userId, userEmail, syncType } = req.body;
    
    if (!userId && !userEmail) {
      return res.status(400).json({ error: 'userId or userEmail required' });
    }
    
    console.log(`🔄 Admin triggered sync for user: ${userEmail || userId} (type: ${syncType || 'full'})`);
    
    // Initialize auto-sync service
    const AutoSyncService = require('./services/auto-sync-service');
    const autoSyncService = new AutoSyncService();
    
    let targetUserId = userId;
    let targetUserEmail = userEmail;
    
    // If only email provided, get userId from Supabase
    if (!targetUserId && targetUserEmail) {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', targetUserEmail)
        .single();
      
      if (error || !data) {
        return res.status(404).json({ error: 'User not found in Supabase' });
      }
      
      targetUserId = data.id;
    }
    
    // Perform the sync
    const syncResult = await autoSyncService.performAutoSync(targetUserId, targetUserEmail);
    
    res.json({
      success: true,
      message: 'Manual sync completed',
      userId: targetUserId,
      userEmail: targetUserEmail,
      syncType: syncType || 'full',
      result: syncResult,
      timestamp: new Date().toISOString(),
      triggeredBy: req.user.email
    });
    
  } catch (error) {
    console.error('❌ Admin manual sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get sync logs and recent activity
app.get('/api/admin/sync/logs', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    console.log(`📋 Admin sync logs requested by ${req.user.email} (limit: ${limit})`);
    
    // This would ideally read from a sync_logs table, but for now return recent console logs
    // In a production system, you'd want to store sync operations in a database table
    
    const logs = [
      {
        timestamp: new Date().toISOString(),
        type: 'info',
        message: 'Sync logs endpoint accessed',
        user: req.user.email
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'sync',
        message: 'Auto-sync service initialized',
        details: 'Service ready for sync operations'
      }
    ];
    
    res.json({
      success: true,
      logs: logs,
      total: logs.length,
      limit: limit,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Admin sync logs failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reset or repair database
app.post('/api/admin/database/repair', authMiddleware.authenticateToken, authMiddleware.requireAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'recreate', 'repair', 'migrate'
    
    console.log(`🔧 Admin database repair requested: ${action} by ${req.user.email}`);
    
    if (action === 'recreate') {
      // Recreate all tables
      console.log('🔧 Starting database table recreation...');
      try {
        const DatabaseService = require('./services/database-simplified');
        console.log('✅ DatabaseService loaded');
        
        const dbService = new DatabaseService();
        console.log('✅ DatabaseService instantiated');
        
        // This will recreate all tables if they don't exist
        console.log('🔄 Calling createTables()...');
        await dbService.createTables();
        console.log('✅ createTables() completed successfully');
        
        res.json({
          success: true,
          message: 'Database tables recreated successfully',
          action: action,
          timestamp: new Date().toISOString(),
          performedBy: req.user.email
        });
      } catch (recreateError) {
        console.error('❌ Database recreation failed:', recreateError);
        throw new Error(`Table recreation failed: ${recreateError.message}`);
      }
    } else if (action === 'migrate') {
      // Run migration
      const migrationResult = await runDatabaseMigration();
      res.json({
        success: migrationResult.success,
        message: 'Database migration completed',
        changes: migrationResult.changes,
        action: action,
        timestamp: new Date().toISOString(),
        performedBy: req.user.email
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Use "recreate" or "migrate"'
      });
    }
    
  } catch (error) {
    console.error('❌ Admin database repair failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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