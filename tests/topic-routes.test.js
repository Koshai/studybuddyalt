const express = require('express');
const request = require('supertest');

jest.mock('../src/server/middleware/auth-middleware', () => ({
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Access token required' });
    }
    req.user = { id: 'user-1' };
    return next();
  }
}));

const mockStorage = {
  getTopicById: jest.fn(),
  getNotesForUser: jest.fn(),
  getSubjectById: jest.fn(),
  createQuestion: jest.fn(),
  getQuestionsForUser: jest.fn()
};

const mockAiService = {
  generateQuestions: jest.fn()
};

jest.mock('../src/server/services/service-factory', () => ({
  getStorageService: () => mockStorage,
  getAIService: () => mockAiService
}));

const topicRoutes = require('../src/server/routes/topic-routes');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/topics', topicRoutes);
  return app;
}

describe('Topic routes baseline tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects topic access without auth token', async () => {
    const app = makeApp();
    const response = await request(app).get('/api/topics/topic-1');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token required');
  });

  test('generate-questions-openai returns 400 if no notes exist', async () => {
    const app = makeApp();
    mockStorage.getTopicById.mockResolvedValue({ id: 'topic-1', subject_id: 'mathematics', name: 'Algebra' });
    mockStorage.getNotesForUser.mockResolvedValue([]);

    const response = await request(app)
      .post('/api/topics/topic-1/generate-questions-openai')
      .set('Authorization', 'Bearer fake')
      .send({ count: 3 });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/No study materials found/i);
  });

  test('generate-questions-openai returns saved questions when generation succeeds', async () => {
    const app = makeApp();
    mockStorage.getTopicById.mockResolvedValue({ id: 'topic-1', subject_id: 'mathematics', name: 'Algebra' });
    mockStorage.getNotesForUser.mockResolvedValue([{ content: 'Linear equations and slope.' }]);
    mockStorage.getSubjectById.mockResolvedValue({ id: 'mathematics', name: 'Mathematics' });

    mockAiService.generateQuestions.mockResolvedValue([
      { question: 'What is slope?', answer: 'Rate of change', type: 'multiple_choice', options: ['x', 'y', 'z', 'Rate of change'], correctIndex: 3 }
    ]);

    mockStorage.createQuestion.mockImplementation(async (_userId, topicId, data) => ({
      id: 'q-1',
      topic_id: topicId,
      ...data
    }));

    const response = await request(app)
      .post('/api/topics/topic-1/generate-questions-openai')
      .set('Authorization', 'Bearer fake')
      .send({ count: 1 });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe('q-1');
    expect(mockAiService.generateQuestions).toHaveBeenCalledTimes(1);
    expect(mockStorage.createQuestion).toHaveBeenCalledTimes(1);
  });
});
