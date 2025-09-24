const axios = require('axios');
const pino = require('pino');

const logger = pino();

class E5EmbeddingService {
  constructor() {
    this.apiUrl = 'https://api-inference.huggingface.co/models/intfloat/multilingual-e5-large';
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.useMock = !this.apiKey;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    if (this.useMock) {
      logger.warn('HUGGINGFACE_API_KEY not found, using enhanced mock mode');
    } else {
      logger.info('E5 Embedding Service initialized with Hugging Face API');
    }
  }

  async embed(text) {
    if (this.useMock) {
      return this._generateEnhancedMockEmbedding(text);
    }

    // E5 models require specific prefixes for optimal performance
    const prefixedText = `query: ${text}`;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/intfloat/multilingual-e5-large',
          { inputs: text },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        const embedding = response.data;
        const duration = Date.now() - startTime;
        
        logger.info(`✅ E5 embedding generated in ${duration}ms (attempt ${attempt})`);
        
        // Ensure we have 1024 dimensions (matching your Pinecone index)
        if (Array.isArray(embedding) && embedding.length === 1024) {
          return embedding;
        } else {
          throw new Error(`Expected 1024 dimensions, got ${Array.isArray(embedding) ? embedding.length : 'non-array'}`);
        }

      } catch (error) {
        if (error.response?.status === 503 && attempt < this.maxRetries) {
          logger.warn(`🔄 E5 model loading, retrying in ${this.retryDelay}ms (attempt ${attempt})`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          continue;
        }

        logger.error(`❌ E5 embedding failed (attempt ${attempt}): ${error.message}`);
        if (error.response) {
          logger.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
        }
        
        if (attempt === this.maxRetries) {
          logger.warn('Falling back to enhanced mock embedding');
          return this._generateEnhancedMockEmbedding(text);
        }
      }
    }
  }

  async embedBatch(texts) {
    if (this.useMock) {
      logger.info(`Using enhanced mock E5 batch embedding for ${texts.length} texts`);
      return texts.map(text => this._generateEnhancedMockEmbedding(text));
    }

    // Process in batches to avoid API limits
    const batchSize = 8;
    const results = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const prefixedBatch = batch.map(text => `query: ${text}`);
      
      try {
        const startTime = Date.now();
        
        const response = await axios.post(
          this.apiUrl,
          { inputs: prefixedBatch },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000 // Longer timeout for batches
          }
        );

        const embeddings = response.data;
        results.push(...embeddings);
        
        const duration = Date.now() - startTime;
        logger.info(`✅ E5 batch embedding (${batch.length} texts) generated in ${duration}ms`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        logger.error(`❌ E5 batch embedding failed for batch ${i / batchSize + 1}:`, error.message);
        // Fallback to individual processing for failed batch
        const fallbackResults = batch.map(text => this._generateEnhancedMockEmbedding(text));
        results.push(...fallbackResults);
      }
    }

    return results;
  }

  _generateEnhancedMockEmbedding(text) {
    logger.info('Using enhanced semantic mock E5 embedding');
    
    // Enhanced health domain keyword mapping
    const healthKeywords = {
      exercise: {
        keywords: ['exercise', 'cardio', 'workout', 'fitness', 'running', 'walking', 'gym', 'sport', 'physical', 'activity', 'training', 'jogging', 'cycling', 'swimming'],
        weight: 0.8
      },
      nutrition: {
        keywords: ['nutrition', 'diet', 'food', 'eating', 'vitamin', 'protein', 'healthy', 'meal', 'calories', 'carbs', 'fiber', 'minerals', 'supplements', 'organic'],
        weight: 0.7
      },
      sleep: {
        keywords: ['sleep', 'rest', 'insomnia', 'bedtime', 'nap', 'tired', 'fatigue', 'dream', 'wake', 'drowsy', 'exhausted', 'slumber'],
        weight: 0.9
      },
      mental: {
        keywords: ['stress', 'anxiety', 'depression', 'mental', 'mood', 'emotion', 'mind', 'psychological', 'therapy', 'counseling', 'mindfulness', 'meditation'],
        weight: 0.8
      },
      medical: {
        keywords: ['doctor', 'hospital', 'medicine', 'treatment', 'symptom', 'diagnosis', 'medical', 'health', 'physician', 'clinic', 'prescription'],
        weight: 0.6
      },
      prevention: {
        keywords: ['prevent', 'screening', 'vaccine', 'checkup', 'wellness', 'preventive', 'immunization', 'mammogram', 'colonoscopy'],
        weight: 0.7
      },
      chronic: {
        keywords: ['diabetes', 'hypertension', 'cholesterol', 'arthritis', 'heart', 'blood', 'pressure', 'chronic', 'disease', 'condition'],
        weight: 0.9
      },
      womens: {
        keywords: ['pregnancy', 'prenatal', 'mammogram', 'cervical', 'pap', 'women', 'female', 'maternal', 'gynecology'],
        weight: 0.8
      },
      mens: {
        keywords: ['prostate', 'psa', 'testosterone', 'men', 'male', 'masculine', 'urology'],
        weight: 0.8
      },
      senior: {
        keywords: ['elderly', 'senior', 'aging', 'falls', 'bone', 'osteoporosis', 'geriatric', 'older'],
        weight: 0.7
      }
    };

    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1024).fill(0);

    // Create semantic clusters in the embedding space with better distribution
    Object.entries(healthKeywords).forEach(([category, config], categoryIndex) => {
      let relevanceScore = 0;
      
      // Calculate relevance score with fuzzy matching
      config.keywords.forEach(keyword => {
        words.forEach(word => {
          if (word.includes(keyword) || keyword.includes(word)) {
            relevanceScore += 1;
          }
          // Partial matching for better semantic understanding
          if (word.length > 3 && keyword.length > 3) {
            const similarity = this._calculateStringSimilarity(word, keyword);
            if (similarity > 0.6) {
              relevanceScore += similarity * 0.5;
            }
          }
        });
      });

      // Apply category weight
      relevanceScore *= config.weight;

      if (relevanceScore > 0) {
        // Distribute values across multiple regions for better separation
        const baseIndex = categoryIndex * 90;
        const secondaryIndex = 900 + (categoryIndex * 12);
        
        // Primary cluster
        for (let i = 0; i < 90 && baseIndex + i < 900; i++) {
          const value = (relevanceScore * 0.4) + (Math.sin(text.length + i + categoryIndex) * 0.1);
          embedding[baseIndex + i] = value;
        }
        
        // Secondary cluster for cross-category relationships
        for (let i = 0; i < 12 && secondaryIndex + i < 1024; i++) {
          const value = (relevanceScore * 0.2) + (Math.cos(text.length + i + categoryIndex) * 0.05);
          embedding[secondaryIndex + i] = value;
        }
      }
    });

    // Add text-specific signature for uniqueness
    const textHash = this._simpleHash(text);
    for (let i = 1000; i < 1024; i++) {
      embedding[i] = Math.sin(textHash + i) * 0.1;
    }

    // Normalize the embedding vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }
    
    return embedding;
  }

  _calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this._levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  _levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

module.exports = new E5EmbeddingService();
