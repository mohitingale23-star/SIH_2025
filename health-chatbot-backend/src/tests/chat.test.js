const axios = require('axios');
const assert = require('assert');
const pino = require('pino');

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

class ChatTester {
  constructor() {
    this.baseUrl = BASE_URL;
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Chat API Tests...\n');

    const tests = [
      { name: 'Health Check', fn: this.testHealthCheck },
      { name: 'Chat Test Endpoint', fn: this.testChatTestEndpoint },
      { name: 'Basic Chat Message', fn: this.testBasicChat },
      { name: 'Empty Message Validation', fn: this.testEmptyMessage },
      { name: 'Long Message Validation', fn: this.testLongMessage },
      { name: 'Health Info Endpoint', fn: this.testHealthInfo },
      { name: 'Chat History Endpoint', fn: this.testChatHistory },
      { name: 'Error Handling', fn: this.testErrorHandling },
      { name: 'Response Format', fn: this.testResponseFormat }
    ];

    for (const test of tests) {
      try {
        console.log(`📋 Running: ${test.name}...`);
        await test.fn.call(this);
        this.testResults.push({ name: test.name, status: 'PASSED' });
        console.log(`✅ ${test.name} - PASSED\n`);
      } catch (error) {
        this.testResults.push({ name: test.name, status: 'FAILED', error: error.message });
        console.log(`❌ ${test.name} - FAILED: ${error.message}\n`);
      }
    }

    this.printTestSummary();
  }

  async testHealthCheck() {
    const response = await axios.get(`${this.baseUrl}/health`);
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.status, 'healthy');
    assert(response.data.timestamp);
    assert(typeof response.data.uptime === 'number');
  }

  async testChatTestEndpoint() {
    const response = await axios.get(`${this.baseUrl}/chat/test`);
    
    assert.strictEqual(response.status, 200);
    assert(response.data.message.includes('working'));
    assert(response.data.endpoints);
    assert(response.data.endpoints.chat);
  }

  async testBasicChat() {
    const testMessage = "What are the benefits of regular exercise?";
    
    const response = await axios.post(`${this.baseUrl}/chat`, {
      message: testMessage
    });

    assert.strictEqual(response.status, 200);
    assert(response.data.response);
    assert(typeof response.data.response === 'string');
    assert(response.data.response.length > 50); // Should be a substantial response
    assert(response.data.sessionId);
    assert(response.data.language);
    assert(Array.isArray(response.data.sources));
  }

  async testEmptyMessage() {
    try {
      await axios.post(`${this.baseUrl}/chat`, {
        message: ""
      });
      throw new Error('Should have thrown validation error');
    } catch (error) {
      if (error.response) {
        assert.strictEqual(error.response.status, 400);
        assert(error.response.data.error.includes('required'));
      } else {
        throw error;
      }
    }
  }

  async testLongMessage() {
    const longMessage = 'a'.repeat(1001); // Exceeds 1000 character limit
    
    try {
      await axios.post(`${this.baseUrl}/chat`, {
        message: longMessage
      });
      throw new Error('Should have thrown validation error');
    } catch (error) {
      if (error.response) {
        assert.strictEqual(error.response.status, 400);
        assert(error.response.data.error.includes('1000 characters'));
      } else {
        throw error;
      }
    }
  }

  async testHealthInfo() {
    const response = await axios.get(`${this.baseUrl}/chat/health/exercise`);
    
    assert.strictEqual(response.status, 200);
    assert(response.data.topic);
    assert(response.data.information);
    assert(response.data.sources);
    assert(response.data.generatedAt);
  }

  async testChatHistory() {
    const response = await axios.get(`${this.baseUrl}/chat/history/test-session-123`);
    
    assert.strictEqual(response.status, 200);
    assert(response.data.sessionId);
    assert(Array.isArray(response.data.messages));
    // Note: This will return empty for now as it's not implemented
  }

  async testErrorHandling() {
    // Test 404 endpoint
    try {
      await axios.get(`${this.baseUrl}/nonexistent-endpoint`);
      throw new Error('Should have returned 404');
    } catch (error) {
      if (error.response) {
        assert.strictEqual(error.response.status, 404);
        assert(error.response.data.error);
      } else {
        throw error;
      }
    }
  }

  async testResponseFormat() {
    const response = await axios.post(`${this.baseUrl}/chat`, {
      message: "Tell me about healthy eating",
      sessionId: "test-session-456"
    });

    // Validate response structure
    assert.strictEqual(response.status, 200);
    
    const data = response.data;
    
    // Required fields
    assert(data.response, 'Response should have response field');
    assert(data.sessionId, 'Response should have sessionId field');
    assert(data.language, 'Response should have language field');
    assert(Array.isArray(data.sources), 'Sources should be an array');
    assert(data.metadata, 'Response should have metadata field');
    
    // Metadata structure
    assert(typeof data.metadata.originalLanguage === 'string');
    assert(typeof data.metadata.wasTranslated === 'boolean');
    assert(typeof data.metadata.processingTime === 'number');
    assert(typeof data.metadata.chunksUsed === 'number');
    
    // Sources structure (if any)
    if (data.sources.length > 0) {
      const source = data.sources[0];
      assert(source.id, 'Source should have id');
      assert(typeof source.score === 'number', 'Source should have numeric score');
      assert(source.category, 'Source should have category');
      assert(source.source, 'Source should have source');
    }
  }

  printTestSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));

    const passed = this.testResults.filter(t => t.status === 'PASSED').length;
    const failed = this.testResults.filter(t => t.status === 'FAILED').length;
    const total = this.testResults.length;

    console.log(`\n📈 Results: ${passed}/${total} tests passed`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(t => t.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }

    console.log('\n✅ Passed Tests:');
    this.testResults
      .filter(t => t.status === 'PASSED')
      .forEach(test => {
        console.log(`   • ${test.name}`);
      });

    console.log('\n' + '='.repeat(50));
    
    if (failed === 0) {
      console.log('🎉 All tests passed! The API is working correctly.');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please check the implementation.`);
    }
  }
}

// Performance test
async function performanceTest() {
  console.log('\n🚀 Running Performance Test...');
  
  const requests = 5;
  const message = "What are some tips for better sleep?";
  const times = [];

  for (let i = 0; i < requests; i++) {
    const start = Date.now();
    
    try {
      await axios.post(`${BASE_URL}/chat`, { message });
      const duration = Date.now() - start;
      times.push(duration);
      console.log(`Request ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`Request ${i + 1}: Failed - ${error.message}`);
    }
  }

  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`\n📊 Performance Results:`);
    console.log(`   Average: ${avg.toFixed(0)}ms`);
    console.log(`   Min: ${min}ms`);
    console.log(`   Max: ${max}ms`);
  }
}

// Allow running this script directly
if (require.main === module) {
  async function runTests() {
    try {
      const tester = new ChatTester();
      await tester.runAllTests();
      
      // Run performance test if all functional tests pass
      const failedTests = tester.testResults.filter(t => t.status === 'FAILED').length;
      if (failedTests === 0) {
        await performanceTest();
      }
      
    } catch (error) {
      logger.error('Test runner failed:', error);
      process.exit(1);
    }
  }

  runTests();
}

module.exports = ChatTester;
