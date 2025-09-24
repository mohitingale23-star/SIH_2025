// API Keys Configuration
// Store all API keys in one centralized location

module.exports = {
  // E5 Embedding Service (Hugging Face)
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
  
  // Pinecone Vector Database
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'health-chatbot',
  
  // Gemini AI (Google) - for text generation
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  
  // Azure Translator (kept for reference but not used)
  // AZURE_TRANSLATOR_KEY: process.env.AZURE_TRANSLATOR_KEY,
  // AZURE_TRANSLATOR_REGION: process.env.AZURE_TRANSLATOR_REGION,
  
  // Server Configuration
  PORT: process.env.PORT || 8080,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
