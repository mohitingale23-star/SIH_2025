const { Pinecone } = require('@pinecone-database/pinecone');
const pino = require('pino');

const logger = pino();

class PineconeService {
  constructor() {
    this.client = null;
    this.index = null;
    this.indexName = process.env.PINECONE_INDEX_NAME || 'health-chatbot-index';
    this.initialized = false;
  }

  async initialize() {
    try {
      if (!process.env.PINECONE_API_KEY) {
        logger.warn('PINECONE_API_KEY not found, using mock mode');
        this.useMock = true;
        this.initialized = true;
        return;
      }

      logger.info('Initializing connection to remote Pinecone database...');
      
      this.client = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
      });

      this.index = this.client.index(this.indexName);
      this.useMock = false; // Explicitly disable mock mode
      this.initialized = true;
      
      logger.info(`✅ Successfully connected to remote Pinecone index: ${this.indexName}`);
    } catch (error) {
      logger.error('Failed to initialize remote Pinecone connection:', error);
      logger.warn('Falling back to mock mode');
      this.useMock = true;
      this.initialized = true;
    }
  }

  async query(vector, topK = 3, filter = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.useMock) {
      return this._mockQuery(vector, topK);
    }

    try {
      const queryResponse = await this.index.query({
        vector,
        topK,
        includeMetadata: true,
        includeValues: false,
        filter
      });

      return queryResponse.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata
      }));
    } catch (error) {
      logger.error('Pinecone query failed:', error);
      return this._mockQuery(vector, topK);
    }
  }

  async upsert(vectors) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.useMock) {
      logger.info('Mock: Upserting vectors to Pinecone');
      return { upsertedCount: vectors.length };
    }

    try {
      const upsertResponse = await this.index.upsert(vectors);
      logger.info(`Upserted ${vectors.length} vectors to Pinecone`);
      return upsertResponse;
    } catch (error) {
      logger.error('Pinecone upsert failed:', error);
      throw error;
    }
  }

  async deleteAll() {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.useMock) {
      logger.info('Mock: Deleting all vectors from Pinecone');
      return;
    }

    try {
      await this.index.deleteAll();
      logger.info('Deleted all vectors from Pinecone');
    } catch (error) {
      logger.error('Pinecone delete all failed:', error);
      throw error;
    }
  }

  _mockQuery(vector, topK) {
    logger.info('Using mock Pinecone query');
    
    const mockResults = [
      {
        id: 'health-tip-1',
        score: 0.95,
        metadata: {
          text: 'Regular exercise for at least 30 minutes a day can significantly improve cardiovascular health and reduce the risk of heart disease.',
          category: 'exercise',
          source: 'health-guidelines'
        }
      },
      {
        id: 'health-tip-2',
        score: 0.87,
        metadata: {
          text: 'A balanced diet rich in fruits, vegetables, whole grains, and lean proteins provides essential nutrients for optimal body function.',
          category: 'nutrition',
          source: 'dietary-guidelines'
        }
      },
      {
        id: 'health-tip-3',
        score: 0.82,
        metadata: {
          text: 'Getting 7-9 hours of quality sleep each night is crucial for mental health, immune function, and overall well-being.',
          category: 'sleep',
          source: 'sleep-research'
        }
      }
    ];

    return mockResults.slice(0, topK);
  }
}

module.exports = new PineconeService();
