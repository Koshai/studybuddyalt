// src/server/services/prompt-generation.js
// Handles all prompt generation for different subjects

class PromptGenerator {
  constructor() {
    console.log('📝 PromptGenerator initialized');
  }

  /**
   * Main entry point for creating subject-specific prompts with question type distribution
   */
  createSubjectPrompt(content, count, subjectCategory, topicName, questionTypeSequence = null) {
    const subjectId = subjectCategory.id;
    const baseContent = this.prepareContent(content, 2600);
    
    // If no sequence provided, default to all MCQ (backwards compatibility)
    if (!questionTypeSequence) {
      questionTypeSequence = Array(count).fill('multiple_choice');
    }
    
    switch (subjectId) {
      case 'mathematics':
        return this.createMathPrompt(baseContent, count, topicName, questionTypeSequence);
        
      case 'natural-sciences':
        return this.createSciencePrompt(baseContent, count, topicName, questionTypeSequence);
        
      case 'literature':
        return this.createLiteraturePrompt(baseContent, count, topicName, questionTypeSequence);
        
      case 'history':
        return this.createHistoryPrompt(baseContent, count, topicName, questionTypeSequence);
        
      case 'computer-science':
        return this.createComputerSciencePrompt(baseContent, count, topicName, questionTypeSequence);
        
      case 'languages':
        return this.createLanguagePrompt(baseContent, count, topicName, questionTypeSequence);
        
      case 'business':
        return this.createBusinessPrompt(baseContent, count, topicName, questionTypeSequence);
        
      case 'arts':
        return this.createArtsPrompt(baseContent, count, topicName, questionTypeSequence);
        
      case 'health-medicine':
        return this.createHealthPrompt(baseContent, count, topicName, questionTypeSequence);
        
      case 'other':
      default:
        return this.createGeneralPrompt(baseContent, count, topicName, subjectCategory.name, questionTypeSequence);
    }
  }

  prepareContent(content, maxLength = 2600) {
    if (!content || typeof content !== 'string') return '';
    return content
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, maxLength);
  }

  buildUniversalRules(count, topicName, questionTypeSequence) {
    const allMcq = questionTypeSequence.every(type => type === 'multiple_choice');

    return `You are an expert teacher writing high-quality assessment items.

TOPIC: ${topicName}
QUESTION COUNT: ${count}

GLOBAL QUALITY RULES:
- Every question must be answerable using ONLY the provided study material.
- Avoid vague wording; write one clear, unambiguous best answer.
- Test understanding and application, not just copied phrases.
- Include plausible distractors that are wrong for clear reasons.
- Do NOT repeat near-duplicate questions.
- Do NOT use "all of the above" or "none of the above".
- Every question sentence must end with a question mark.
- Keep question text concise but specific.
- Explanation must justify the correct answer and briefly explain why alternatives are less accurate.
- If the material is missing enough detail for a high-quality question, skip that idea.
- Never use meta references such as "the passage", "the text", "the material", "the notes", or "the book" in the question stem.
- Write stems as direct domain questions (for example, ask about the concept itself, not where it was mentioned).

OUTPUT RULES:
- Return exactly ${count} questions in sequence.
- Use this exact numbering style: QUESTION 1:, QUESTION 2:, etc.
${allMcq ? '- All questions must be MULTIPLE CHOICE with exactly four options (A-D).' : '- Follow requested question types exactly.'}
- Do not add any intro or outro text.`;
  }

  getMcqFormatBlock() {
    return `FORMAT FOR MULTIPLE CHOICE:
QUESTION [N]:
[Question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [Why correct answer is best, citing concept from material]`;
  }

  /**
   * Math prompt (keep existing one - it's working)
   */
  createMathPrompt(content, count, topicName, questionTypeSequence) {
    return `${this.buildUniversalRules(count, topicName, questionTypeSequence)}

SUBJECT: MATHEMATICS
MATHEMATICS REQUIREMENTS:
- Verify every numeric result before finalizing.
- Prefer multi-step reasoning, formula use, and concept selection.
- Include units only when relevant and consistent.
- Avoid trivial arithmetic-only questions unless the material emphasizes it.
- If formulas appear in source material, test correct formula selection and interpretation.
- Use explicit numerical consistency checks before writing CORRECT.
- Avoid distractors that are obviously impossible values.

STUDY MATERIAL:
${content}

${this.getMcqFormatBlock()}`;
  }

  /**
   * Science prompt - ENHANCED
   */
  createSciencePrompt(content, count, topicName, questionTypeSequence) {
    return `${this.buildUniversalRules(count, topicName, questionTypeSequence)}

SUBJECT: NATURAL SCIENCES
SCIENCE REQUIREMENTS:
- Focus on mechanisms, cause-and-effect, and process understanding.
- Test reasoning with evidence from the material.
- Use precise scientific terminology as presented in the text.
- Avoid trick questions and unsupported hypotheticals.

STUDY MATERIAL:
${content}

${this.getMcqFormatBlock()}`;
  }

  /**
   * Literature prompt - ENHANCED for analysis with mixed question types
   */
  createLiteraturePrompt(content, count, topicName, questionTypeSequence) {
    const mcqCount = questionTypeSequence.filter(type => type === 'multiple_choice').length;
    const textCount = questionTypeSequence.filter(type => type === 'text_based').length;
    
    return `${this.buildUniversalRules(count, topicName, questionTypeSequence)}

SUBJECT: LITERATURE
Distribution: ${mcqCount} multiple choice, ${textCount} text-based questions.
LITERATURE REQUIREMENTS:
- Prioritize interpretation, theme, tone, characterization, and author choices.
- Favor evidence-based reading over plot trivia.
- Ask "why/how" questions that require textual reasoning.
- For text-based items, require quoted or paraphrased textual evidence in the expected answer.

STUDY MATERIAL:
${content}

Generate questions in this exact sequence: ${questionTypeSequence.join(', ')}

${this.getMcqFormatBlock()}

FORMAT FOR TEXT-BASED:
QUESTION [N]:
[Open-ended analytical question requiring explanation]
TYPE: TEXT_BASED
ANSWER: [Expected answer showing depth of analysis and textual evidence; accept varied interpretations only if evidence-based]
EXPLANATION: [What you're looking for in student responses]

Create exactly ${count} questions following the sequence.`;
  }

  /**
   * History prompt - ENHANCED
   */
  createHistoryPrompt(content, count, topicName, questionTypeSequence) {
    return `${this.buildUniversalRules(count, topicName, questionTypeSequence)}

SUBJECT: HISTORY
HISTORY REQUIREMENTS:
- Emphasize causation, consequence, continuity, and change over time.
- Prioritize context and significance over date memorization.
- Include perspective-based reasoning when supported by source text.

STUDY MATERIAL:
${content}

${this.getMcqFormatBlock()}`;
  }

  /**
   * Computer Science prompt - NEW
   */
  createComputerSciencePrompt(content, count, topicName, questionTypeSequence) {
    return `${this.buildUniversalRules(count, topicName, questionTypeSequence)}

SUBJECT: COMPUTER SCIENCE
COMPUTER SCIENCE REQUIREMENTS:
- Focus on logic, algorithmic thinking, and correct interpretation of code concepts.
- Keep examples language-consistent with provided material.
- Prefer conceptual debugging and reasoning over obscure syntax traps.
- Ensure technical correctness in all options and explanations.

STUDY MATERIAL:
${content}

${this.getMcqFormatBlock()}`;
  }

  /**
   * Language Learning prompt - NEW
   */
  createLanguagePrompt(content, count, topicName, questionTypeSequence) {
    return `${this.buildUniversalRules(count, topicName, questionTypeSequence)}

SUBJECT: LANGUAGES
LANGUAGE REQUIREMENTS:
- Focus on meaning, grammar, usage, and context.
- Use examples anchored in the provided text.
- Ensure grammatical correctness and realistic distractors.
- Prioritize comprehension and application over isolated memorization.
- Every item must be phrased as a direct question ending in "?".
- For grammar items, include a short sentence context so choices are meaningfully comparable.
- Explanations must state the grammar/usage rule being tested.

STUDY MATERIAL:
${content}

${this.getMcqFormatBlock()}`;
  }

  /**
   * Business prompt - NEW
   */
  createBusinessPrompt(content, count, topicName, questionTypeSequence) {
    return `${this.buildUniversalRules(count, topicName, questionTypeSequence)}

SUBJECT: BUSINESS
BUSINESS REQUIREMENTS:
- Test strategic reasoning, trade-offs, and practical interpretation.
- Use scenario-style questions when possible.
- Keep assumptions realistic and directly linked to source material.
- Include concise explanations grounded in business logic.
- At least half of questions should involve a decision or trade-off.
- Distractors should represent common but flawed business reasoning.

STUDY MATERIAL:
${content}

${this.getMcqFormatBlock()}`;
  }

  /**
   * Arts prompt - NEW
   */
  createArtsPrompt(content, count, topicName, questionTypeSequence) {
    return `${this.buildUniversalRules(count, topicName, questionTypeSequence)}

SUBJECT: ARTS
ARTS REQUIREMENTS:
- Emphasize interpretation, technique, style, and cultural context.
- Ask evidence-based interpretation questions when possible.
- Avoid purely subjective preference questions.
- Keep references limited to what is present in source material.

STUDY MATERIAL:
${content}

${this.getMcqFormatBlock()}`;
  }

  /**
   * Health/Medicine prompt - NEW
   */
  createHealthPrompt(content, count, topicName, questionTypeSequence) {
    return `${this.buildUniversalRules(count, topicName, questionTypeSequence)}

SUBJECT: HEALTH AND MEDICINE
HEALTH REQUIREMENTS:
- Prioritize medically accurate, general educational understanding.
- Focus on systems, mechanisms, prevention, and safe health literacy.
- Avoid diagnosis/treatment advice beyond educational scope.
- Use precise and non-alarmist language.
- Explanations must include mechanism or prevention logic, not just factual restatement.
- Avoid absolute words like "always" or "never" unless explicitly supported by the material.

STUDY MATERIAL:
${content}

${this.getMcqFormatBlock()}`;
  }

  /**
   * General prompt - ENHANCED
   */
  createGeneralPrompt(content, count, topicName, subjectName, questionTypeSequence) {
    return `${this.buildUniversalRules(count, topicName, questionTypeSequence)}

SUBJECT: ${subjectName}
GENERAL REQUIREMENTS:
- Target key ideas, concept relationships, and practical understanding.
- Keep wording accessible for learners.
- Prefer applied comprehension questions over pure recall.

STUDY MATERIAL:
${content}

${this.getMcqFormatBlock()}`;
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