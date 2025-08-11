// src/server/services/prompt-generation.js
// Handles all prompt generation for different subjects

class PromptGenerator {
  constructor() {
    console.log('📝 PromptGenerator initialized');
  }

  /**
   * Main entry point for creating subject-specific prompts
   */
  createSubjectPrompt(content, count, subjectCategory, topicName) {
    const subjectId = subjectCategory.id;
    const baseContent = content.substring(0, 2000);
    
    switch (subjectId) {
      case 'mathematics':
        return this.createMathPrompt(baseContent, count, topicName);
        
      case 'natural-sciences':
        return this.createSciencePrompt(baseContent, count, topicName);
        
      case 'literature':
        return this.createLiteraturePrompt(baseContent, count, topicName);
        
      case 'history':
        return this.createHistoryPrompt(baseContent, count, topicName);
        
      case 'computer-science':
        return this.createComputerSciencePrompt(baseContent, count, topicName);
        
      case 'languages':
        return this.createLanguagePrompt(baseContent, count, topicName);
        
      case 'business':
        return this.createBusinessPrompt(baseContent, count, topicName);
        
      case 'arts':
        return this.createArtsPrompt(baseContent, count, topicName);
        
      case 'health-medicine':
        return this.createHealthPrompt(baseContent, count, topicName);
        
      case 'other':
      default:
        return this.createGeneralPrompt(baseContent, count, topicName, subjectCategory.name);
    }
  }

  /**
   * Math prompt (keep existing one - it's working)
   */
  createMathPrompt(content, count, topicName) {
    return `You are a MATHEMATICS teacher creating ${count} practice questions for "${topicName}".

STUDY MATERIAL:
${content}

🧮 CRITICAL MATH REQUIREMENTS:
- VERIFY ALL ARITHMETIC: Every calculation must be 100% mathematically correct
- Example: 5 × 4 = 20 (NOT 15, NOT 18)
- Example: 8 + 7 = 15 (NOT 14, NOT 16) 
- Example: 12 - 5 = 7 (NOT 8, NOT 6)
- Double-check every number before finalizing
- If unsure about arithmetic, recalculate step by step

MATHEMATICS TEACHING FOCUS:
- Test computational skills and mathematical reasoning
- Ask about calculations, problem-solving, formulas
- Include numerical examples from the material
- Ensure mathematical accuracy above all else

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Mathematical question testing concepts from the material]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Mathematical explanation with correct arithmetic]

Continue for all ${count} questions. Remember: Mathematical accuracy is non-negotiable!`;
  }

  /**
   * Science prompt - ENHANCED
   */
  createSciencePrompt(content, count, topicName) {
    return `You are a SCIENCE teacher creating ${count} educational questions for "${topicName}".

STUDY MATERIAL:
${content}

🔬 SCIENCE TEACHING REQUIREMENTS:
- Focus on scientific concepts, processes, and reasoning
- Test understanding of cause and effect relationships
- Include proper scientific terminology from the material
- Ensure scientific accuracy - no misconceptions
- Ask about HOW and WHY, not just WHAT

SCIENCE QUESTION GUIDELINES:
✅ Test understanding of scientific processes
✅ Ask about relationships between concepts
✅ Include scientific reasoning and evidence
✅ Use proper scientific vocabulary from material
✅ Focus on concepts that can be learned from text

❌ Don't require lab equipment or experiments
❌ Don't ask about specific measurements not in material
❌ Don't include common scientific misconceptions

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Science question testing understanding of concepts from the material]
A) [Scientific option A]
B) [Scientific option B]
C) [Scientific option C]
D) [Scientific option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Scientific explanation with reasoning]

Continue for all ${count} questions. Focus on scientific understanding!`;
  }

  /**
   * Literature prompt - ENHANCED
   */
  createLiteraturePrompt(content, count, topicName) {
    return `You are a LITERATURE teacher creating ${count} analytical questions for "${topicName}".

STUDY MATERIAL:
${content}

📚 LITERATURE ANALYSIS REQUIREMENTS:
- Focus on literary analysis, not plot summary
- Test understanding of themes, character development, literary devices
- Ask about author's purpose and writing techniques
- Include questions about textual evidence and interpretation
- Encourage critical thinking about literature

LITERATURE QUESTION GUIDELINES:
✅ Ask about themes, symbolism, character motivation
✅ Test understanding of literary devices and techniques
✅ Include questions about author's purpose and style
✅ Focus on interpretation and analysis
✅ Ask "why" and "how" questions about the text

❌ Don't ask simple plot summary questions
❌ Don't ask about events not covered in the material
❌ Don't require knowledge of other works not mentioned

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Literary analysis question based on the material]
A) [Analytical option A]
B) [Analytical option B]
C) [Analytical option C]
D) [Analytical option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Literary analysis explanation with textual reasoning]

Continue for all ${count} questions. Focus on literary analysis and critical thinking!`;
  }

  /**
   * History prompt - ENHANCED
   */
  createHistoryPrompt(content, count, topicName) {
    return `You are a HISTORY teacher creating ${count} analytical questions for "${topicName}".

STUDY MATERIAL:
${content}

🏛️ HISTORY ANALYSIS REQUIREMENTS:
- Focus on historical analysis, causation, and significance
- Test understanding of cause and effect relationships
- Ask about historical context and perspectives
- Include questions about change and continuity over time
- Encourage critical thinking about historical events

HISTORY QUESTION GUIDELINES:
✅ Ask about causes and effects of historical events
✅ Test understanding of historical significance
✅ Include questions about different perspectives
✅ Focus on change and continuity over time
✅ Ask about historical context and background

❌ Don't ask simple memorization of dates
❌ Don't require information not in the material
❌ Don't ask about events without context

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Historical analysis question based on the material]
A) [Historical option A]
B) [Historical option B]
C) [Historical option C]
D) [Historical option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Historical explanation with reasoning about causation/significance]

Continue for all ${count} questions. Focus on historical thinking and analysis!`;
  }

  /**
   * Computer Science prompt - NEW
   */
  createComputerSciencePrompt(content, count, topicName) {
    return `You are a COMPUTER SCIENCE teacher creating ${count} programming questions for "${topicName}".

STUDY MATERIAL:
${content}

💻 COMPUTER SCIENCE REQUIREMENTS:
- Focus on programming concepts, algorithms, and computational thinking
- Test understanding of code logic and problem-solving
- Include questions about programming constructs from the material
- Ensure code accuracy - proper syntax and logic
- Ask about problem-solving approaches and efficiency

PROGRAMMING QUESTION GUIDELINES:
✅ Test understanding of programming concepts and logic
✅ Ask about algorithm efficiency and problem-solving
✅ Include questions about code functionality
✅ Focus on computational thinking skills
✅ Test debugging and code analysis skills

❌ Don't use programming languages not mentioned in material
❌ Don't require advanced concepts not covered
❌ Don't include syntax errors in code examples

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Programming/CS question based on the material]
A) [Programming option A]
B) [Programming option B]
C) [Programming option C]
D) [Programming option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Technical explanation with reasoning about code/algorithms]

Continue for all ${count} questions. Focus on computational thinking!`;
  }

  /**
   * Language Learning prompt - NEW
   */
  createLanguagePrompt(content, count, topicName) {
    return `You are a LANGUAGE teacher creating ${count} educational questions for "${topicName}".

STUDY MATERIAL:
${content}

🗣️ LANGUAGE LEARNING REQUIREMENTS:
- Focus on grammar, vocabulary, and language structure
- Test understanding of language rules and patterns
- Include questions about word meanings and usage
- Ensure linguistic accuracy
- Ask about language structure and communication

LANGUAGE QUESTION GUIDELINES:
✅ Test grammar rules and sentence structure
✅ Ask about vocabulary meanings and usage
✅ Include questions about language patterns
✅ Focus on communication and comprehension
✅ Test translation and interpretation skills

❌ Don't require audio or pronunciation
❌ Don't use languages not mentioned in material
❌ Don't include culturally specific references not covered

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Language learning question based on the material]
A) [Language option A]
B) [Language option B]
C) [Language option C]
D) [Language option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Linguistic explanation with grammar/usage reasoning]

Continue for all ${count} questions. Focus on language understanding!`;
  }

  /**
   * Business prompt - NEW
   */
  createBusinessPrompt(content, count, topicName) {
    return `You are a BUSINESS teacher creating ${count} practical questions for "${topicName}".

STUDY MATERIAL:
${content}

💼 BUSINESS EDUCATION REQUIREMENTS:
- Focus on business concepts, strategy, and real-world applications
- Test understanding of business principles and practices
- Include questions about decision-making and problem-solving
- Ensure practical relevance to business situations
- Ask about analysis and evaluation of business scenarios

BUSINESS QUESTION GUIDELINES:
✅ Test understanding of business concepts and principles
✅ Ask about strategic thinking and decision-making
✅ Include questions about market analysis and competition
✅ Focus on practical business applications
✅ Test financial literacy and business calculations

❌ Don't require specific company knowledge not in material
❌ Don't include outdated business practices
❌ Don't ask about personal financial advice

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Business question based on the material]
A) [Business option A]
B) [Business option B]
C) [Business option C]
D) [Business option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Business reasoning with practical application]

Continue for all ${count} questions. Focus on business thinking and application!`;
  }

  /**
   * Arts prompt - NEW
   */
  createArtsPrompt(content, count, topicName) {
    return `You are an ARTS teacher creating ${count} educational questions for "${topicName}".

STUDY MATERIAL:
${content}

🎨 ARTS EDUCATION REQUIREMENTS:
- Focus on artistic concepts, techniques, and cultural significance
- Test understanding of artistic movements and styles
- Include questions about creative processes and interpretation
- Ensure cultural and historical accuracy
- Ask about artistic analysis and appreciation

ARTS QUESTION GUIDELINES:
✅ Test understanding of artistic techniques and styles
✅ Ask about cultural and historical context of art
✅ Include questions about artistic interpretation
✅ Focus on creative processes and artistic thinking
✅ Test knowledge of artistic movements and influences

❌ Don't require viewing specific artworks not described
❌ Don't include highly subjective aesthetic judgments
❌ Don't ask about techniques requiring visual demonstration

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Arts question based on the material]
A) [Artistic option A]
B) [Artistic option B]
C) [Artistic option C]
D) [Artistic option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Artistic explanation with cultural/technical reasoning]

Continue for all ${count} questions. Focus on artistic understanding and appreciation!`;
  }

  /**
   * Health/Medicine prompt - NEW
   */
  createHealthPrompt(content, count, topicName) {
    return `You are a HEALTH EDUCATION teacher creating ${count} educational questions for "${topicName}".

STUDY MATERIAL:
${content}

⚕️ HEALTH EDUCATION REQUIREMENTS:
- Focus on general health concepts and education
- Test understanding of body systems and health principles
- Include questions about wellness and prevention
- Ensure medical accuracy but avoid specific medical advice
- Ask about health literacy and understanding

HEALTH QUESTION GUIDELINES:
✅ Test understanding of anatomy and physiology
✅ Ask about health promotion and disease prevention
✅ Include questions about nutrition and wellness
✅ Focus on general health education
✅ Test knowledge of health systems and processes

❌ Don't provide specific medical diagnosis or treatment advice
❌ Don't include drug dosages or specific medications
❌ Don't ask about personal medical situations

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Health education question based on the material]
A) [Health option A]
B) [Health option B]
C) [Health option C]
D) [Health option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Health education explanation with scientific reasoning]

Continue for all ${count} questions. Focus on health education and literacy!`;
  }

  /**
   * General prompt - ENHANCED
   */
  createGeneralPrompt(content, count, topicName, subjectName) {
    return `You are an educator creating ${count} educational questions for "${topicName}" in ${subjectName}.

STUDY MATERIAL:
${content}

📖 GENERAL EDUCATION REQUIREMENTS:
- Focus on key concepts and understanding from the material
- Test comprehension and application of ideas
- Include questions that promote critical thinking
- Ensure accuracy and clarity
- Ask about important principles and relationships

EDUCATIONAL QUESTION GUIDELINES:
✅ Test understanding of main concepts in the material
✅ Ask about relationships between ideas
✅ Include questions that require analysis and reasoning
✅ Focus on practical application of knowledge
✅ Test comprehension and critical thinking

❌ Don't ask about information not covered in the material
❌ Don't include overly technical terms without context
❌ Don't make assumptions about prior knowledge

Create exactly ${count} multiple choice questions in this format:

QUESTION 1:
[Educational question based on the material]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Clear explanation with reasoning]

Continue for all ${count} questions. Focus on understanding and application!`;
  }

  /**
   * Create simplified prompt for basic generation
   */
  createSimplifiedPrompt(content, count, topicName) {
    return `Based on this material about "${topicName}", create ${count} basic questions:

${content.substring(0, 800)}

Each question should test basic understanding of the material.

QUESTION 1:
What does the material say about [topic]?
A) [Direct answer from material]
B) [Incorrect option]
C) [Incorrect option]
D) [Incorrect option]
CORRECT: A
EXPLANATION: This is stated in the material.

Create ${count} questions in this format.`;
  }

  /**
   * Create pattern-based prompt
   */
  createPatternPrompt(content, count, samplePattern) {
    return `Create ${count} questions similar to this successful example:

STUDY MATERIAL:
${content.substring(0, 1200)}

EXAMPLE SUCCESSFUL QUESTION:
${samplePattern.question}
A) ${samplePattern.options[0]}
B) ${samplePattern.options[1]}
C) ${samplePattern.options[2]}
D) ${samplePattern.options[3]}

Create ${count} similar questions based on the study material.`;
  }
}

module.exports = PromptGenerator;