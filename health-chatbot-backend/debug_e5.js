require('dotenv').config();
const axios = require('axios');

async function debugE5() {
  console.log('🐛 DEBUG: Testing E5 embedding step by step');
  
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  console.log('🔑 API Key available:', !!apiKey);
  
  if (!apiKey) {
    console.log('❌ No API key - would use mock');
    return;
  }
  
  const text = 'I have a headache';
  console.log('📝 Input text:', text);
  
  try {
    console.log('🚀 Making API call...');
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/intfloat/multilingual-e5-large',
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('✅ API call successful');
    console.log('📊 Response type:', typeof response.data);
    console.log('🔢 Is array:', Array.isArray(response.data));
    console.log('📏 Length:', response.data?.length);
    
    if (Array.isArray(response.data) && response.data.length === 1024) {
      console.log('🎉 Perfect! Got 1024-dimension embedding');
      
      // Test some stats
      const magnitude = Math.sqrt(response.data.reduce((sum, val) => sum + val * val, 0));
      const avgValue = response.data.reduce((sum, val) => sum + val, 0) / response.data.length;
      
      console.log('📊 Magnitude:', magnitude.toFixed(4));
      console.log('📈 Average value:', avgValue.toFixed(6));
      console.log('🔬 Sample values:', response.data.slice(0, 5).map(v => v.toFixed(4)));
      
    } else {
      console.log('❌ Unexpected response format');
    }
    
  } catch (error) {
    console.log('❌ API Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data));
    }
  }
}

debugE5().catch(console.error);
