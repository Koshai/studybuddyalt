const PromptGenerator = require('../src/server/services/prompt-generation');
const QuestionValidator = require('../src/server/services/question-validation');

describe('Prompt generation baseline tests', () => {
  test('includes anti-meta stem rule in generated prompts', () => {
    const generator = new PromptGenerator();
    const prompt = generator.createSubjectPrompt(
      'Photosynthesis converts light energy to chemical energy.',
      3,
      { id: 'natural-sciences', name: 'Natural Sciences' },
      'Photosynthesis',
      ['multiple_choice', 'multiple_choice', 'multiple_choice']
    );

    expect(prompt).toContain('Never use meta references');
    expect(prompt).toContain('Return exactly 3 questions');
  });

  test('rewrites meta-reference stems before validation', async () => {
    const validator = new QuestionValidator();
    const question = {
      question: 'According to the text, what is photosynthesis?',
      answer: 'Process converting light to chemical energy',
      type: 'multiple_choice',
      options: [
        'Process converting light to chemical energy',
        'A type of respiration',
        'A kind of ecosystem',
        'A mineral cycle'
      ],
      correctIndex: 0,
      explanation: 'Photosynthesis converts light energy into chemical energy in glucose.'
    };

    const isValid = await validator.validateSingleQuestion(question, { id: 'natural-sciences' });
    expect(isValid).toBe(true);
    expect(question.question.toLowerCase()).not.toContain('according to the text');
    expect(question.question.endsWith('?')).toBe(true);
  });
});
