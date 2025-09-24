const express = require('express');
const chatController = require('../controllers/chatController');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Middleware to add request start time for performance tracking
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// POST /chat - Main chat endpoint
router.post('/', asyncHandler(async (req, res, next) => {
  await chatController.processChat(req, res, next);
}));

// GET /chat/health/:topic - Get health information about a specific topic
router.get('/health/:topic', asyncHandler(async (req, res, next) => {
  await chatController.getHealthInfo(req, res, next);
}));

// GET /chat/history/:sessionId - Get chat history for a session (placeholder)
router.get('/history/:sessionId', asyncHandler(async (req, res, next) => {
  await chatController.getChatHistory(req, res, next);
}));

// GET /chat/test - Simple test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Health Chatbot API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: 'POST /chat',
      healthInfo: 'GET /chat/health/:topic',
      history: 'GET /chat/history/:sessionId',
      test: 'GET /chat/test'
    }
  });
});

module.exports = router;
