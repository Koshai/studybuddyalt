// src/server/services/pdf.js
const fs = require('fs');
const pdf = require('pdf-parse');

class PDFService {
  constructor() {
    this.options = {
      max: 0, // Process all pages
      version: 'v1.10.100'
    };
  }

  async processPDF(pdfPath) {
    try {
      console.log('Starting PDF processing for:', pdfPath);
      
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdf(dataBuffer, this.options);
      
      console.log('PDF processing completed');
      console.log(`Pages processed: ${data.numpages}`);
      console.log(`Text length: ${data.text.length} characters`);
      
      return this.cleanText(data.text);
    } catch (error) {
      console.error('PDF processing error:', error);
      throw new Error('Failed to process PDF: ' + error.message);
    }
  }

  async processPDFWithMetadata(pdfPath) {
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdf(dataBuffer, this.options);
      
      return {
        text: this.cleanText(data.text),
        metadata: {
          pages: data.numpages,
          info: data.info,
          version: data.version,
          textLength: data.text.length
        }
      };
    } catch (error) {
      console.error('PDF processing with metadata error:', error);
      throw error;
    }
  }

  async processPDFPages(pdfPath, pageNumbers = []) {
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      
      if (pageNumbers.length === 0) {
        // Process all pages
        const data = await pdf(dataBuffer, this.options);
        return [{
          pageNumber: 'all',
          text: this.cleanText(data.text)
        }];
      }

      const results = [];
      
      for (const pageNum of pageNumbers) {
        const pageOptions = {
          ...this.options,
          first: pageNum,
          last: pageNum
        };
        
        const data = await pdf(dataBuffer, pageOptions);
        results.push({
          pageNumber: pageNum,
          text: this.cleanText(data.text)
        });
      }

      return results;
    } catch (error) {
      console.error('PDF page processing error:', error);
      throw error;
    }
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers patterns
      .replace(/^\d+\s*$/gm, '')
      .replace(/^Page \d+.*$/gm, '')
      // Remove common PDF artifacts
      .replace(/\f/g, '') // Form feed characters
      .replace(/\u00A0/g, ' ') // Non-breaking spaces
      // Fix line breaks and paragraphs
      .replace(/([.!?])\s*\n+/g, '$1\n\n')
      .replace(/\n{3,}/g, '\n\n')
      // Remove URLs and email addresses for cleaner text
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\S+@\S+\.\S+/g, '')
      // Clean up bullet points and lists
      .replace(/^[•\-\*]\s*/gm, '• ')
      // Trim and normalize
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  }

  extractSections(text) {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      // Check if line looks like a heading (simple heuristic)
      const isHeading = this.isLikelyHeading(line);
      
      if (isHeading) {
        // Save previous section
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent.join('\n').trim()
          });
        }
        
        // Start new section
        currentSection = line;
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Add the last section
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: currentContent.join('\n').trim()
      });
    }

    return sections;
  }

  isLikelyHeading(line) {
    if (!line || line.length === 0) return false;
    
    // Check for common heading patterns
    const headingPatterns = [
      /^Chapter \d+/i,
      /^\d+\.\s/,
      /^[A-Z][A-Z\s]{5,}$/,
      /^[A-Z][a-z\s]+:$/,
      /^\d+\.\d+\s/
    ];

    return headingPatterns.some(pattern => pattern.test(line.trim()));
  }

  async extractKeyTerms(text) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Sort by frequency and return top terms
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }

  validatePDF(pdfPath) {
    try {
      const stats = fs.statSync(pdfPath);
      
      return {
        exists: true,
        size: stats.size,
        isValidSize: stats.size > 0 && stats.size < 50 * 1024 * 1024, // 50MB limit
        extension: pdfPath.toLowerCase().endsWith('.pdf')
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  async getDocumentInfo(pdfPath) {
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdf(dataBuffer, { ...this.options, max: 1 });
      
      return {
        title: data.info?.Title || 'Unknown',
        author: data.info?.Author || 'Unknown',
        subject: data.info?.Subject || '',
        creator: data.info?.Creator || '',
        producer: data.info?.Producer || '',
        creationDate: data.info?.CreationDate || null,
        modificationDate: data.info?.ModDate || null,
        pages: data.numpages,
        version: data.version
      };
    } catch (error) {
      console.error('Error getting document info:', error);
      throw error;
    }
  }
}

module.exports = PDFService;