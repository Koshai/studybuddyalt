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

// Get all subjects (backward compatible)
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await db.getSubjects(); // This now handles both cases
    res.json(subjects);
  } catch (error) {
    console.error('Error getting subjects:', error);
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

// Create new subject (backward compatible)
app.post('/api/subjects', async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;
    
    console.log('Creating subject:', { name, description, categoryId });
    
    const subject = await db.createSubject(name, description || '', categoryId || null);
    
    console.log('Subject created successfully:', subject);
    res.json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
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

// Add this endpoint for notes
app.get('/api/topics/:topicId/notes', async (req, res) => {
  try {
    const notes = await db.getNotes(req.params.topicId);
    res.json(notes);
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced question generation with category-aware AI
app.post('/api/topics/:topicId/generate-questions', async (req, res) => {
  try {
    const { count = 5, difficulty = 'medium' } = req.body;
    const topicId = req.params.topicId;
    
    console.log(`Generating ${count} questions for topic ${topicId} with difficulty ${difficulty}`);
    
    // Get enhanced topic information with category
    const topicInfo = await db.getTopicWithSubjectCategory(topicId);
    if (!topicInfo) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    console.log(`Topic: ${topicInfo.name}, Subject: ${topicInfo.subject_name}, Category: ${topicInfo.category_name || 'None'}`);
    
    // Get notes for this topic
    const notes = await db.getNotes(topicId);
    
    if (notes.length === 0) {
      return res.status(400).json({ error: 'No notes found for this topic' });
    }

    console.log(`Found ${notes.length} notes for topic ${topicInfo.name}`);

    // Combine all notes content
    const combinedContent = notes.map(note => note.content).join('\n\n');
    
    // Create enhanced subject and topic objects for AI
    const enhancedSubject = {
      id: topicInfo.subject_id,
      name: topicInfo.subject_name,
      category_id: topicInfo.category_id,
      category_name: topicInfo.category_name,
      domain_type: topicInfo.domain_type,
      ai_instructions: topicInfo.ai_instructions
    };
    
    const enhancedTopic = {
      id: topicInfo.id,
      name: topicInfo.name,
      description: topicInfo.description
    };
    
    // Generate questions using enhanced Ollama service with category context
    const generatedQuestions = await ollama.generateQuestions(
      combinedContent, 
      count, 
      difficulty, 
      enhancedSubject,  // Enhanced subject with category info
      enhancedTopic     // Topic info
    );
    
    console.log(`AI generated ${generatedQuestions.length} questions`);
    
    // Save questions to database
    const savedQuestions = [];
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      
      try {
        const questionData = {
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty || difficulty,
          type: q.type || 'multiple_choice',
          options: q.options || null,
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : null,
          explanation: q.explanation || null
        };
        
        const savedQuestion = await db.createQuestion(topicId, questionData);
        savedQuestions.push(savedQuestion);
        
        console.log(`Question ${i + 1} saved successfully with ID: ${savedQuestion.id}`);
        
      } catch (error) {
        console.error(`Error saving question ${i + 1}:`, error);
      }
    }

    console.log(`Successfully saved ${savedQuestions.length} out of ${generatedQuestions.length} questions`);
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

// Enhanced endpoint to get questions with full MCQ support
app.get('/api/topics/:topicId/questions/enhanced', async (req, res) => {
  try {
    const { type, difficulty } = req.query;
    const topicId = req.params.topicId;
    
    let questions;
    if (type) {
      questions = await db.getQuestionsByType(topicId, type);
    } else {
      questions = await db.getQuestions(topicId);
    }
    
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    
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

// Update question endpoint
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

// Delete question endpoint
app.delete('/api/questions/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const result = await db.deleteQuestion(questionId);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced topic statistics
app.get('/api/topics/:topicId/stats', async (req, res) => {
  try {
    const stats = await db.getTopicStats(req.params.topicId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subject categories (new endpoint, safe if table doesn't exist)
app.get('/api/subject-categories', async (req, res) => {
  try {
    // Check if method exists (categories system is set up)
    if (typeof db.getSubjectCategories === 'function') {
      const categories = await db.getSubjectCategories();
      res.json(categories);
    } else {
      // Return empty array if categories not implemented yet
      res.json([]);
    }
  } catch (error) {
    console.warn('Categories not available:', error);
    res.json([]); // Return empty array instead of error
  }
});

// Get subjects with category information
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await db.getSubjectsWithCategories();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new subject with category
app.post('/api/subjects', async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;
    const subject = await db.createSubject(name, description, categoryId);
    
    // Return subject with category info
    const subjectWithCategory = await db.getSubjectByIdWithCategory(subject.id);
    res.json(subjectWithCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-classify existing subjects (migration endpoint)
app.post('/api/subjects/auto-classify', async (req, res) => {
  try {
    await db.autoClassifySubjects();
    const subjects = await db.getSubjectsWithCategories();
    res.json({ 
      success: true, 
      message: 'Subjects auto-classified successfully',
      subjects 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subject category
app.put('/api/subjects/:subjectId/category', async (req, res) => {
  try {
    const { categoryId } = req.body;
    const subjectId = req.params.subjectId;
    
    await db.updateSubjectCategory(subjectId, categoryId);
    const updatedSubject = await db.getSubjectByIdWithCategory(subjectId);
    
    res.json(updatedSubject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subjects by category
app.get('/api/categories/:categoryId/subjects', async (req, res) => {
  try {
    const subjects = await db.getSubjectsByCategory(req.params.categoryId);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Validate question endpoint (for testing AI generation)
app.post('/api/questions/validate', async (req, res) => {
  try {
    const { question, options, correctIndex } = req.body;
    
    // Basic validation
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    if (!question || question.trim().length < 10) {
      validation.isValid = false;
      validation.errors.push('Question must be at least 10 characters long');
    }
    
    if (options && options.length === 4) {
      // MCQ validation
      if (correctIndex < 0 || correctIndex >= 4) {
        validation.isValid = false;
        validation.errors.push('Correct index must be between 0 and 3');
      }
      
      // Check for duplicate options
      const uniqueOptions = [...new Set(options)];
      if (uniqueOptions.length !== options.length) {
        validation.warnings.push('Some options appear to be duplicates');
      }
      
      // Check for obviously wrong patterns
      const problematicPatterns = [
        'and other factors',
        'the opposite of',
        'not ',
        'none of the above'
      ];
      
      options.forEach((option, index) => {
        if (index !== correctIndex) {
          const lowerOption = option.toLowerCase();
          problematicPatterns.forEach(pattern => {
            if (lowerOption.includes(pattern)) {
              validation.warnings.push(`Option ${index + 1} contains potentially problematic pattern: "${pattern}"`);
            }
          });
        }
      });
    }
    
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk question generation for testing
app.post('/api/topics/:topicId/generate-bulk', async (req, res) => {
  try {
    const { 
      textCount = 3, 
      mcqCount = 2, 
      difficulty = 'medium' 
    } = req.body;
    const topicId = req.params.topicId;
    
    // Get notes for this topic
    const notes = await db.getNotes(topicId);
    
    if (notes.length === 0) {
      return res.status(400).json({ error: 'No notes found for this topic' });
    }

    const combinedContent = notes.map(note => note.content).join('\n\n');
    
    // Generate different types of questions
    const textQuestions = await ollama.generateTextQuestions(combinedContent, textCount, difficulty);
    const mcqQuestions = await ollama.generateMCQQuestions(combinedContent, mcqCount, difficulty);
    
    const allQuestions = [...textQuestions, ...mcqQuestions];
    
    // Save all questions
    const savedQuestions = [];
    for (const q of allQuestions) {
      try {
        const questionData = {
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty,
          type: q.type || 'text',
          options: q.options || null,
          correctIndex: q.correctIndex || null,
          explanation: q.explanation || null
        };
        
        const question = await db.createQuestion(topicId, questionData);
        savedQuestions.push(question);
      } catch (error) {
        console.error('Error saving question:', error);
      }
    }

    res.json({
      generated: allQuestions.length,
      saved: savedQuestions.length,
      questions: savedQuestions
    });
  } catch (error) {
    console.error('Bulk generation error:', error);
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

// Enhanced Ollama test endpoint
app.get('/api/test-ollama-detailed', async (req, res) => {
  try {
    console.log('=== DETAILED OLLAMA TEST ===');
    
    const results = {
      status: 'running tests...',
      tests: {}
    };
    
    // Test 1: List models
    try {
      const models = await ollama.listModels();
      results.tests.modelsAvailable = {
        status: 'success',
        count: models.length,
        models: models.map(m => m.name)
      };
    } catch (error) {
      results.tests.modelsAvailable = {
        status: 'failed',
        error: error.message
      };
    }
    
    // Test 2: Simple generation
    try {
      const { Ollama } = require('ollama');
      const ollamaClient = new Ollama({ host: 'http://localhost:11434' });
      
      const simpleTest = await ollamaClient.generate({
        model: 'llama3.2:3b',
        prompt: 'Say "Hello World" and nothing else.',
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 20
        }
      });
      
      results.tests.simpleGeneration = {
        status: 'success',
        response: simpleTest.response,
        responseLength: simpleTest.response?.length
      };
    } catch (error) {
      results.tests.simpleGeneration = {
        status: 'failed',
        error: error.message
      };
    }
    
    // Test 3: Question generation with detailed logging
    const testContent = `
The Battle of Hastings was fought on 14 October 1066 between the Norman-French army of William, 
the Duke of Normandy, and an English army under the Anglo-Saxon King Harold Godwinson. 
William defeated Harold and became King of England. This battle marked the beginning of Norman rule in England.
The battle was decisive and changed the course of English history forever.
    `;
    
    try {
      console.log('Testing question generation...');
      const questions = await ollama.generateQuestions(testContent, 2, 'medium');
      
      results.tests.questionGeneration = {
        status: questions.length > 0 ? 'success' : 'failed',
        questionsGenerated: questions.length,
        questions: questions.map(q => ({
          question: q.question?.substring(0, 100),
          type: q.type,
          optionsCount: q.options?.length,
          correctIndex: q.correctIndex,
          hasAnswer: !!q.answer
        }))
      };
      
      if (questions.length === 0) {
        // Try the backup method
        console.log('Trying backup generation method...');
        const backupQuestions = await ollama.generateSimpleQuestions(testContent, 2);
        
        results.tests.backupGeneration = {
          status: backupQuestions.length > 0 ? 'success' : 'failed',
          questionsGenerated: backupQuestions.length,
          questions: backupQuestions.map(q => ({
            question: q.question?.substring(0, 100),
            type: q.type,
            optionsCount: q.options?.length,
            correctIndex: q.correctIndex
          }))
        };
      }
      
    } catch (error) {
      results.tests.questionGeneration = {
        status: 'failed',
        error: error.message,
        stack: error.stack
      };
    }
    
    // Determine overall status
    const allTests = Object.values(results.tests);
    const failedTests = allTests.filter(test => test.status === 'failed');
    
    if (failedTests.length === 0) {
      results.status = 'success';
      results.message = 'All tests passed!';
    } else {
      results.status = 'partial';
      results.message = `${failedTests.length} out of ${allTests.length} tests failed`;
    }
    
    res.json(results);
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test question generation with your actual data
app.post('/api/test-generation/:topicId', async (req, res) => {
  try {
    const topicId = req.params.topicId;
    console.log(`Testing generation for topic: ${topicId}`);
    
    // Get notes for this topic
    const notes = await db.getNotes(topicId);
    console.log(`Found ${notes.length} notes`);
    
    if (notes.length === 0) {
      return res.json({
        status: 'no_content',
        message: 'No study materials found for this topic',
        solution: 'Upload some notes, PDFs, or images first'
      });
    }
    
    // Combine content
    const combinedContent = notes.map(note => note.content).join('\n\n');
    console.log(`Combined content length: ${combinedContent.length}`);
    
    if (combinedContent.length < 50) {
      return res.json({
        status: 'insufficient_content',
        message: 'Study materials are too short',
        contentLength: combinedContent.length,
        solution: 'Upload more detailed study materials'
      });
    }
    
    // Test both generation methods
    const results = {};
    
    try {
      console.log('Testing primary generation method...');
      const primaryQuestions = await ollama.generateQuestions(combinedContent, 2, 'medium');
      results.primary = {
        method: 'generateQuestions',
        questionsGenerated: primaryQuestions.length,
        questions: primaryQuestions
      };
    } catch (error) {
      results.primary = {
        method: 'generateQuestions',
        error: error.message
      };
    }
    
    try {
      console.log('Testing backup generation method...');
      const backupQuestions = await ollama.generateSimpleQuestions(combinedContent, 2);
      results.backup = {
        method: 'generateSimpleQuestions',
        questionsGenerated: backupQuestions.length,
        questions: backupQuestions
      };
    } catch (error) {
      results.backup = {
        method: 'generateSimpleQuestions',
        error: error.message
      };
    }
    
    res.json({
      status: 'completed',
      topicId: topicId,
      notesCount: notes.length,
      contentLength: combinedContent.length,
      results: results
    });
    
  } catch (error) {
    console.error('Test generation error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Enhanced Ollama service endpoint with domain detection
app.get('/api/test-domain-detection/:topicId', async (req, res) => {
  try {
    const topicId = req.params.topicId;
    const topicInfo = await db.getTopicWithSubjectCategory(topicId);
    
    if (!topicInfo) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    const notes = await db.getNotes(topicId);
    const content = notes.map(note => note.content).join('\n\n');
    
    const enhancedSubject = {
      id: topicInfo.subject_id,
      name: topicInfo.subject_name,
      category_name: topicInfo.category_name,
      domain_type: topicInfo.domain_type
    };
    
    const enhancedTopic = {
      id: topicInfo.id,
      name: topicInfo.name
    };
    
    // Test domain detection
    const detectedDomain = ollama.detectDomain(content, enhancedSubject, enhancedTopic);
    
    res.json({
      topic: topicInfo,
      contentLength: content.length,
      detectedDomain: detectedDomain,
      categoryFromDB: topicInfo.category_name,
      domainFromDB: topicInfo.domain_type
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple health check for Ollama
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});