// src/server/services/ai/prompts/index.js
// Domain-specific prompt generators for different subjects

class DomainPromptGenerator {
  constructor() {
    this.promptGenerators = {
      mathematics: new MathematicsPrompts(),
      computing: new ComputingPrompts(),
      physics: new PhysicsPrompts(),
      chemistry: new ChemistryPrompts(),
      literature: new LiteraturePrompts(),
      history: new HistoryPrompts(),
      biology: new BiologyPrompts(),
      general: new GeneralPrompts()
    };
  }

  getPromptGenerator(domain) {
    return this.promptGenerators[domain] || this.promptGenerators.general;
  }

  createScopedPrompt(content, count, difficulty, contentScope) {
    const domain = contentScope.subjectDomain || 'general';
    const generator = this.getPromptGenerator(domain);
    return generator.createPrompt(content, count, difficulty, contentScope);
  }
}

// Mathematics Prompts - Strict computational focus
class MathematicsPrompts {
  createPrompt(content, count, difficulty, contentScope) {
    const { educationalLevel, operationsShown, numberRange } = contentScope;
    
    return `You are a mathematics teacher creating computational practice questions for ${educationalLevel} students.

🧮 STRICT MATHEMATICS CONSTRAINTS:
- Educational Level: ${educationalLevel}
- ONLY Allowed Operations: ${operationsShown.join(', ')}
- Number Range: ${numberRange}
- VERIFY ALL ARITHMETIC IS 100% CORRECT

STUDY MATERIAL (Your ONLY source):
${content.substring(0, 2000)}

CRITICAL MATH RULES:
❌ DO NOT create questions with incorrect arithmetic (like 7+9=18)
❌ DO NOT use operations not shown in the material
❌ DO NOT exceed the number complexity demonstrated
❌ DO NOT create word problems unless examples are provided

✅ CREATE computational questions that test mathematical procedures
✅ USE only numbers and operations from the material's scope
✅ DOUBLE-CHECK all arithmetic before providing answers
✅ FOCUS on calculations matching the material's examples

${this.getMathLevelInstructions(educationalLevel, difficulty)}

Create exactly ${count} multiple choice questions:

QUESTION 1:
[Mathematical computation question using ONLY material scope]
A) [Correct numerical answer]
B) [Incorrect numerical answer]
C) [Incorrect numerical answer]
D) [Incorrect numerical answer]
CORRECT: [A/B/C/D]
EXPLANATION: [Step-by-step mathematical reasoning]

Continue for ${count} questions total.`;
  }

  getMathLevelInstructions(level, difficulty) {
    const instructions = {
      elementary: {
        easy: 'Use single-digit numbers (1-9), basic addition/subtraction only',
        medium: 'Use numbers up to 20, may include simple patterns',
        hard: 'Use numbers up to 50, multi-step within single operations'
      },
      middle_school: {
        easy: 'Basic operations with double-digit numbers',
        medium: 'Multi-step problems, fractions/decimals if shown in material',
        hard: 'Complex word problems using demonstrated operations'
      },
      high_school: {
        easy: 'Algebraic expressions, basic equations',
        medium: 'Multi-step equations, function evaluation',
        hard: 'Complex algebraic manipulation within material scope'
      }
    };

    return instructions[level]?.[difficulty] || instructions.middle_school.medium;
  }
}

// Literature Prompts - Creative and analytical
class LiteraturePrompts {
  createPrompt(content, count, difficulty, contentScope) {
    const { educationalLevel, conceptsTaught } = contentScope;
    
    return `You are an English literature teacher creating analytical questions for ${educationalLevel} students.

📚 LITERATURE CONSTRAINTS:
- Educational Level: ${educationalLevel}
- Literary Focus: ${conceptsTaught.join(', ')}
- Text Type: ${this.identifyTextType(content)}

STUDY MATERIAL:
${content.substring(0, 2000)}

CREATIVE LITERATURE RULES:
❌ DO NOT ask plot summary questions ("What happens in Chapter 3?")
❌ DO NOT create questions answerable without reading the text
❌ DO NOT ask about characters not mentioned in the provided text

✅ CREATE analytical questions about themes, character development, and literary devices
✅ FOCUS on textual evidence and literary interpretation
✅ ASK about specific quotes, imagery, and author's craft
✅ REQUIRE critical thinking about literature

${this.getLiteratureDifficultyInstructions(educationalLevel, difficulty)}

Create exactly ${count} multiple choice questions:

QUESTION 1:
[Analytical literature question requiring textual evidence]
A) [Literary analysis answer]
B) [Literary analysis answer]
C) [Literary analysis answer]
D) [Literary analysis answer]
CORRECT: [A/B/C/D]
EXPLANATION: [Literary analysis with textual evidence]

Continue for ${count} questions total.`;
  }

  identifyTextType(content) {
    if (/\bShakespeare\b|\bthee\b|\bthou\b/.test(content)) return 'Shakespearean text';
    if (/\bDickens\b|nineteenth century/.test(content)) return 'Victorian literature';
    if (/stanza|verse|rhyme/.test(content)) return 'Poetry';
    if (/chapter|novel/.test(content)) return 'Novel';
    return 'Literary text';
  }

  getLiteratureDifficultyInstructions(level, difficulty) {
    const instructions = {
      middle_school: {
        easy: 'Focus on character traits and basic plot elements',
        medium: 'Include theme identification and simple literary devices',
        hard: 'Analyze character development and author\'s purpose'
      },
      high_school: {
        easy: 'Character motivation and basic theme analysis',
        medium: 'Literary device analysis and thematic connections',
        hard: 'Complex symbolism, irony, and critical interpretation'
      },
      college: {
        easy: 'Textual analysis and interpretation',
        medium: 'Critical theory application and complex themes',
        hard: 'Advanced literary criticism and contextual analysis'
      }
    };

    return instructions[level]?.[difficulty] || instructions.high_school.medium;
  }
}

// Computing/Computer Science Prompts
class ComputingPrompts {
  createPrompt(content, count, difficulty, contentScope) {
    const { educationalLevel, conceptsTaught } = contentScope;
    
    return `You are a computer science instructor creating programming questions for ${educationalLevel} students.

💻 COMPUTING CONSTRAINTS:
- Educational Level: ${educationalLevel}
- Programming Concepts: ${conceptsTaught.join(', ')}
- Focus: Code analysis, algorithms, computational thinking

STUDY MATERIAL:
${content.substring(0, 2000)}

STRICT COMPUTING RULES:
❌ DO NOT use programming languages not mentioned in material
❌ DO NOT introduce concepts beyond material scope
❌ DO NOT create syntax questions without code examples

✅ CREATE questions about code logic and computational thinking
✅ FOCUS on algorithms and problem-solving from the material
✅ USE programming concepts explicitly covered
✅ TEST understanding of computational processes shown

Create exactly ${count} multiple choice questions about the code/concepts in the material.`;
  }
}

// Chemistry Prompts
class ChemistryPrompts {
  createPrompt(content, count, difficulty, contentScope) {
    const { educationalLevel, conceptsTaught } = contentScope;
    
    return `You are a chemistry teacher creating chemical reasoning questions for ${educationalLevel} students.

🧪 CHEMISTRY CONSTRAINTS:
- Educational Level: ${educationalLevel}
- Chemistry Concepts: ${conceptsTaught.join(', ')}
- Focus: Chemical reactions, properties, calculations

STUDY MATERIAL:
${content.substring(0, 2000)}

STRICT CHEMISTRY RULES:
❌ DO NOT use chemical formulas not mentioned in material
❌ DO NOT create reaction equations without examples
❌ DO NOT require periodic table data not provided

✅ CREATE questions about chemical processes from the material
✅ USE only chemical concepts explicitly covered
✅ FOCUS on chemical reasoning shown in examples
✅ INCLUDE calculations if examples are provided

Create exactly ${count} multiple choice questions about the chemistry content provided.`;
  }
}

// Physics Prompts
class PhysicsPrompts {
  createPrompt(content, count, difficulty, contentScope) {
    const { educationalLevel, conceptsTaught } = contentScope;
    
    return `You are a physics teacher creating problem-solving questions for ${educationalLevel} students.

⚡ PHYSICS CONSTRAINTS:
- Educational Level: ${educationalLevel}
- Physics Concepts: ${conceptsTaught.join(', ')}
- Focus: Physical phenomena, calculations from material

STUDY MATERIAL:
${content.substring(0, 2000)}

STRICT PHYSICS RULES:
❌ DO NOT use formulas not provided in the material
❌ DO NOT require constants not given
❌ DO NOT exceed mathematical complexity of material

✅ CREATE questions about physical processes shown
✅ USE only physics concepts explicitly covered
✅ INCLUDE calculations if formulas are provided
✅ FOCUS on conceptual understanding from material

Create exactly ${count} multiple choice questions about the physics content provided.`;
  }
}

// History Prompts
class HistoryPrompts {
  createPrompt(content, count, difficulty, contentScope) {
    const { educationalLevel, conceptsTaught } = contentScope;
    
    return `You are a history teacher creating analytical questions for ${educationalLevel} students.

🏛️ HISTORY CONSTRAINTS:
- Educational Level: ${educationalLevel}
- Historical Focus: ${conceptsTaught.join(', ')}
- Period: ${this.identifyHistoricalPeriod(content)}

STUDY MATERIAL:
${content.substring(0, 2000)}

STRICT HISTORY RULES:
❌ DO NOT ask for dates not mentioned in material
❌ DO NOT require outside historical knowledge
❌ DO NOT create questions about events not covered

✅ CREATE questions about historical analysis from the material
✅ FOCUS on causation and significance shown
✅ USE specific evidence from provided content
✅ TEST historical reasoning about covered events

Create exactly ${count} multiple choice questions about the historical content provided.`;
  }

  identifyHistoricalPeriod(content) {
    if (/world war|1914|1939/.test(content.toLowerCase())) return 'World Wars era';
    if (/revolution|1776|1789/.test(content)) return 'Revolutionary period';
    if (/medieval|middle ages/.test(content.toLowerCase())) return 'Medieval period';
    return 'Historical period covered in material';
  }
}

// Biology Prompts
class BiologyPrompts {
  createPrompt(content, count, difficulty, contentScope) {
    return `You are a biology teacher creating life science questions for ${contentScope.educationalLevel} students.

🧬 BIOLOGY CONSTRAINTS:
- Focus on biological processes from the material
- Test understanding of organism functions shown
- Use only biological concepts explicitly covered

STUDY MATERIAL:
${content.substring(0, 2000)}

Create exactly ${count} multiple choice questions about the biological processes and concepts in the provided material.`;
  }
}

// General Academic Prompts
class GeneralPrompts {
  createPrompt(content, count, difficulty, contentScope) {
    const { educationalLevel, conceptsTaught } = contentScope;
    
    return `You are an educator creating academic questions for ${educationalLevel} students.

📖 ACADEMIC CONSTRAINTS:
- Educational Level: ${educationalLevel}
- Subject Concepts: ${conceptsTaught.join(', ')}
- Focus: Understanding of material content

STUDY MATERIAL:
${content.substring(0, 2000)}

ACADEMIC RULES:
- Create questions that test understanding of key concepts from the material
- Focus on analysis and application of provided content
- Ensure questions match the educational level shown
- Use vocabulary and complexity from the source material

Create exactly ${count} multiple choice questions testing understanding of the provided material.`;
  }
}

module.exports = DomainPromptGenerator;