const axios = require('axios');
const pino = require('pino');

const logger = pino();

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.useMock = !this.apiKey;
    
    if (this.useMock) {
      logger.warn('GEMINI_API_KEY not found, using mock mode');
    }
  }

  async embed(text) {
    if (this.useMock) {
      return this._mockEmbed(text);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/models/embedding-001:embedContent?key=${this.apiKey}`,
        {
          model: 'models/embedding-001',
          content: {
            parts: [{ text }]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.embedding.values;
    } catch (error) {
      logger.error('Gemini embedding failed:', error.message);
      return this._mockEmbed(text);
    }
  }

  async generate(prompt, options = {}) {
    if (this.useMock) {
      return this._mockGenerate(prompt);
    }

    try {
      const requestBody = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxTokens || 1024
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const candidate = response.data.candidates[0];
      if (candidate && candidate.content && candidate.content.parts[0]) {
        return candidate.content.parts[0].text;
      }

      throw new Error('Invalid response format from Gemini');
    } catch (error) {
      logger.error('Gemini generation failed:', error.message);
      return this._mockGenerate(prompt);
    }
  }

  _mockEmbed(text) {
    logger.info('Using mock Gemini embedding');
    
    // Generate a deterministic mock embedding based on text hash
    const hash = this._simpleHash(text);
    const embedding = [];
    
    // Generate 1024-dimensional embedding to match Pinecone index
    for (let i = 0; i < 1024; i++) {
      embedding.push(Math.sin(hash + i) * 0.1 + Math.cos(hash * i) * 0.1);
    }
    
    return embedding;
  }

  _mockGenerate(prompt) {
    logger.info('Using mock Gemini generation');
    
    // Simple mock responses based on keywords in the prompt
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('exercise') || promptLower.includes('workout')) {
      return "Regular physical activity is essential for maintaining good health. I recommend starting with 30 minutes of moderate exercise daily, such as brisk walking, swimming, or cycling. Always consult with a healthcare provider before starting any new exercise regimen, especially if you have existing health conditions.";
    }
    
    if (promptLower.includes('diet') || promptLower.includes('nutrition') || promptLower.includes('food')) {
      return "A balanced diet is crucial for optimal health. Focus on consuming a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. Stay hydrated by drinking plenty of water throughout the day. Limit processed foods, excessive sugar, and unhealthy fats. Consider consulting a registered dietitian for personalized nutrition advice.";
    }
    
    if (promptLower.includes('sleep') || promptLower.includes('rest')) {
      return "Quality sleep is fundamental to good health. Adults should aim for 7-9 hours of sleep per night. Establish a consistent sleep schedule, create a comfortable sleep environment, limit screen time before bed, and avoid caffeine late in the day. If you experience persistent sleep problems, consult a healthcare provider.";
    }
    
    if (promptLower.includes('stress') || promptLower.includes('anxiety')) {
      return "Managing stress is important for both mental and physical health. Try relaxation techniques such as deep breathing, meditation, or yoga. Regular exercise, adequate sleep, and social support can also help reduce stress. If stress becomes overwhelming, consider speaking with a mental health professional.";
    }
    
    // Generic health response
    return "Thank you for your health question. While I can provide general health information, it's important to remember that I cannot replace professional medical advice. For specific health concerns or symptoms, please consult with a qualified healthcare provider who can properly assess your individual situation and provide appropriate guidance.";
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

module.exports = new GeminiService();
