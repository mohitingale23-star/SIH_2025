class PromptBuilder {
  static buildRAGPrompt(userQuery, retrievedChunks) {
    const context = retrievedChunks
      .map(chunk => chunk.metadata.text)
      .join('\n\n');

    const systemPrompt = `You are a helpful health assistant chatbot. Your role is to provide accurate, helpful, and empathetic health information based on the provided context.

IMPORTANT GUIDELINES:
1. Always base your responses on the provided context when possible
2. Be empathetic and supportive in your tone
3. Include relevant disclaimers about consulting healthcare professionals
4. Keep responses clear, concise, and actionable
5. If the context doesn't contain relevant information, provide general health guidance
6. Never provide specific medical diagnoses or treatment recommendations
7. Encourage users to seek professional medical advice for serious concerns

CONTEXT INFORMATION:
${context}

USER QUERY: ${userQuery}

Please provide a helpful, accurate, and empathetic response based on the context above. If the user's query cannot be fully answered with the provided context, supplement with general health knowledge while making it clear what information comes from the context vs. general knowledge.`;

    return systemPrompt;
  }

  static buildFallbackPrompt(userQuery) {
    return `You are a helpful health assistant chatbot. A user has asked: "${userQuery}"

Please provide a helpful, accurate, and empathetic health response. Remember to:
1. Be supportive and understanding
2. Provide general health guidance when appropriate
3. Include disclaimers about consulting healthcare professionals
4. Never provide specific medical diagnoses
5. Keep the response clear and actionable
6. Encourage professional medical consultation for serious concerns

Respond in a caring and informative manner.`;
  }

  static buildSystemMessage() {
    return {
      role: 'system',
      content: `You are a compassionate and knowledgeable health assistant. Your mission is to:

1. Provide accurate, evidence-based health information
2. Be empathetic and supportive to users seeking health guidance
3. Always recommend consulting healthcare professionals for medical concerns
4. Offer practical, actionable advice when appropriate
5. Maintain a caring and professional tone
6. Never provide specific medical diagnoses or prescription recommendations
7. Encourage healthy lifestyle choices and preventive care

Remember: You are a supportive health companion, not a replacement for professional medical care.`
    };
  }

  static formatChunksForContext(chunks) {
    if (!chunks || chunks.length === 0) {
      return 'No specific context available.';
    }

    return chunks.map((chunk, index) => {
      const source = chunk.metadata.source || 'Health Guidelines';
      const category = chunk.metadata.category || 'General';
      
      return `[Source ${index + 1} - ${source} (${category})]
${chunk.metadata.text}`;
    }).join('\n\n');
  }

  static extractKeywords(query) {
    // Simple keyword extraction for health topics
    const healthKeywords = [
      'exercise', 'workout', 'fitness', 'physical activity',
      'diet', 'nutrition', 'food', 'eating', 'calories',
      'sleep', 'rest', 'insomnia', 'tired',
      'stress', 'anxiety', 'depression', 'mental health',
      'pain', 'headache', 'fever', 'cold', 'flu',
      'diabetes', 'blood pressure', 'cholesterol',
      'heart', 'cardiovascular', 'breathing',
      'weight', 'obesity', 'BMI',
      'vitamins', 'supplements', 'medication',
      'doctor', 'hospital', 'treatment', 'symptoms'
    ];

    const queryLower = query.toLowerCase();
    const foundKeywords = healthKeywords.filter(keyword => 
      queryLower.includes(keyword)
    );

    return foundKeywords;
  }

  static addHealthDisclaimer(response) {
    const disclaimers = [
      "\n\n⚠️ Please remember: This information is for educational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider for personalized medical guidance.",
      
      "\n\n💡 Disclaimer: While I strive to provide accurate health information, always consult with a healthcare professional for medical concerns or before making significant changes to your health routine.",
      
      "\n\n🩺 Important: This guidance is general in nature. For specific health issues or symptoms, please seek advice from a qualified medical professional who can assess your individual situation."
    ];

    // Randomly select a disclaimer to add variety
    const randomDisclaimer = disclaimers[Math.floor(Math.random() * disclaimers.length)];
    return response + randomDisclaimer;
  }
}

module.exports = PromptBuilder;
