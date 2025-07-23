// src/server/services/ollama.js - CORRECTED VERSION
const { Ollama } = require('ollama');

class OllamaService {
  constructor() {
    this.ollama = new Ollama({
      host: 'http://localhost:11434'
    });
    this.defaultModel = 'llama3.2:3b';
  }

  async listModels() {
    try {
      const response = await this.ollama.list();
      return response.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  async pullModel(model) {
    try {
      const response = await this.ollama.pull({ model });
      return response;
    } catch (error) {
      console.error('Error pulling model:', error);
      throw error;
    }
  }

  /**
   * Generate MCQ questions with domain awareness
   */
  async generateQuestions(content, count = 5, difficulty = 'medium', subject = null, topic = null) {
    try {
      console.log(`🤖 Generating ${count} MCQ questions with difficulty: ${difficulty}`);
      console.log(`📚 Subject: ${subject?.name || 'Unknown'}, Topic: ${topic?.name || 'Unknown'}`);
      
      // Check if content is sufficient
      if (!content || content.trim().length < 100) {
        console.error('❌ Content too short for question generation');
        return [];
      }

      // Truncate content to avoid token limits
      const truncatedContent = content.substring(0, 2000);
      
      // Use multiple attempts for reliability
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔄 Attempt ${attempt} of 3`);
        
        const questions = await this.generateMCQAttempt(truncatedContent, count, difficulty, subject, topic);
        
        if (questions.length > 0) {
          console.log(`✅ Successfully generated ${questions.length} questions on attempt ${attempt}`);
          return questions;
        }
        
        console.log(`⚠️ Attempt ${attempt} failed, trying again...`);
        await this.delay(1000);
      }
      
      console.error('❌ All attempts failed');
      return [];
      
    } catch (error) {
      console.error('❌ Error in generateQuestions:', error);
      return [];
    }
  }

  async generateMCQAttempt(content, count, difficulty, subject, topic) {
    try {
      // Create domain-aware prompt
      const prompt = this.createDomainAwareMCQPrompt(content, count, difficulty, subject, topic);
      
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 1500,
          stop: ["END_QUESTIONS"]
        }
      });

      if (!response.response || response.response.trim().length === 0) {
        console.log('❌ Empty response from Ollama');
        return [];
      }

      console.log('📝 Raw Ollama response length:', response.response.length);
      return this.parseMCQResponse(response.response, count);
      
    } catch (error) {
      console.error('❌ Error in generateMCQAttempt:', error);
      return [];
    }
  }

  createDomainAwareMCQPrompt(content, count, difficulty, subject, topic) {
    // Detect domain and get instructions
    const domainContext = this.detectDomain(content, subject, topic);
    
    const difficultyInstructions = {
      easy: domainContext.easyInstructions,
      medium: domainContext.mediumInstructions,
      hard: domainContext.hardInstructions
    };

    return `You are an expert ${domainContext.domain} teacher creating practice questions for students learning ${topic?.name || 'this topic'}. 

STUDY MATERIAL:
${content}

IMPORTANT INSTRUCTIONS:
- You are NOT creating reading comprehension questions about what the material "contains" or "teaches"
- You are creating ${domainContext.domain} practice questions that test understanding of the CONCEPTS, PROCEDURES, and APPLICATIONS
- ${difficultyInstructions[difficulty]}
- Create questions that require students to APPLY the knowledge, not just recall what the text says
- Focus on the actual ${domainContext.domain} content, formulas, procedures, and problem-solving

${domainContext.specificInstructions}

Create exactly ${count} multiple choice questions that test actual ${domainContext.domain} knowledge:

QUESTION 1:
[Your ${domainContext.domain} question here - NOT about what the book teaches]
A) [Specific ${domainContext.domain} answer]
B) [Specific ${domainContext.domain} answer]
C) [Specific ${domainContext.domain} answer]  
D) [Specific ${domainContext.domain} answer]
CORRECT: [A/B/C/D]
EXPLANATION: [Explain the ${domainContext.domain} concept/procedure/reasoning]

Continue with ${count} questions total:`;
  }

  detectDomain(content, subject, topic) {
    const contentLower = content.toLowerCase();
    const subjectName = subject?.name?.toLowerCase() || '';
    
    // PRIORITY 1: Check if subject has category information
    if (subject?.category_id || subject?.category_name) {
      const categoryDomain = this.getDomainFromCategory(subject);
      if (categoryDomain) {
        console.log(`🎯 Using category-based domain: ${categoryDomain.domain}`);
        return categoryDomain;
      }
    }
    
    // PRIORITY 2: Auto-detect from content
    console.log('🔍 Auto-detecting domain from content...');
    
    if (this.isMathematics(contentLower, subjectName)) {
      return this.getMathematicsDomain();
    }
    if (this.isChemistry(contentLower, subjectName)) {
      return this.getChemistryDomain();
    }
    if (this.isPhysics(contentLower, subjectName)) {
      return this.getPhysicsDomain();
    }
    if (this.isBiology(contentLower, subjectName)) {
      return this.getBiologyDomain();
    }
    if (this.isHistory(contentLower, subjectName)) {
      return this.getHistoryDomain();
    }
    if (this.isLiterature(contentLower, subjectName)) {
      return this.getLiteratureDomain();
    }
    if (this.isGeography(contentLower, subjectName)) {
      return this.getGeographyDomain();
    }
    if (this.isLanguageLearning(contentLower, subjectName)) {
      return this.getLanguageLearningDomain();
    }
    
    console.log('⚠️ No specific domain detected, using general academic approach');
    return this.getDefaultDomain();
  }

  getDomainFromCategory(subject) {
    const categoryId = subject.category_id;
    const categoryName = subject.category_name?.toLowerCase();
    
    const categoryMapping = {
      'mathematics': this.getMathematicsDomain(),
      'natural-sciences': this.getScienceDomain(subject),
      'literature': this.getLiteratureDomain(),
      'history': this.getHistoryDomain(),
      'languages': this.getLanguageLearningDomain(),
      'arts': this.getArtHistoryDomain(),
      'computer-science': this.getComputerScienceDomain(),
      'business': this.getBusinessDomain(),
      'health-medicine': this.getHealthMedicineDomain(),
      'other': this.getDefaultDomain()
    };
    
    if (categoryId && categoryMapping[categoryId]) {
      return categoryMapping[categoryId];
    }
    
    return null;
  }

  // Domain Detection Methods
  isMathematics(content, subject) {
    const mathKeywords = ['addition', 'subtraction', 'multiplication', 'division', 'equation', 'algebra', 'calculate', 'solve'];
    return this.containsKeywords(content + ' ' + subject, mathKeywords, 2) || /[\+\-\*\/\=]/.test(content);
  }

  isChemistry(content, subject) {
    const chemKeywords = ['chemical', 'reaction', 'element', 'compound', 'acid', 'base', 'molecule', 'atom'];
    return this.containsKeywords(content + ' ' + subject, chemKeywords, 2);
  }

  isPhysics(content, subject) {
    const physicsKeywords = ['force', 'energy', 'motion', 'velocity', 'acceleration', 'mass', 'physics'];
    return this.containsKeywords(content + ' ' + subject, physicsKeywords, 2);
  }

  isBiology(content, subject) {
    const bioKeywords = ['cell', 'organism', 'dna', 'gene', 'biology', 'species', 'evolution'];
    return this.containsKeywords(content + ' ' + subject, bioKeywords, 2);
  }

  isHistory(content, subject) {
    const historyKeywords = ['war', 'battle', 'revolution', 'century', 'historical', 'history'];
    return this.containsKeywords(content + ' ' + subject, historyKeywords, 2) || /\b(1\d{3}|20\d{2})\b/.test(content);
  }

  isLiterature(content, subject) {
    const litKeywords = ['character', 'plot', 'theme', 'literature', 'novel', 'poetry', 'author'];
    return this.containsKeywords(content + ' ' + subject, litKeywords, 2);
  }

  isGeography(content, subject) {
    const geoKeywords = ['country', 'capital', 'continent', 'geography', 'climate', 'population'];
    return this.containsKeywords(content + ' ' + subject, geoKeywords, 2);
  }

  isLanguageLearning(content, subject) {
    const langKeywords = ['grammar', 'vocabulary', 'spanish', 'french', 'german', 'language'];
    return this.containsKeywords(content + ' ' + subject, langKeywords, 2);
  }

  containsKeywords(text, keywords, minCount) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    const found = keywords.filter(keyword => lowerText.includes(keyword));
    return found.length >= minCount;
  }

  // Domain Objects
  getMathematicsDomain() {
    return {
      domain: 'Mathematics',
      easyInstructions: 'Create basic calculation and concept identification questions',
      mediumInstructions: 'Create multi-step problems and application questions',
      hardInstructions: 'Create complex word problems and advanced concept questions',
      specificInstructions: `
MATHEMATICS QUESTION REQUIREMENTS:
- Ask questions that require CALCULATIONS or mathematical reasoning
- Include numerical problems, equations, and mathematical procedures
- Example: "What is 15 + 27?" NOT "What does this chapter teach about addition?"
- Example: "If x = 5, what is 3x + 2?" NOT "What mathematical operations are covered?"
- Include word problems that require mathematical thinking`
    };
  }

  getChemistryDomain() {
    return {
      domain: 'Chemistry',
      easyInstructions: 'Create questions about chemical formulas, basic reactions, and element properties',
      mediumInstructions: 'Create questions about chemical equations, reaction mechanisms, and calculations',
      hardInstructions: 'Create complex reaction problems, equilibrium questions, and advanced concepts',
      specificInstructions: `
CHEMISTRY QUESTION REQUIREMENTS:
- Ask about ACTUAL chemical reactions, formulas, and processes
- Test understanding of chemical principles and calculations
- Example: "What is the product when HCl reacts with NaOH?" NOT "What does this text teach about acids?"
- Example: "What is the molecular formula of water?" NOT "What compounds are mentioned?"
- Include stoichiometry, balancing equations, and reaction predictions`
    };
  }

  getPhysicsDomain() {
    return {
      domain: 'Physics',
      easyInstructions: 'Create questions about basic physics concepts, units, and simple calculations',
      mediumInstructions: 'Create problems involving physics formulas and real-world applications',
      hardInstructions: 'Create complex physics problems requiring multiple concepts and advanced reasoning',
      specificInstructions: `
PHYSICS QUESTION REQUIREMENTS:
- Ask about ACTUAL physics calculations, laws, and phenomena
- Test understanding of physics principles and problem-solving
- Example: "If F = ma and m = 10kg, a = 5m/s², what is F?" NOT "What does this text teach about force?"
- Include formula applications, unit conversions, and concept explanations`
    };
  }

  getBiologyDomain() {
    return {
      domain: 'Biology',
      easyInstructions: 'Create questions about biological structures, functions, and basic processes',
      mediumInstructions: 'Create questions about biological systems, interactions, and life processes',
      hardInstructions: 'Create complex questions about biological mechanisms and advanced concepts',
      specificInstructions: `
BIOLOGY QUESTION REQUIREMENTS:
- Ask about ACTUAL biological processes, structures, and functions
- Test understanding of how living systems work
- Example: "What is the function of mitochondria?" NOT "What does this text teach about cells?"
- Example: "During photosynthesis, what gas is produced?" NOT "What biological processes are mentioned?"
- Focus on biological concepts, organism functions, and life processes`
    };
  }

  getHistoryDomain() {
    return {
      domain: 'History',
      easyInstructions: 'Create questions about specific historical facts, dates, and key figures',
      mediumInstructions: 'Create questions about historical causes, effects, and connections',
      hardInstructions: 'Create analytical questions about historical significance and complex relationships',
      specificInstructions: `
HISTORY QUESTION REQUIREMENTS:
- Ask about ACTUAL historical events, people, and consequences
- Test knowledge of what happened, when, and why
- Example: "When did World War II end?" NOT "What does this text teach about war?"
- Example: "What caused the American Revolution?" NOT "What historical events are covered?"
- Focus on specific historical facts, chronology, and cause-effect relationships`
    };
  }

  getLiteratureDomain() {
    return {
      domain: 'Literature',
      easyInstructions: 'Create questions about characters, plot events, basic literary devices, and direct quotations',
      mediumInstructions: 'Create questions about themes, character motivations, literary techniques, and text analysis',
      hardInstructions: 'Create questions requiring interpretation, symbolism analysis, and critical evaluation',
      specificInstructions: `
LITERATURE QUESTION REQUIREMENTS:
- Ask about CHARACTERS, PLOT, THEMES, and LITERARY TECHNIQUES from the actual text
- Test understanding of character development, motivations, and relationships
- Example: "What does the green light symbolize in The Great Gatsby?" NOT "What themes does this book explore?"
- Example: "Why does Hamlet hesitate to kill Claudius?" NOT "What is this play about?"
- Focus on textual evidence, character analysis, and literary interpretation`
    };
  }

  getGeographyDomain() {
    return {
      domain: 'Geography',
      easyInstructions: 'Create questions about locations, physical features, countries, and basic geographical facts',
      mediumInstructions: 'Create questions about climate patterns, geographical processes, and human-environment interactions',
      hardInstructions: 'Create questions about complex geographical relationships, regional analysis, and geographical theories',
      specificInstructions: `
GEOGRAPHY QUESTION REQUIREMENTS:
- Ask about SPECIFIC locations, physical features, and geographical processes
- Test knowledge of countries, capitals, landmarks, and geographical phenomena
- Example: "What is the capital of Kenya?" NOT "What does this text teach about Africa?"
- Example: "Which mountain range separates Europe from Asia?"
- Focus on spatial relationships, physical processes, and human geography`
    };
  }

  getLanguageLearningDomain() {
    return {
      domain: 'Language Learning',
      easyInstructions: 'Create questions about vocabulary, basic grammar, and simple translations',
      mediumInstructions: 'Create questions about grammar rules, sentence structure, and language usage',
      hardInstructions: 'Create questions about complex grammar, idiomatic expressions, and advanced language concepts',
      specificInstructions: `
LANGUAGE LEARNING QUESTION REQUIREMENTS:
- Ask about VOCABULARY, GRAMMAR, and LANGUAGE USAGE from the material
- Test understanding of grammar rules, verb conjugations, and sentence structure
- Example: "What is the past tense of 'go'?" NOT "What does this lesson teach?"
- Example: "How do you say 'hello' in Spanish?"
- Focus on practical language skills and linguistic understanding`
    };
  }

  getScienceDomain(subject) {
    const subjectName = subject?.name?.toLowerCase() || '';
    
    if (subjectName.includes('chemistry')) {
      return this.getChemistryDomain();
    } else if (subjectName.includes('physics')) {
      return this.getPhysicsDomain();
    } else if (subjectName.includes('biology')) {
      return this.getBiologyDomain();
    }
    
    return {
      domain: 'Natural Sciences',
      easyInstructions: 'Create questions about basic scientific concepts, facts, and observations',
      mediumInstructions: 'Create questions about scientific processes, experiments, and analysis',
      hardInstructions: 'Create complex questions requiring scientific reasoning and problem-solving',
      specificInstructions: `
NATURAL SCIENCES QUESTION REQUIREMENTS:
- Ask about ACTUAL scientific processes, experiments, and phenomena
- Test understanding of scientific concepts and their applications
- Include questions about scientific method, observations, and conclusions
- Focus on how science works and scientific reasoning`
    };
  }

  getArtHistoryDomain() {
    return {
      domain: 'Art History',
      easyInstructions: 'Create questions about artists, artworks, art movements, and basic art terminology',
      mediumInstructions: 'Create questions about artistic techniques, historical context, and art analysis',
      hardInstructions: 'Create questions requiring interpretation of artistic meaning and complex art historical analysis',
      specificInstructions: `
ART HISTORY QUESTION REQUIREMENTS:
- Ask about SPECIFIC artists, artworks, movements, and artistic techniques
- Test knowledge of art history, artistic styles, and cultural context
- Example: "Who painted 'Starry Night'?" NOT "What does this text teach about art?"
- Focus on artistic knowledge, visual analysis, and cultural understanding`
    };
  }

  getComputerScienceDomain() {
    return {
      domain: 'Computer Science',
      easyInstructions: 'Create questions about basic programming concepts, terminology, and simple algorithms',
      mediumInstructions: 'Create questions about programming logic, data structures, and algorithm analysis',
      hardInstructions: 'Create complex programming problems, system design questions, and advanced CS concepts',
      specificInstructions: `
COMPUTER SCIENCE QUESTION REQUIREMENTS:
- Ask about ACTUAL programming concepts, algorithms, and problem-solving
- Test understanding of coding logic, data structures, and computational thinking
- Example: "What does this code output?" NOT "What does this lesson teach about programming?"
- Include code analysis, algorithm design, and computational problems`
    };
  }

  getBusinessDomain() {
    return {
      domain: 'Business & Economics',
      easyInstructions: 'Create questions about basic business concepts, terminology, and simple economic principles',
      mediumInstructions: 'Create questions about business strategies, market analysis, and economic applications',
      hardInstructions: 'Create complex business scenarios, strategic analysis, and advanced economic reasoning',
      specificInstructions: `
BUSINESS QUESTION REQUIREMENTS:
- Ask about ACTUAL business strategies, economic principles, and market dynamics
- Test understanding of business operations, financial concepts, and economic theory
- Example: "What is the break-even point if fixed costs are $1000?" NOT "What does this text teach about business?"
- Include business case analysis, financial calculations, and strategic thinking`
    };
  }

  getHealthMedicineDomain() {
    return {
      domain: 'Health & Medicine',
      easyInstructions: 'Create questions about basic anatomy, health facts, and medical terminology',
      mediumInstructions: 'Create questions about body systems, health processes, and medical procedures',
      hardInstructions: 'Create complex questions about medical diagnosis, treatment, and advanced health concepts',
      specificInstructions: `
HEALTH & MEDICINE QUESTION REQUIREMENTS:
- Ask about ACTUAL medical facts, health processes, and clinical knowledge
- Test understanding of anatomy, physiology, and medical procedures
- Example: "What is the function of the liver?" NOT "What does this text teach about anatomy?"
- Include diagnostic reasoning, treatment options, and health science concepts`
    };
  }

  getDefaultDomain() {
    return {
      domain: 'Academic',
      easyInstructions: 'Create questions about key concepts and basic understanding',
      mediumInstructions: 'Create questions that require analysis and application of concepts',
      hardInstructions: 'Create questions requiring synthesis and critical evaluation',
      specificInstructions: `
ACADEMIC QUESTION REQUIREMENTS:
- Ask about the ACTUAL subject matter concepts and applications
- Test understanding of the core ideas and how to apply them
- Avoid meta-questions about what the text "teaches" or "contains"
- Focus on the substantive content and practical applications`
    };
  }

  // Response Parsing
  parseMCQResponse(response, expectedCount) {
    const questions = [];
    
    try {
      const questionBlocks = response.split(/QUESTION\s+\d+:/i).filter(block => block.trim());
      
      for (let i = 0; i < questionBlocks.length && questions.length < expectedCount; i++) {
        const block = questionBlocks[i].trim();
        if (!block) continue;
        
        const question = this.parseQuestionBlock(block);
        if (question) {
          questions.push(question);
        }
      }
      
      return questions;
      
    } catch (error) {
      console.error('❌ Error parsing MCQ response:', error);
      return [];
    }
  }

  parseQuestionBlock(block) {
    try {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 6) return null;
      
      let questionText = '';
      let optionStartIndex = -1;
      
      // Find question text
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.match(/^[A-D]\)/i) && !line.toLowerCase().startsWith('correct:') && !line.toLowerCase().startsWith('explanation:')) {
          if (!questionText) {
            questionText = line;
          } else {
            questionText += ' ' + line;
          }
        } else {
          optionStartIndex = i;
          break;
        }
      }
      
      if (!questionText || optionStartIndex === -1) return null;
      
      const options = [];
      let correctAnswer = null;
      let explanation = '';
      
      // Parse options, correct answer, and explanation
      for (let i = optionStartIndex; i < lines.length; i++) {
        const line = lines[i];
        
        const optionMatch = line.match(/^([A-D])\)\s*(.+)$/i);
        if (optionMatch) {
          options.push(optionMatch[2].trim());
          continue;
        }
        
        const correctMatch = line.match(/^CORRECT:\s*([A-D])/i);
        if (correctMatch) {
          const letter = correctMatch[1].toUpperCase();
          correctAnswer = letter.charCodeAt(0) - 65;
          continue;
        }
        
        const explanationMatch = line.match(/^EXPLANATION:\s*(.+)$/i);
        if (explanationMatch) {
          explanation = explanationMatch[1].trim();
          break;
        }
      }
      
      if (options.length < 4 || correctAnswer === null || correctAnswer < 0 || correctAnswer >= options.length) {
        return null;
      }
      
      const finalOptions = options.slice(0, 4);
      const finalExplanation = explanation.trim() || 
        `The correct answer is ${String.fromCharCode(65 + correctAnswer)}. ${finalOptions[correctAnswer]}`;
      
      return {
        question: questionText.trim(),
        answer: finalOptions[correctAnswer],
        difficulty: 'medium',
        type: 'multiple_choice',
        options: finalOptions,
        correctIndex: correctAnswer,
        explanation: finalExplanation
      };
      
    } catch (error) {
      console.error('❌ Error parsing question block:', error);
      return null;
    }
  }

  async isHealthy() {
    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: "Say 'OK' if you are working properly.",
        stream: false,
        options: { num_predict: 10 }
      });
      
      return response && response.response && response.response.trim().length > 0;
    } catch (error) {
      console.error('❌ Ollama health check failed:', error);
      return false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = OllamaService;