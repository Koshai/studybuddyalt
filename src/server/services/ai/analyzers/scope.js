// src/server/services/ai/analyzers/scope.js
// Content Scope Analyzer - Determines what the study material actually teaches

class ContentScopeAnalyzer {
  constructor(ollamaClient) {
    this.ollama = ollamaClient;
    this.defaultModel = 'llama3.2:3b';
  }

  /**
   * Analyze the educational scope and level of content
   */
  async analyzeScope(content, subject, topic) {
    try {
      console.log('🔍 Analyzing content scope...');
      
      const truncatedContent = content.substring(0, 1500);
      const domainHint = this.getDomainHint(subject);
      
      const analysisPrompt = this.createAnalysisPrompt(truncatedContent, domainHint);
      
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: analysisPrompt,
        stream: false,
        options: {
          temperature: 0.1, // Very low for consistent analysis
          top_p: 0.8,
          num_predict: 400
        }
      });

      const analysis = this.parseAnalysisResponse(response.response, subject, topic);
      console.log('📊 Content scope analysis:', analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error analyzing content scope:', error);
      return this.getDefaultScope(subject, topic);
    }
  }

  /**
   * Create a focused analysis prompt
   */
  createAnalysisPrompt(content, domainHint) {
    return `You are an educational content analyzer. Analyze this study material to understand EXACTLY what it teaches.

STUDY MATERIAL:
${content}

Your task: Determine what specific concepts, skills, and operations this material ACTUALLY covers.

Respond in this EXACT format:

EDUCATIONAL_LEVEL: [elementary/middle_school/high_school/college]
SUBJECT_DOMAIN: [mathematics/science/history/literature/language/other]
CONCEPTS_TAUGHT: [list specific concepts the material teaches, separated by commas]
OPERATIONS_SHOWN: [specific operations, procedures, or skills demonstrated, separated by commas]
COMPLEXITY_LEVEL: [basic/intermediate/advanced]
NUMBER_RANGE: [if math, what range of numbers are used: single_digit/double_digit/triple_digit/larger]
PREREQUISITES: [what prior knowledge does this assume, separated by commas]

IMPORTANT: Only list what is EXPLICITLY shown or taught in the material. Don't infer or assume related concepts.

${domainHint}`;
  }

  /**
   * Get domain-specific analysis hints
   */
  getDomainHint(subject) {
    const subjectName = subject?.name?.toLowerCase() || '';
    
    if (subjectName.includes('math')) {
      return `
MATHEMATICS FOCUS: Pay special attention to:
- What mathematical operations are actually shown (addition, subtraction, multiplication, division)
- The size and complexity of numbers used in examples
- Whether word problems are present and their complexity level
- What mathematical concepts are explicitly taught vs mentioned`;
    }
    
    if (subjectName.includes('history')) {
      return `
HISTORY FOCUS: Pay attention to:
- Specific time periods covered
- Types of historical analysis (facts, causes, effects, significance)
- Geographic scope (local, national, world history)
- Complexity of historical thinking required`;
    }
    
    return `
GENERAL FOCUS: Determine:
- The educational level of vocabulary and concepts
- Whether content is introductory or advanced
- What specific skills or knowledge areas are covered`;
  }

  /**
   * Parse the AI analysis response
   */
  parseAnalysisResponse(response, subject, topic) {
    const analysis = {
      educationalLevel: 'middle_school',
      subjectDomain: 'general',
      conceptsTaught: [],
      operationsShown: [],
      complexityLevel: 'basic',
      numberRange: 'double_digit',
      prerequisites: [],
      rawResponse: response
    };

    try {
      const lines = response.split('\n').map(line => line.trim()).filter(line => line);
      
      for (const line of lines) {
        if (line.startsWith('EDUCATIONAL_LEVEL:')) {
          analysis.educationalLevel = this.extractValue(line);
        } else if (line.startsWith('SUBJECT_DOMAIN:')) {
          analysis.subjectDomain = this.extractValue(line);
        } else if (line.startsWith('CONCEPTS_TAUGHT:')) {
          analysis.conceptsTaught = this.extractList(line);
        } else if (line.startsWith('OPERATIONS_SHOWN:')) {
          analysis.operationsShown = this.extractList(line);
        } else if (line.startsWith('COMPLEXITY_LEVEL:')) {
          analysis.complexityLevel = this.extractValue(line);
        } else if (line.startsWith('NUMBER_RANGE:')) {
          analysis.numberRange = this.extractValue(line);
        } else if (line.startsWith('PREREQUISITES:')) {
          analysis.prerequisites = this.extractList(line);
        }
      }
      
      // Validate and clean the analysis
      return this.validateAnalysis(analysis, subject, topic);
      
    } catch (error) {
      console.error('❌ Error parsing analysis response:', error);
      return this.getDefaultScope(subject, topic);
    }
  }

  /**
   * Extract value from analysis line
   */
  extractValue(line) {
    const parts = line.split(':');
    if (parts.length > 1) {
      return parts[1].trim().toLowerCase();
    }
    return '';
  }

  /**
   * Extract list from analysis line
   */
  extractList(line) {
    const parts = line.split(':');
    if (parts.length > 1) {
      return parts[1].split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return [];
  }

  /**
   * Validate and enhance the analysis
   */
  validateAnalysis(analysis, subject, topic) {
    // Ensure we have meaningful data
    if (analysis.conceptsTaught.length === 0) {
      analysis.conceptsTaught = [topic?.name || 'basic concepts'];
    }
    
    if (analysis.operationsShown.length === 0 && analysis.subjectDomain === 'mathematics') {
      analysis.operationsShown = ['basic arithmetic'];
    }
    
    // Add subject context
    analysis.subjectInfo = {
      id: subject?.id,
      name: subject?.name,
      categoryId: subject?.category_id,
      categoryName: subject?.category_name
    };
    
    analysis.topicInfo = {
      id: topic?.id,
      name: topic?.name,
      description: topic?.description
    };
    
    return analysis;
  }

  /**
   * Get default scope when analysis fails
   */
  getDefaultScope(subject, topic) {
    const subjectName = subject?.name?.toLowerCase() || '';
    
    let domain = 'general';
    let operations = ['basic operations'];
    let level = 'middle_school';
    
    if (subjectName.includes('math')) {
      domain = 'mathematics';
      operations = ['addition', 'subtraction'];
      level = 'elementary';
    } else if (subjectName.includes('history')) {
      domain = 'history';
      operations = ['factual recall', 'basic analysis'];
    }
    
    return {
      educationalLevel: level,
      subjectDomain: domain,
      conceptsTaught: [topic?.name || 'general concepts'],
      operationsShown: operations,
      complexityLevel: 'basic',
      numberRange: 'single_digit',
      prerequisites: ['none'],
      subjectInfo: {
        id: subject?.id,
        name: subject?.name,
        categoryId: subject?.category_id,
        categoryName: subject?.category_name
      },
      topicInfo: {
        id: topic?.id,
        name: topic?.name,
        description: topic?.description
      },
      rawResponse: 'Default scope used due to analysis failure'
    };
  }

  /**
   * Check if content is sufficient for analysis
   */
  isContentSufficient(content) {
    if (!content || content.trim().length < 50) {
      return false;
    }
    
    // Check for meaningful content (not just whitespace or minimal text)
    const words = content.trim().split(/\s+/);
    return words.length >= 10;
  }
}

module.exports = ContentScopeAnalyzer;