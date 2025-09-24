# Health Chatbot Backend

A comprehensive health chatbot backend system built with Node.js, Express, Pinecone vector database, Google Gemini AI, and Microsoft Azure Translator API. This system provides multilingual health assistance with RAG (Retrieval Augmented Generation) capabilities.

## 🏗️ Architecture

The chatbot follows this flow:
1. **Language Detection** - Detects user's language using Microsoft Azure Translator API
2. **Translation** - Translates non-English queries to English
3. **Embedding Generation** - Creates vector embeddings using Google Gemini
4. **Vector Search** - Queries Pinecone for relevant health information
5. **Response Generation** - Uses Gemini AI with RAG context to generate responses
6. **Translation Back** - Translates responses back to user's original language

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Pinecone account (optional - has mock mode)
- Google Cloud account with Gemini API access (optional - has mock mode)
- Microsoft Azure account with Translator API access (optional - has mock mode)

### Installation

1. **Clone and install dependencies:**
```bash
cd health-chatbot-backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys (optional - works with mocks)
```

3. **Seed the vector database (optional):**
```bash
npm run seed
```

4. **Start the server:**
```bash
npm start
# or for development
npm run dev
```

5. **Test the API:**
```bash
npm test
```

6. **Use the terminal client:**
```bash
npm run client
```

## 📁 Project Structure

```
health-chatbot-backend/
├── src/
│   ├── server.js                 # Server bootstrap
│   ├── app.js                    # Express app setup
│   ├── routes/chat.js           # Chat API endpoints
│   ├── controllers/chatController.js # Main chat logic
│   ├── services/
│   │   ├── pineconeService.js   # Vector database operations
│   │   ├── geminiService.js     # AI embeddings & generation
│   │   └── translateService.js  # Language detection & translation
│   ├── utils/promptBuilder.js   # RAG prompt templates
│   ├── middleware/errorHandler.js # Error handling
│   └── tests/chat.test.js       # API tests
├── scripts/seed_pinecone.js     # Database seeding
├── client/terminalClient.js     # Interactive terminal client
├── package.json
└── .env.example
```

## 🔧 API Endpoints

### POST /chat
Main chat endpoint for health questions.

**Request:**
```json
{
  "message": "How can I improve my sleep quality?",
  "sessionId": "optional-session-id",
  "userLanguage": "en"
}
```

**Response:**
```json
{
  "response": "To improve sleep quality, establish a consistent sleep schedule...",
  "sessionId": "session_1234567890_abc123",
  "language": "en",
  "sources": [
    {
      "id": "sleep-1",
      "score": 0.95,
      "category": "sleep",
      "source": "Sleep Foundation"
    }
  ],
  "metadata": {
    "originalLanguage": "en",
    "wasTranslated": false,
    "processingTime": 1250,
    "chunksUsed": 3
  }
}
```

### GET /chat/health/:topic
Get comprehensive information about a health topic.

### GET /chat/test
API health check and test endpoint.

### GET /health
Server health status.

## 🧪 Testing

The project includes comprehensive tests:

```bash
# Run API tests
npm test

# Use interactive terminal client
npm run client

# Seed sample data
npm run seed
```

## 🌐 Multi-language Support

The system automatically:
- Detects user's language
- Translates queries to English for processing
- Translates responses back to the original language
- Supports 10+ languages with mock fallbacks

## 🔄 Mock Mode

All external services have mock implementations:
- **Pinecone Mock**: Returns sample health data
- **Gemini Mock**: Generates contextual health responses
- **Azure Translator Mock**: Simple language detection and mock translation

This allows testing without API keys!

## 🏥 Health Data Categories

The system includes information about:
- **Exercise & Fitness**: Cardio, strength training, activity recommendations
- **Nutrition**: Balanced diet, hydration, healthy eating
- **Sleep**: Sleep hygiene, quality improvement, sleep disorders
- **Mental Health**: Stress management, anxiety, emotional well-being
- **Preventive Care**: Health screenings, check-ups, early detection
- **Chronic Disease**: Diabetes, heart disease, management strategies

## 🔐 Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=8080

# Pinecone (Vector Database)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=health-chatbot-index

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Microsoft Azure Translator
AZURE_TRANSLATOR_KEY=your_azure_translator_key
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
AZURE_TRANSLATOR_REGION=your_azure_region

# Logging
LOG_LEVEL=info
```

## 🚀 Deployment

The application is containerized and ready for deployment:

1. **Docker Support**: Dockerfile included
2. **Health Checks**: Built-in health monitoring
3. **Error Handling**: Comprehensive error management
4. **Logging**: Structured logging with Pino
5. **Graceful Shutdown**: Proper cleanup on termination

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## ⚠️ Medical Disclaimer

This chatbot provides general health information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers for medical concerns.

## 🆘 Support

For issues, questions, or contributions:
- Check the tests with `npm test`
- Use the terminal client for interactive testing
- Review logs for debugging information
- Ensure all environment variables are properly set

---

Built with ❤️ for better health information accessibility.
