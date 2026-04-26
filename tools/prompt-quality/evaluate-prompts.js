/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const PromptGenerator = require('../../src/server/services/prompt-generation');
const QuestionValidator = require('../../src/server/services/question-validation');
const SubjectsDbService = require('../../src/server/services/subjects-db-service');

function parseArgs(argv) {
  const args = {};
  argv.forEach((arg) => {
    if (!arg.startsWith('--')) return;
    const [k, v] = arg.replace('--', '').split('=');
    args[k] = v === undefined ? true : v;
  });
  return args;
}

function loadSyntheticFixtures() {
  const fixturePath = path.join(__dirname, 'synthetic-subject-notes.json');
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
}

function extractRealSamples(dbPath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(dbPath)) {
      resolve([]);
      return;
    }

    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (openErr) => {
      if (openErr) {
        console.warn(`⚠️ Could not open sqlite database: ${openErr.message}`);
        resolve([]);
      }
    });

    const query = `
      SELECT
        t.subject_id as subjectId,
        t.name as topicName,
        n.content as content,
        n.created_at as createdAt
      FROM notes n
      JOIN topics t ON n.topic_id = t.id
      WHERE n.content IS NOT NULL
      ORDER BY n.created_at DESC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.warn(`⚠️ Could not extract real samples: ${err.message}`);
        db.close(() => resolve([]));
        return;
      }

      const perSubject = new Map();
      for (const row of rows || []) {
        if (!row.subjectId || !row.content) continue;
        if (!perSubject.has(row.subjectId)) {
          perSubject.set(row.subjectId, []);
        }
        perSubject.get(row.subjectId).push({
          source: 'real',
          topic: row.topicName || 'Untitled Topic',
          content: row.content
        });
      }

      const sampleRows = [];
      for (const [subjectId, list] of perSubject.entries()) {
        // keep top 2 recent examples per subject to control cost
        list.slice(0, 2).forEach((item) => sampleRows.push({ subjectId, ...item }));
      }

      db.close(() => resolve(sampleRows));
    });
  });
}

function buildDataset(subjects, syntheticFixtures, realSamples) {
  const dataset = [];
  const realBySubject = new Map();
  realSamples.forEach((s) => {
    if (!realBySubject.has(s.subjectId)) realBySubject.set(s.subjectId, []);
    realBySubject.get(s.subjectId).push(s);
  });

  for (const subject of subjects) {
    const synthetic = syntheticFixtures[subject.id];
    if (synthetic) {
      dataset.push({
        subject,
        source: 'synthetic',
        topic: synthetic.topic,
        content: synthetic.content
      });
    }

    const real = realBySubject.get(subject.id) || [];
    real.forEach((item) => {
      dataset.push({
        subject,
        source: 'real',
        topic: item.topic,
        content: item.content
      });
    });
  }
  return dataset;
}

function uniqueQuestionScore(questions) {
  if (!questions.length) return 0;
  const unique = new Set(questions.map((q) => (q.question || '').trim().toLowerCase()));
  return Math.round((unique.size / questions.length) * 100);
}

function explanationScore(questions) {
  if (!questions.length) return 0;
  const good = questions.filter((q) => (q.explanation || '').trim().length >= 30).length;
  return Math.round((good / questions.length) * 100);
}

function optionQualityScore(questions) {
  if (!questions.length) return 0;
  let ok = 0;
  for (const q of questions) {
    const options = q.options || [];
    const uniqueOptions = new Set(options.map((x) => (x || '').trim().toLowerCase()));
    if (options.length === 4 && uniqueOptions.size === 4) ok += 1;
  }
  return Math.round((ok / questions.length) * 100);
}

function structuralScore(questions, requestedCount) {
  if (!requestedCount) return 0;
  return Math.min(100, Math.round((questions.length / requestedCount) * 100));
}

function questionFormScore(questions) {
  if (!questions.length) return 0;
  const good = questions.filter((q) => {
    const text = (q.question || '').trim();
    if (!text) return false;
    if (text.length < 25 || text.length > 220) return false;
    return text.includes('?');
  }).length;
  return Math.round((good / questions.length) * 100);
}

function distractorQualityScore(questions) {
  if (!questions.length) return 0;
  let good = 0;

  for (const q of questions) {
    const options = (q.options || []).map((o) => (o || '').trim());
    if (options.length !== 4) continue;

    const lengths = options.map((o) => o.length);
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);

    // Penalize if one option is dramatically longer/shorter than others.
    if (min < 4) continue;
    if (max > min * 3) continue;

    // Penalize giveaway options.
    const lower = options.map((o) => o.toLowerCase());
    const hasGiveaway = lower.some((o) =>
      o.includes('all of the above') ||
      o.includes('none of the above') ||
      o.includes('not discussed') ||
      o.includes('not covered')
    );
    if (hasGiveaway) continue;

    good += 1;
  }

  return Math.round((good / questions.length) * 100);
}

function topicAlignmentScore(questions, topic) {
  if (!questions.length) return 0;
  const tokens = (topic || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((x) => x.length > 3);
  if (!tokens.length) return 70;

  const aligned = questions.filter((q) => {
    const text = `${q.question || ''} ${q.explanation || ''}`.toLowerCase();
    return tokens.some((t) => text.includes(t));
  }).length;

  return Math.round((aligned / questions.length) * 100);
}

async function generateQuestions(provider, sample, count) {
  if (provider === 'openai') {
    const OpenAIService = require('../../src/server/services/openai-service');
    const service = new OpenAIService('pro');
    return service.generateQuestions(sample.content, count, sample.subject, sample.topic);
  }
  const SimplifiedOllamaService = require('../../src/server/services/ollama-simplified');
  const service = new SimplifiedOllamaService();
  return service.generateQuestions(sample.content, count, sample.subject, sample.topic);
}

function scoreSample(questions, requestedCount, subject, topic) {
  const validator = new QuestionValidator();
  const structural = structuralScore(questions, requestedCount);
  const options = optionQualityScore(questions);
  const unique = uniqueQuestionScore(questions);
  const explain = explanationScore(questions);
  const questionForm = questionFormScore(questions);
  const distractors = distractorQualityScore(questions);
  const alignment = topicAlignmentScore(questions, topic);

  // Validator pass rate by subject-specific rules already implemented in codebase
  return validator.validateQuestions(questions, subject).then((valid) => {
    const validation = structural > 0 ? Math.round((valid.length / Math.max(questions.length, 1)) * 100) : 0;
    const total = Math.round(
      (structural * 0.15) +
      (options * 0.12) +
      (unique * 0.12) +
      (explain * 0.16) +
      (validation * 0.15) +
      (questionForm * 0.1) +
      (distractors * 0.1) +
      (alignment * 0.1)
    );
    return {
      total,
      breakdown: { structural, options, unique, explain, validation, questionForm, distractors, alignment },
      validCount: valid.length
    };
  });
}

function printSummary(results) {
  const bySubject = new Map();
  for (const r of results) {
    if (!bySubject.has(r.subjectId)) bySubject.set(r.subjectId, []);
    bySubject.get(r.subjectId).push(r);
  }

  console.log('\n=== Prompt Quality Summary ===');
  for (const [subjectId, items] of bySubject.entries()) {
    const avg = Math.round(items.reduce((sum, x) => sum + x.score.total, 0) / items.length);
    const realCount = items.filter((x) => x.source === 'real').length;
    const synCount = items.filter((x) => x.source === 'synthetic').length;
    console.log(`${subjectId.padEnd(18)} score=${String(avg).padStart(3)} | samples real=${realCount}, synthetic=${synCount}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const provider = args.provider || 'openai';
  const count = Number(args.count || 5);
  const dryRun = Boolean(args['dry-run']);
  const outPath = path.join(__dirname, `prompt-eval-${provider}.json`);
  const dbPath = args.db || path.join(__dirname, '../../src/data/study_ai_simplified.db');

  const subjectService = new SubjectsDbService(null);
  const subjects = subjectService.FIXED_SUBJECTS;
  const syntheticFixtures = loadSyntheticFixtures();
  const realSamples = await extractRealSamples(dbPath);
  const dataset = buildDataset(subjects, syntheticFixtures, realSamples);

  if (!dataset.length) {
    console.error('No dataset available to evaluate.');
    process.exit(1);
  }

  console.log(`Provider: ${provider}`);
  console.log(`Requested questions per sample: ${count}`);
  console.log(`Dataset size: ${dataset.length} (real=${realSamples.length}, synthetic=${dataset.length - realSamples.length})`);
  console.log(`DB path checked: ${dbPath}`);

  const promptGenerator = new PromptGenerator();
  const results = [];

  for (const sample of dataset) {
    try {
      const promptPreview = promptGenerator.createSubjectPrompt(
        sample.content,
        count,
        sample.subject,
        sample.topic,
        Array(count).fill('multiple_choice')
      );

      if (dryRun) {
        results.push({
          subjectId: sample.subject.id,
          subjectName: sample.subject.name,
          source: sample.source,
          topic: sample.topic,
          promptPreview: promptPreview.substring(0, 600)
        });
        continue;
      }

      const questions = await generateQuestions(provider, sample, count);
      const score = await scoreSample(questions, count, sample.subject, sample.topic);
      results.push({
        subjectId: sample.subject.id,
        subjectName: sample.subject.name,
        source: sample.source,
        topic: sample.topic,
        generatedCount: questions.length,
        score,
        sampleQuestions: questions.slice(0, 2)
      });

      console.log(`✓ ${sample.subject.id} | ${sample.source} | generated=${questions.length} | score=${score.total}`);
    } catch (err) {
      console.warn(`✗ ${sample.subject.id} | ${sample.source} | ${err.message}`);
      results.push({
        subjectId: sample.subject.id,
        subjectName: sample.subject.name,
        source: sample.source,
        topic: sample.topic,
        error: err.message
      });
    }
  }

  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    provider,
    count,
    dryRun,
    dbPath,
    datasetSize: dataset.length,
    realSampleCount: realSamples.length,
    results
  }, null, 2));

  if (!dryRun) {
    printSummary(results.filter((r) => r.score));
  }

  console.log(`\nSaved report: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
