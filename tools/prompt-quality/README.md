# Prompt Quality Evaluation Workflow

This folder contains tools to evaluate question quality using:

- Synthetic benchmark notes (consistent baseline across subjects)
- Real notes from local SQLite database (if available)

## Files

- `synthetic-subject-notes.json` - baseline notes for each fixed subject
- `evaluate-prompts.js` - evaluation runner

## Quick Start

Dry run (build prompt previews only):

```bash
node tools/prompt-quality/evaluate-prompts.js --provider=openai --count=5 --dry-run
```

Run with generation:

```bash
node tools/prompt-quality/evaluate-prompts.js --provider=openai --count=5
```

Use local Ollama:

```bash
node tools/prompt-quality/evaluate-prompts.js --provider=ollama --count=5
```

Specify SQLite path (optional):

```bash
node tools/prompt-quality/evaluate-prompts.js --provider=openai --db=src/data/study_ai_simplified.db
```

## Output

Each run writes a report JSON:

- `tools/prompt-quality/prompt-eval-openai.json`
- `tools/prompt-quality/prompt-eval-ollama.json`

The report includes:

- subject, topic, source (`real` or `synthetic`)
- generated count
- quality score and breakdown
- sample generated questions

## Suggested Iteration Loop

1. Run evaluator (`openai`, then `ollama` if needed)
2. Identify lowest subject scores
3. Update subject prompt in `src/server/services/prompt-generation.js`
4. Re-run evaluator
5. Compare before/after report
