require('dotenv').config();
const pineconeService = require('../src/services/pineconeService');
const geminiService = require('../src/services/geminiService');
const e5EmbeddingService = require('../src/services/e5EmbeddingService');
const pino = require('pino');

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Comprehensive sample health data to seed into remote Pinecone database
const healthData = [
  // Exercise & Fitness
  {
    id: 'exercise-1',
    text: 'Regular cardiovascular exercise such as walking, running, swimming, or cycling for at least 150 minutes per week can significantly reduce the risk of heart disease, stroke, and diabetes. Start slowly and gradually increase intensity and duration.',
    metadata: {
      category: 'exercise',
      source: 'WHO Guidelines',
      keywords: ['cardio', 'heart', 'walking', 'running', 'swimming']
    }
  },
  {
    id: 'exercise-2',
    text: 'Strength training exercises should be performed at least twice a week, targeting all major muscle groups. This helps maintain bone density, muscle mass, and metabolic health as we age.',
    metadata: {
      category: 'exercise',
      source: 'CDC Recommendations',
      keywords: ['strength', 'resistance', 'muscle', 'bone', 'metabolism']
    }
  },
  {
    id: 'exercise-3',
    text: 'High-intensity interval training (HIIT) can provide significant health benefits in shorter time periods. Alternating between intense bursts and recovery periods improves cardiovascular fitness and burns calories efficiently.',
    metadata: {
      category: 'exercise',
      source: 'Sports Medicine Research',
      keywords: ['HIIT', 'interval', 'intensity', 'cardiovascular', 'calories']
    }
  },
  {
    id: 'exercise-4',
    text: 'Flexibility and balance exercises, including yoga and tai chi, help prevent falls, improve posture, and reduce muscle tension. These activities are especially important for older adults.',
    metadata: {
      category: 'exercise',
      source: 'Physical Therapy Guidelines',
      keywords: ['flexibility', 'balance', 'yoga', 'tai chi', 'posture']
    }
  },

  // Nutrition & Diet
  {
    id: 'nutrition-1',
    text: 'A balanced diet should include 5-9 servings of fruits and vegetables daily, whole grains, lean proteins, and healthy fats. Limit processed foods, added sugars, and excessive sodium intake.',
    metadata: {
      category: 'nutrition',
      source: 'Dietary Guidelines',
      keywords: ['fruits', 'vegetables', 'whole grains', 'protein', 'healthy fats']
    }
  },
  {
    id: 'nutrition-2',
    text: 'Staying hydrated is crucial for optimal body function. Aim for 8 glasses of water daily, more if you are physically active or in hot climates. Water helps regulate body temperature and transport nutrients.',
    metadata: {
      category: 'nutrition',
      source: 'Hydration Research',
      keywords: ['water', 'hydration', 'temperature', 'nutrients']
    }
  },
  {
    id: 'nutrition-3',
    text: 'Omega-3 fatty acids found in fish, walnuts, and flaxseeds support heart health, brain function, and reduce inflammation. Include these foods in your diet at least twice weekly.',
    metadata: {
      category: 'nutrition',
      source: 'Nutritional Science',
      keywords: ['omega-3', 'fish', 'heart health', 'brain', 'inflammation']
    }
  },
  {
    id: 'nutrition-4',
    text: 'High-fiber foods like beans, lentils, oats, and berries help maintain healthy digestion, control blood sugar levels, and may reduce cholesterol. Aim for 25-35 grams of fiber daily.',
    metadata: {
      category: 'nutrition',
      source: 'Digestive Health Institute',
      keywords: ['fiber', 'beans', 'digestion', 'blood sugar', 'cholesterol']
    }
  },
  {
    id: 'nutrition-5',
    text: 'Portion control is key to maintaining a healthy weight. Use smaller plates, eat slowly, and listen to hunger cues. A balanced plate should be half vegetables, quarter protein, and quarter whole grains.',
    metadata: {
      category: 'nutrition',
      source: 'Weight Management Guidelines',
      keywords: ['portion control', 'weight', 'balanced plate', 'vegetables', 'protein']
    }
  },

  // Sleep & Rest
  {
    id: 'sleep-1',
    text: 'Adults need 7-9 hours of quality sleep per night. Establish a consistent sleep schedule, create a comfortable sleep environment, and avoid screens before bedtime to improve sleep quality.',
    metadata: {
      category: 'sleep',
      source: 'Sleep Foundation',
      keywords: ['sleep', 'rest', 'schedule', 'environment', 'screens']
    }
  },
  {
    id: 'sleep-2',
    text: 'Poor sleep quality is linked to obesity, diabetes, cardiovascular disease, and mental health issues. If you experience persistent sleep problems, consult a healthcare provider.',
    metadata: {
      category: 'sleep',
      source: 'Sleep Research',
      keywords: ['insomnia', 'health problems', 'mental health', 'medical consultation']
    }
  },
  {
    id: 'sleep-3',
    text: 'Creating a bedtime routine helps signal your body to prepare for sleep. This might include reading, gentle stretching, or meditation. Avoid caffeine and large meals close to bedtime.',
    metadata: {
      category: 'sleep',
      source: 'Sleep Hygiene Guidelines',
      keywords: ['bedtime routine', 'reading', 'meditation', 'caffeine', 'meals']
    }
  },
  {
    id: 'sleep-4',
    text: 'Power naps of 10-20 minutes can boost alertness and performance without affecting nighttime sleep. Longer naps may cause grogginess and interfere with regular sleep patterns.',
    metadata: {
      category: 'sleep',
      source: 'Chronobiology Research',
      keywords: ['power naps', 'alertness', 'performance', 'grogginess', 'sleep patterns']
    }
  },

  // Mental Health & Wellness
  {
    id: 'mental-health-1',
    text: 'Managing stress through relaxation techniques, meditation, deep breathing, or yoga can improve both mental and physical health. Regular practice helps reduce anxiety and improve emotional well-being.',
    metadata: {
      category: 'mental-health',
      source: 'Mental Health Guidelines',
      keywords: ['stress', 'meditation', 'anxiety', 'relaxation', 'yoga']
    }
  },
  {
    id: 'mental-health-2',
    text: 'Social connections and support systems are vital for mental health. Maintain relationships with family and friends, join community groups, or consider professional counseling when needed.',
    metadata: {
      category: 'mental-health',
      source: 'Psychology Research',
      keywords: ['social', 'relationships', 'support', 'counseling', 'community']
    }
  },
  {
    id: 'mental-health-3',
    text: 'Mindfulness and meditation practices can reduce symptoms of depression and anxiety. Even 10 minutes daily of focused breathing or mindful awareness can make a significant difference.',
    metadata: {
      category: 'mental-health',
      source: 'Mindfulness Studies',
      keywords: ['mindfulness', 'meditation', 'depression', 'anxiety', 'breathing']
    }
  },
  {
    id: 'mental-health-4',
    text: 'Spending time in nature has proven mental health benefits, including reduced stress, improved mood, and enhanced cognitive function. Aim for at least 2 hours weekly in natural settings.',
    metadata: {
      category: 'mental-health',
      source: 'Environmental Psychology',
      keywords: ['nature', 'stress reduction', 'mood', 'cognitive', 'outdoor']
    }
  },

  // Preventive Care
  {
    id: 'preventive-care-1',
    text: 'Regular health screenings and check-ups can detect health issues early when they are most treatable. Follow recommended screening schedules for your age and risk factors.',
    metadata: {
      category: 'preventive-care',
      source: 'Medical Guidelines',
      keywords: ['screening', 'check-up', 'prevention', 'early detection', 'medical']
    }
  },
  {
    id: 'preventive-care-2',
    text: 'Vaccinations protect against serious and potentially deadly diseases. Stay up-to-date with recommended vaccines for your age group, including annual flu shots and COVID-19 boosters.',
    metadata: {
      category: 'preventive-care',
      source: 'CDC Vaccination Guidelines',
      keywords: ['vaccines', 'immunization', 'flu shot', 'COVID-19', 'prevention']
    }
  },
  {
    id: 'preventive-care-3',
    text: 'Dental health is connected to overall health. Brush twice daily, floss regularly, and visit your dentist every six months. Poor oral health is linked to heart disease and diabetes.',
    metadata: {
      category: 'preventive-care',
      source: 'Dental Association',
      keywords: ['dental', 'oral health', 'brushing', 'flossing', 'heart disease']
    }
  },
  {
    id: 'preventive-care-4',
    text: 'Skin cancer prevention includes using sunscreen with at least SPF 30, wearing protective clothing, and avoiding peak sun hours. Perform regular self-examinations and see a dermatologist annually.',
    metadata: {
      category: 'preventive-care',
      source: 'Dermatology Guidelines',
      keywords: ['skin cancer', 'sunscreen', 'SPF', 'sun protection', 'dermatologist']
    }
  },

  // Chronic Disease Management
  {
    id: 'chronic-disease-1',
    text: 'Type 2 diabetes can often be prevented or managed through lifestyle changes including healthy eating, regular exercise, weight management, and blood sugar monitoring.',
    metadata: {
      category: 'chronic-disease',
      source: 'Diabetes Association',
      keywords: ['diabetes', 'blood sugar', 'lifestyle', 'weight management', 'prevention']
    }
  },
  {
    id: 'chronic-disease-2',
    text: 'Hypertension (high blood pressure) can be managed through dietary changes, regular exercise, stress reduction, and medication when prescribed. Monitor blood pressure regularly at home.',
    metadata: {
      category: 'chronic-disease',
      source: 'Cardiology Guidelines',
      keywords: ['hypertension', 'blood pressure', 'diet', 'exercise', 'medication']
    }
  },
  {
    id: 'chronic-disease-3',
    text: 'High cholesterol levels can be improved through a heart-healthy diet low in saturated fats, regular physical activity, and maintaining a healthy weight. Some people may need medication.',
    metadata: {
      category: 'chronic-disease',
      source: 'Heart Association',
      keywords: ['cholesterol', 'heart-healthy', 'saturated fats', 'physical activity', 'weight']
    }
  },
  {
    id: 'chronic-disease-4',
    text: 'Arthritis pain can be managed through gentle exercise, maintaining a healthy weight, physical therapy, and anti-inflammatory medications. Heat and cold therapy can also provide relief.',
    metadata: {
      category: 'chronic-disease',
      source: 'Arthritis Foundation',
      keywords: ['arthritis', 'joint pain', 'exercise', 'physical therapy', 'inflammation']
    }
  },

  // Women's Health
  {
    id: 'womens-health-1',
    text: 'Women should follow recommended screening schedules for breast cancer (mammograms), cervical cancer (Pap smears), and bone density tests. Early detection saves lives.',
    metadata: {
      category: 'womens-health',
      source: 'Women\'s Health Guidelines',
      keywords: ['breast cancer', 'mammogram', 'cervical cancer', 'Pap smear', 'screening']
    }
  },
  {
    id: 'womens-health-2',
    text: 'During pregnancy, proper prenatal care, folic acid supplementation, avoiding alcohol and smoking, and maintaining a healthy diet are crucial for mother and baby health.',
    metadata: {
      category: 'womens-health',
      source: 'Obstetrics Guidelines',
      keywords: ['pregnancy', 'prenatal care', 'folic acid', 'alcohol', 'smoking']
    }
  },

  // Men's Health
  {
    id: 'mens-health-1',
    text: 'Men should discuss prostate cancer screening with their healthcare provider, especially after age 50 or earlier if there\'s a family history. PSA tests and digital rectal exams are common screening methods.',
    metadata: {
      category: 'mens-health',
      source: 'Urology Association',
      keywords: ['prostate cancer', 'PSA test', 'screening', 'family history', 'urology']
    }
  },
  {
    id: 'mens-health-2',
    text: 'Heart disease is a leading cause of death in men. Risk factors include high blood pressure, high cholesterol, smoking, diabetes, and family history. Regular check-ups and lifestyle changes are key.',
    metadata: {
      category: 'mens-health',
      source: 'Men\'s Health Institute',
      keywords: ['heart disease', 'blood pressure', 'cholesterol', 'smoking', 'diabetes']
    }
  },

  // Child & Adolescent Health
  {
    id: 'child-health-1',
    text: 'Children need regular well-child visits to monitor growth and development, receive vaccinations, and screen for health issues. These visits are important even when the child appears healthy.',
    metadata: {
      category: 'child-health',
      source: 'Pediatric Guidelines',
      keywords: ['children', 'well-child visits', 'growth', 'development', 'vaccinations']
    }
  },
  {
    id: 'child-health-2',
    text: 'Limiting screen time for children and encouraging physical activity, outdoor play, and social interaction supports healthy development. Follow age-appropriate screen time guidelines.',
    metadata: {
      category: 'child-health',
      source: 'Child Development Research',
      keywords: ['screen time', 'physical activity', 'outdoor play', 'social interaction', 'development']
    }
  },

  // Senior Health
  {
    id: 'senior-health-1',
    text: 'Fall prevention in older adults includes regular exercise for strength and balance, home safety modifications, medication reviews, and vision checks. Falls are a leading cause of injury in seniors.',
    metadata: {
      category: 'senior-health',
      source: 'Geriatrics Guidelines',
      keywords: ['fall prevention', 'balance', 'home safety', 'medication', 'vision']
    }
  },
  {
    id: 'senior-health-2',
    text: 'Bone health becomes increasingly important with age. Adequate calcium and vitamin D intake, weight-bearing exercise, and bone density screenings help prevent osteoporosis and fractures.',
    metadata: {
      category: 'senior-health',
      source: 'Osteoporosis Foundation',
      keywords: ['bone health', 'calcium', 'vitamin D', 'osteoporosis', 'fractures']
    }
  },

  // Workplace Health
  {
    id: 'workplace-health-1',
    text: 'Ergonomic workstation setup prevents repetitive strain injuries. Adjust chair height, monitor position, and take regular breaks to stretch and move. Consider a standing desk for variety.',
    metadata: {
      category: 'workplace-health',
      source: 'Occupational Health Guidelines',
      keywords: ['ergonomics', 'workstation', 'repetitive strain', 'standing desk', 'breaks']
    }
  },
  {
    id: 'workplace-health-2',
    text: 'Work-related stress can be managed through time management, setting boundaries, taking breaks, and seeking support when needed. Chronic work stress affects both mental and physical health.',
    metadata: {
      category: 'workplace-health',
      source: 'Occupational Psychology',
      keywords: ['work stress', 'time management', 'boundaries', 'breaks', 'support']
    }
  }
];

async function seedRemotePinecone() {
  try {
    logger.info('🚀 Starting remote Pinecone seeding process...');
    logger.info(`📋 Total health entries to upload: ${healthData.length}`);

    // Force initialize Pinecone service (disable mock mode)
    await pineconeService.initialize();

    // Check if we're still in mock mode
    if (pineconeService.useMock) {
      logger.error('❌ Pinecone is still in mock mode. Please check your API key configuration.');
      logger.info('🔧 Make sure PINECONE_API_KEY is properly set in your .env file');
      process.exit(1);
    }

    logger.info(`✅ Connected to remote Pinecone index: ${pineconeService.indexName}`);

    // Generate embeddings for each piece of health data
    const vectors = [];
    
    for (let i = 0; i < healthData.length; i++) {
      const item = healthData[i];
      logger.info(`🔄 Processing ${i + 1}/${healthData.length}: ${item.id}`);
      
      try {
        const embedding = await e5EmbeddingService.embed(item.text);
        
        vectors.push({
          id: item.id,
          values: embedding,
          metadata: {
            text: item.text,
            category: item.metadata.category,
            source: item.metadata.source,
            keywords: item.metadata.keywords.join(', ')
          }
        });

        logger.info(`✅ Generated embedding for: ${item.id}`);
      } catch (error) {
        logger.error(`❌ Failed to generate embedding for ${item.id}:`, error.message);
        throw error;
      }
    }

    // Upsert vectors to remote Pinecone database
    logger.info(`📤 Uploading ${vectors.length} vectors to remote Pinecone database...`);
    
    try {
      const upsertResult = await pineconeService.upsert(vectors);
      logger.info(`✅ Successfully uploaded ${vectors.length} vectors to remote Pinecone!`);
      logger.info('📊 Upsert result:', upsertResult);
    } catch (error) {
      logger.error('❌ Failed to upload vectors to Pinecone:', error.message);
      throw error;
    }

    // Test query to verify the data was inserted correctly
    logger.info('🧪 Testing remote database with sample query...');
    
    try {
      const testQuery = 'How can I improve my cardiovascular health through exercise?';
      const testEmbedding = await e5EmbeddingService.embed(testQuery);
      const results = await pineconeService.query(testEmbedding, 3);
      
      logger.info('🎯 Query test results from remote Pinecone:');
      results.forEach((result, index) => {
        logger.info(`${index + 1}. ID: ${result.id} (similarity: ${(result.score * 100).toFixed(1)}%)`);
        logger.info(`   Category: ${result.metadata.category}`);
        logger.info(`   Source: ${result.metadata.source}`);
        logger.info(`   Preview: ${result.metadata.text.substring(0, 80)}...`);
        logger.info('   ---');
      });

      if (results.length === 0) {
        logger.warn('⚠️  No results returned from query - there might be an indexing delay');
        logger.info('💡 Try running a test query again in a few minutes');
      } else {
        logger.info('🎉 Remote Pinecone database is working correctly!');
      }

    } catch (error) {
      logger.error('❌ Query test failed:', error.message);
      logger.warn('⚠️  Data may have been uploaded but query functionality needs verification');
    }

    logger.info('');
    logger.info('🎊 SEEDING COMPLETED SUCCESSFULLY!');
    logger.info('📈 Your remote Pinecone database now contains comprehensive health data');
    logger.info('🔗 Your health chatbot can now provide accurate, context-aware responses');
    logger.info('');

  } catch (error) {
    logger.error('💥 Failed to seed remote Pinecone database:', error);
    logger.error('');
    logger.info('🔍 Troubleshooting steps:');
    logger.info('1. Verify your PINECONE_API_KEY in .env file');
    logger.info('2. Check your Pinecone index name (PINECONE_INDEX_NAME)');
    logger.info('3. Ensure your Pinecone index exists and has the correct dimensions');
    logger.info('4. Verify your Gemini API key for embedding generation');
    logger.error('');
    process.exit(1);
  }
}

// Run the seeding process
if (require.main === module) {
  seedRemotePinecone()
    .then(() => {
      logger.info('🏁 Seeding process completed successfully. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💀 Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedRemotePinecone, healthData };
