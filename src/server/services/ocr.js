// src/server/services/ocr.js
const Tesseract = require('tesseract.js');

class OCRService {
  constructor() {
    this.options = {
      logger: m => console.log(m) // Progress logger
    };
  }

  async processImage(imagePath) {
    try {
      console.log('Starting OCR processing for:', imagePath);
      
      const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      console.log('OCR processing completed');
      return this.cleanText(text);
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process image: ' + error.message);
    }
  }

  async processImageWithConfig(imagePath, config = {}) {
    try {
      const options = {
        ...this.options,
        ...config
      };

      const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'eng',
        options
      );

      return this.cleanText(text);
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process image: ' + error.message);
    }
  }

  async processMultipleImages(imagePaths) {
    try {
      const results = [];
      
      for (const imagePath of imagePaths) {
        console.log(`Processing image: ${imagePath}`);
        const text = await this.processImage(imagePath);
        results.push({
          imagePath,
          text,
          timestamp: new Date().toISOString()
        });
      }

      return results;
    } catch (error) {
      console.error('Multiple image processing error:', error);
      throw error;
    }
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere
      .replace(/[^\w\s\.\,\!\?\-\(\)\[\]\{\}\:\;\"\']/g, '')
      // Fix common OCR mistakes
      .replace(/\b0\b/g, 'O') // Common OCR mistake: 0 instead of O
      .replace(/\bl\b/g, 'I') // Common OCR mistake: l instead of I
      // Remove multiple periods
      .replace(/\.{2,}/g, '.')
      // Fix spacing around punctuation
      .replace(/\s+([.,!?;:])/g, '$1')
      .replace(/([.,!?;:])\s*/g, '$1 ')
      // Trim and remove empty lines
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  }

  async detectLanguage(imagePath) {
    try {
      const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'eng+fra+spa+deu', // Multi-language support
        this.options
      );

      // Simple language detection based on common words
      const languages = {
        en: ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that'],
        fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et'],
        es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un'],
        de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das']
      };

      const textLower = text.toLowerCase();
      const scores = {};

      for (const [lang, words] of Object.entries(languages)) {
        scores[lang] = words.reduce((score, word) => {
          return score + (textLower.split(word).length - 1);
        }, 0);
      }

      const detectedLang = Object.keys(scores).reduce((a, b) => 
        scores[a] > scores[b] ? a : b
      );

      return detectedLang;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English
    }
  }

  async preprocessImage(imagePath) {
    // This would typically involve image preprocessing
    // For now, we'll return the original path
    // In a full implementation, you might want to:
    // - Adjust contrast/brightness
    // - Remove noise
    // - Correct skew
    return imagePath;
  }

  getConfidenceScore(result) {
    if (!result.data || !result.data.words) return 0;
    
    const words = result.data.words;
    const totalWords = words.length;
    
    if (totalWords === 0) return 0;
    
    const confidenceSum = words.reduce((sum, word) => sum + word.confidence, 0);
    return Math.round(confidenceSum / totalWords);
  }

  async processWithConfidence(imagePath, minConfidence = 60) {
    try {
      const result = await Tesseract.recognize(
        imagePath,
        'eng',
        this.options
      );

      const confidence = this.getConfidenceScore(result);
      const text = this.cleanText(result.data.text);

      return {
        text,
        confidence,
        isReliable: confidence >= minConfidence,
        wordCount: result.data.words ? result.data.words.length : 0
      };
    } catch (error) {
      console.error('OCR with confidence error:', error);
      throw error;
    }
  }
}

module.exports = OCRService;