/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LEGACY_MODULE_NAMES = [
  'ai-service-selector',
  'hybrid-storage-service',
  'usage-service-hybrid',
  'database-simplified-backup'
];

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'archive'
]);

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.db', '.ico'
]);

function isLegacyFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return LEGACY_MODULE_NAMES.some((name) => normalized.endsWith(`/src/server/services/${name}.js`));
}

function shouldScanFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) return false;
  if (IGNORED_EXTENSIONS.has(ext)) return false;
  return ['.js', '.mjs', '.cjs', '.ts', '.tsx'].includes(ext);
}

function walk(dirPath, collected = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walk(fullPath, collected);
      }
      continue;
    }
    if (shouldScanFile(fullPath)) {
      collected.push(fullPath);
    }
  }
  return collected;
}

function findViolations(filePath) {
  if (isLegacyFile(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];

  const legacyPattern = new RegExp(
    `(?:require\\(|from\\s+)['"][^'"]*(${LEGACY_MODULE_NAMES.join('|')})(?:\\.js)?['"]`,
    'i'
  );

  lines.forEach((line, index) => {
    if (legacyPattern.test(line)) {
      violations.push({
        line: index + 1,
        content: line.trim()
      });
    }
  });

  return violations;
}

function main() {
  const allFiles = walk(ROOT);
  const problems = [];

  for (const filePath of allFiles) {
    const violations = findViolations(filePath);
    if (violations.length > 0) {
      problems.push({ filePath, violations });
    }
  }

  if (problems.length === 0) {
    console.log('✅ No legacy-module imports found.');
    process.exit(0);
  }

  console.error('❌ Legacy-module imports detected:');
  for (const problem of problems) {
    const relative = path.relative(ROOT, problem.filePath).replace(/\\/g, '/');
    for (const violation of problem.violations) {
      console.error(`- ${relative}:${violation.line} -> ${violation.content}`);
    }
  }

  process.exit(1);
}

main();
