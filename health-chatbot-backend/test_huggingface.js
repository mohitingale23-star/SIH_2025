require('dotenv').config();
const axios = require('axios');

async function testHuggingFaceAPI() {
  console.log('🔍 DIAGNOSING HUGGING FACE API CONNECTION\n');
  
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  console.log('🔑 API Key Status:', apiKey ? `Found (starts with: ${apiKey.substring(0, 8)}...)` : 'Missing');
  
  if (!apiKey) {
    console.log('❌ No API key found in environment');
    return;
  }
  
  try {
    console.log('\n🔄 Testing direct API call...');
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/intfloat/multilingual-e5-large',
      { inputs: 'query: test health query' },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ API call successful!');
    console.log('📊 Response type:', typeof response.data);
    console.log('📏 Embedding dimensions:', Array.isArray(response.data) ? response.data.length : 'Not an array');
    
    if (Array.isArray(response.data) && response.data.length === 1024) {
      console.log('🎉 Perfect! E5 embeddings are working correctly');
    } else {
      console.log('⚠️  Unexpected response format');
    }
    
  } catch (error) {
    console.log('❌ API call failed');
    console.log('Status:', error.response?.status || 'No status');
    console.log('Status Text:', error.response?.statusText || 'No status text');
    console.log('Error Message:', error.message);
    
    if (error.response?.data) {
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Specific error diagnosis
    if (error.response?.status === 401) {
      console.log('\n🔑 DIAGNOSIS: Invalid or expired API key');
      console.log('💡 Solution: Check your Hugging Face token permissions');
    } else if (error.response?.status === 403) {
      console.log('\n🚫 DIAGNOSIS: Access forbidden - model may require special access');
      console.log('💡 Solution: Try a different model or check model access permissions');
    } else if (error.response?.status === 503) {
      console.log('\n⏳ DIAGNOSIS: Model is loading or temporarily unavailable');
      console.log('💡 Solution: Wait a few minutes and try again');
    } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.log('\n🌐 DIAGNOSIS: Network connectivity issue');
      console.log('💡 Solution: Check internet connection and try again');
    }
  }
}

testHuggingFaceAPI().catch(console.error);
