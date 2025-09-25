const axios = require('axios');
const pino = require('pino');

const logger = pino();

class TranslateService {
  constructor() {
    this.apiKey = process.env.AZURE_TRANSLATOR_KEY;
    this.endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
    this.region = process.env.AZURE_TRANSLATOR_REGION;
    this.useMock = !this.apiKey;
    
    if (this.useMock) {
      logger.warn('AZURE_TRANSLATOR_KEY not found, using mock mode');
    }
  }

  async detectLanguage(text) {
    if (this.useMock) {
      return this._mockDetectLanguage(text);
    }

    try {
      const headers = {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Content-Type': 'application/json'
      };

      if (this.region) {
        headers['Ocp-Apim-Subscription-Region'] = this.region;
      }

      const response = await axios.post(
        `${this.endpoint}/detect?api-version=3.0`,
        [{ text }],
        { headers }
      );

      const detection = response.data[0];
      return {
        language: detection.language,
        confidence: detection.score
      };
    } catch (error) {
      logger.error('Azure Translator detection failed:', error.message);
      return this._mockDetectLanguage(text);
    }
  }

  async translateText(text, targetLanguage, sourceLanguage = null) {
    if (this.useMock) {
      return this._mockTranslate(text, targetLanguage);
    }

    try {
      const headers = {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Content-Type': 'application/json'
      };

      if (this.region) {
        headers['Ocp-Apim-Subscription-Region'] = this.region;
      }

      let url = `${this.endpoint}/translate?api-version=3.0&to=${targetLanguage}`;
      if (sourceLanguage) {
        url += `&from=${sourceLanguage}`;
      }

      const response = await axios.post(
        url,
        [{ text }],
        { headers }
      );

      const translation = response.data[0];
      return {
        translatedText: translation.translations[0].text,
        detectedSourceLanguage: translation.detectedLanguage?.language || sourceLanguage
      };
    } catch (error) {
      logger.error('Azure Translator translation failed:', error.message);
      return this._mockTranslate(text, targetLanguage);
    }
  }

  async isEnglish(text) {
    const detection = await this.detectLanguage(text);
    return detection.language === 'en';
  }

  _mockDetectLanguage(text) {
    logger.info('Using mock language detection');
    
    // Simple heuristic-based language detection
    const patterns = {
      'es': /¿|¡|ñ|á|é|í|ó|ú|ü/i,
      'fr': /ç|à|è|é|ê|ë|î|ï|ô|ù|û|ü|ÿ/i,
      'de': /ä|ö|ü|ß/i,
      'it': /à|è|é|ì|í|î|ò|ó|ù|ú/i,
      'pt': /ã|õ|ç|á|à|â|é|ê|í|ó|ô|ú/i,
      'ru': /[а-яё]/i,
      'ja': /[ひらがなカタカナ漢字]/,
      'ko': /[한글]/,
      'zh': /[中文]/,
      'ar': /[العربية]/,
      'hi': /[अ-ह्]/
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return {
          language: lang,
          confidence: 0.8
        };
      }
    }

    // Default to English if no patterns match
    return {
      language: 'en',
      confidence: 0.9
    };
  }

  _mockTranslate(text, targetLanguage) {
    logger.info(`Using mock Azure translation to ${targetLanguage}`);
    
    // For demo purposes, provide basic Hindi translations for common health terms
    if (targetLanguage === 'en') {
      return {
        translatedText: text, // Assume already in English for mock
        detectedSourceLanguage: 'auto'
      };
    }

    // Basic Hindi translation for health responses
    if (targetLanguage === 'hi') {
      // Simple word replacements for health terms
      let translatedText = text
        .replace(/exercise/gi, 'व्यायाम')
        .replace(/cardiovascular/gi, 'हृदय संबंधी')
        .replace(/health/gi, 'स्वास्थ्य')
        .replace(/daily/gi, 'दैनिक')
        .replace(/water/gi, 'पानी')
        .replace(/minutes/gi, 'मिनट')
        .replace(/heart/gi, 'दिल')
        .replace(/week/gi, 'सप्ताह')
        .replace(/walking/gi, 'चलना')
        .replace(/running/gi, 'दौड़ना')
        .replace(/swimming/gi, 'तैराकी')
        .replace(/doctor/gi, 'डॉक्टर')
        .replace(/WHO Guidelines/gi, 'WHO दिशानिर्देश')
        .replace(/according to/gi, 'के अनुसार')
        .replace(/at least/gi, 'कम से कम')
        .replace(/per week/gi, 'प्रति सप्ताह')
        .replace(/significantly reduce/gi, 'काफी कम कर')
        .replace(/diabetes/gi, 'मधुमेह')
        .replace(/stroke/gi, 'स्ट्रोक')
        .replace(/Start slowly/gi, 'धीरे-धीरे शुरू करें')
        .replace(/gradually increase/gi, 'धीरे-धीरे बढ़ाएं')
        .replace(/intensity/gi, 'तीव्रता')
        .replace(/duration/gi, 'अवधि')
        .replace(/Important/gi, 'महत्वपूर्ण')
        .replace(/medical professional/gi, 'चिकित्सा पेशेवर')
        .replace(/qualified/gi, 'योग्य')
        .replace(/specific health issues/gi, 'विशिष्ट स्वास्थ्य समस्याएं')
        .replace(/symptoms/gi, 'लक्षण')
        .replace(/seek advice/gi, 'सलाह लें');

      // Translate common sentence structures
      if (text.includes('Regular cardiovascular exercise')) {
        translatedText = 'WHO दिशानिर्देशों के अनुसार, नियमित हृदय संबंधी व्यायाम जैसे चलना, दौड़ना, तैराकी, या साइकिल चलाना सप्ताह में कम से कम 150 मिनट के लिए हृदय रोग, स्ट्रोक और मधुमेह के जोखिम को काफी कम कर सकता है। धीरे-धीरे शुरू करें और धीरे-धीरे तीव्रता और अवधि बढ़ाएं।';
      }

      if (text.includes('This guidance is general in nature')) {
        translatedText = translatedText.replace(
          /This guidance is general in nature.*$/,
          'महत्वपूर्ण: यह मार्गदर्शन सामान्य प्रकृति का है। विशिष्ट स्वास्थ्य समस्याओं या लक्षणों के लिए, कृपया एक योग्य चिकित्सा पेशेवर से सलाह लें जो आपकी व्यक्तिगत स्थिति का आकलन कर सके।'
        );
      }

      return {
        translatedText,
        detectedSourceLanguage: 'en'
      };
    }

    // For other languages, use simple prefix (as before)
    const prefixes = {
      'es': '[ES] ',
      'fr': '[FR] ',
      'de': '[DE] ',
      'it': '[IT] ',
      'pt': '[PT] ',
      'ru': '[RU] ',
      'ja': '[JA] ',
      'ko': '[KO] ',
      'zh': '[ZH] ',
      'ar': '[AR] '
    };

    const prefix = prefixes[targetLanguage] || `[${targetLanguage.toUpperCase()}] `;
    
    return {
      translatedText: prefix + text,
      detectedSourceLanguage: 'en'
    };
  }

  // Language code mappings for common languages
  static LANGUAGE_CODES = {
    'english': 'en',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'russian': 'ru',
    'japanese': 'ja',
    'korean': 'ko',
    'chinese': 'zh',
    'arabic': 'ar',
    'hindi': 'hi'
  };

  static getLanguageCode(languageName) {
    const name = languageName.toLowerCase();
    return this.LANGUAGE_CODES[name] || name;
  }
}

module.exports = new TranslateService();
