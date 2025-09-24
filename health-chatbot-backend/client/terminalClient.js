const readline = require('readline');
const axios = require('axios');
const pino = require('pino');

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

class TerminalClient {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:8080';
    this.sessionId = null;
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🩺 Health Assistant > '
    });
  }

  async start() {
    console.log('\n🏥 Welcome to the Health Chatbot Terminal Client!');
    console.log('💡 Type your health questions and get AI-powered assistance.');
    console.log('📝 Type "exit" to quit, "help" for commands, "test" to check connection.\n');

    // Test connection
    await this.testConnection();

    this.rl.prompt();

    this.rl.on('line', async (input) => {
      const command = input.trim().toLowerCase();

      if (command === 'exit' || command === 'quit') {
        console.log('\n👋 Thank you for using Health Chatbot! Stay healthy!');
        this.rl.close();
        return;
      }

      if (command === 'help') {
        this.showHelp();
        this.rl.prompt();
        return;
      }

      if (command === 'test') {
        await this.testConnection();
        this.rl.prompt();
        return;
      }

      if (command === 'clear') {
        console.clear();
        console.log('🏥 Health Chatbot - Terminal cleared\n');
        this.rl.prompt();
        return;
      }

      if (command === 'session') {
        console.log(`Current session ID: ${this.sessionId || 'None'}\n`);
        this.rl.prompt();
        return;
      }

      if (!input.trim()) {
        this.rl.prompt();
        return;
      }

      await this.sendMessage(input.trim());
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\n👋 Goodbye!');
      process.exit(0);
    });
  }

  async testConnection() {
    try {
      console.log('🔍 Testing connection to health chatbot API...');
      
      const response = await axios.get(`${this.baseUrl}/chat/test`, {
        timeout: 5000
      });

      console.log('✅ Connection successful!');
      console.log(`📡 API Status: ${response.data.message}`);
      console.log(`⏰ Server Time: ${response.data.timestamp}\n`);
      
    } catch (error) {
      console.log('❌ Connection failed!');
      console.log(`🔧 Error: ${error.message}`);
      console.log(`🌐 API URL: ${this.baseUrl}`);
      console.log('💡 Make sure the server is running with: npm start\n');
    }
  }

  async sendMessage(message) {
    try {
      console.log('🤔 Thinking...');
      
      const startTime = Date.now();
      
      const response = await axios.post(`${this.baseUrl}/chat`, {
        message,
        sessionId: this.sessionId
      }, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const duration = Date.now() - startTime;
      const data = response.data;

      // Store session ID for continuity
      if (data.sessionId) {
        this.sessionId = data.sessionId;
      }

      // Display the response
      console.log('\n🤖 Health Assistant:');
      console.log(this.formatResponse(data.response));
      
      // Show metadata if available
      if (data.sources && data.sources.length > 0) {
        console.log('\n📚 Sources used:');
        data.sources.forEach((source, index) => {
          console.log(`   ${index + 1}. ${source.source} (${source.category}) - Relevance: ${(source.score * 100).toFixed(1)}%`);
        });
      }

      // Show processing info
      if (data.metadata) {
        console.log(`\n⚡ Response time: ${duration}ms | Sources: ${data.metadata.chunksUsed} | Embedding dims: ${data.metadata.embeddingDimensions}`);
      }

      console.log('\n' + '─'.repeat(80) + '\n');

    } catch (error) {
      console.log('\n❌ Error occurred:');
      
      if (error.response) {
        console.log(`Status: ${error.response.status} ${error.response.statusText}`);
        console.log(`Error: ${error.response.data.error || 'Unknown error'}`);
        
        if (error.response.data.details) {
          console.log(`Details: ${error.response.data.details}`);
        }
      } else if (error.code === 'ECONNREFUSED') {
        console.log('Cannot connect to the server. Make sure it\'s running on', this.baseUrl);
      } else if (error.code === 'ETIMEDOUT') {
        console.log('Request timed out. The server might be overloaded.');
      } else {
        console.log(`Network error: ${error.message}`);
      }
      
      console.log('\n💡 Try again or type "test" to check connection.\n');
    }
  }

  formatResponse(text) {
    // Add some basic formatting to make the response more readable
    const lines = text.split('\n');
    return lines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => '   ' + line)
      .join('\n');
  }

  showHelp() {
    console.log('\n📖 Available Commands:');
    console.log('   help     - Show this help message');
    console.log('   test     - Test connection to the API');
    console.log('   clear    - Clear the terminal');
    console.log('   session  - Show current session ID');
    console.log('   exit     - Exit the application');
    console.log('\n💬 Just type your health question to chat with the AI assistant!');
    console.log('🧠 The assistant uses AI embeddings to find relevant health information.');
    console.log('\n📋 Example questions:');
    console.log('   "How can I improve my sleep quality?"');
    console.log('   "What are the benefits of regular exercise?"');
    console.log('   "How much water should I drink daily?"');
    console.log('   "What foods are good for heart health?"\n');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Start the client
if (require.main === module) {
  const client = new TerminalClient();
  client.start().catch(error => {
    logger.error('Terminal client failed to start:', error);
    process.exit(1);
  });
}

module.exports = TerminalClient;
