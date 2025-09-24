const pineconeService = require('../services/pineconeService');
const geminiService = require('../services/geminiService');
const e5EmbeddingService = require('../services/e5EmbeddingService');
const PromptBuilder = require('../utils/promptBuilder');
const { ValidationError, ServiceUnavailableError } = require('../middleware/errorHandler');
const pino = require('pino');

const logger = pino();

class ChatController {
  async processChat(req, res, next) {
    try {
      const { message, sessionId } = req.body;

      // Validate input
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new ValidationError('Message is required and must be a non-empty string');
      }

      if (message.trim().length > 1000) {
        throw new ValidationError('Message must be less than 1000 characters');
      }

      logger.info({
        sessionId,
        messageLength: message.length
      }, 'Processing chat request');

      const startTime = Date.now();

      // Step 1: Generate E5 embedding for the user query
      const queryEmbedding = await e5EmbeddingService.embed(message);
      
      // Step 2: Query Pinecone vector database for similar chunks
      const retrievedChunks = await pineconeService.query(queryEmbedding, 3);
      
      logger.info({
        chunksRetrieved: retrievedChunks.length,
        topScore: retrievedChunks[0]?.score || 0
      }, 'Retrieved context chunks from vector database');

      // Step 3: Build RAG prompt with retrieved context
      const ragPrompt = PromptBuilder.buildRAGPrompt(message, retrievedChunks);

      // Step 4: Generate response using Gemini AI
      let response = await geminiService.generate(ragPrompt);

      // Step 5: Add health disclaimer
      response = PromptBuilder.addHealthDisclaimer(response);

      // Step 6: Prepare response data
      const responseData = {
        response: response,
        sessionId: sessionId || this._generateSessionId(),
        sources: retrievedChunks.map(chunk => ({
          id: chunk.id,
          score: Math.round(chunk.score * 100) / 100,
          category: chunk.metadata.category,
          source: chunk.metadata.source
        })),
        metadata: {
          processingTime: Date.now() - startTime,
          chunksUsed: retrievedChunks.length,
          embeddingDimensions: queryEmbedding.length
        }
      };

      logger.info({
        sessionId: responseData.sessionId,
        responseLength: response.length,
        sourcesCount: responseData.sources.length,
        processingTime: responseData.metadata.processingTime
      }, 'Chat request processed successfully');

      res.json(responseData);

    } catch (error) {
      logger.error('Chat processing failed:', error);
      next(error);
    }
  }

  async getHealthInfo(req, res, next) {
    try {
      const { topic } = req.params;
      
      if (!topic) {
        throw new ValidationError('Health topic is required');
      }

      logger.info({ topic }, 'Fetching health information');

      // Generate embedding for the topic using E5
      const topicEmbedding = await e5EmbeddingService.embed(topic);
      
      // Query Pinecone for relevant health information
      const healthChunks = await pineconeService.query(topicEmbedding, 5);
      
      // Build informational prompt
      const infoPrompt = `Provide comprehensive, accurate health information about: ${topic}

Use the following context if relevant:
${PromptBuilder.formatChunksForContext(healthChunks)}

Please provide:
1. Overview of the topic
2. Key facts and recommendations
3. Common misconceptions (if any)
4. When to seek professional help
5. Relevant lifestyle considerations

Keep the information accurate, accessible, and include appropriate medical disclaimers.`;

      const healthInfo = await geminiService.generate(infoPrompt);
      const finalInfo = PromptBuilder.addHealthDisclaimer(healthInfo);

      res.json({
        topic,
        information: finalInfo,
        sources: healthChunks.map(chunk => ({
          id: chunk.id,
          score: Math.round(chunk.score * 100) / 100,
          category: chunk.metadata.category,
          source: chunk.metadata.source
        })),
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Health info request failed:', error);
      next(error);
    }
  }

  async getChatHistory(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        throw new ValidationError('Session ID is required');
      }

      // In a real application, you would fetch from a database
      // For now, return a mock response
      res.json({
        sessionId,
        messages: [],
        message: 'Chat history feature not implemented yet - would require database integration'
      });

    } catch (error) {
      logger.error('Chat history request failed:', error);
      next(error);
    }
  }

  _generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = new ChatController();
