/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const localDbPath = path.join(__dirname, '..', 'src', 'data', 'study_ai_simplified.db');
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const tablesToCompare = ['topics', 'notes', 'questions', 'practice_sessions', 'user_answers'];

function getLocalCounts() {
  if (!fs.existsSync(localDbPath)) {
    throw new Error(`Local DB not found: ${localDbPath}`);
  }

  const db = new Database(localDbPath, { readonly: true });
  const counts = {};
  try {
    for (const table of tablesToCompare) {
      try {
        const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        counts[table] = row.count;
      } catch (err) {
        counts[table] = null; // table missing locally
      }
    }
  } finally {
    db.close();
  }
  return counts;
}

async function getSupabaseCounts() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Need Supabase URL and key (SUPABASE_URL/SUPABASE_SERVICE_KEY, or VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY)');
  }

  const usingServiceRole = !!process.env.SUPABASE_SERVICE_KEY;
  if (!usingServiceRole) {
    console.log('⚠️ Running in anon-key mode. Counts may be incomplete due to RLS.');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const counts = {};

  for (const table of tablesToCompare) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        counts[table] = null; // missing table or access issue
      } else {
        counts[table] = count ?? 0;
      }
    } catch (err) {
      counts[table] = null;
    }
  }

  return counts;
}

function printComparison(localCounts, supabaseCounts) {
  console.log('Local DB:', localDbPath);
  console.log('\nTable comparison (local vs supabase):');
  for (const table of tablesToCompare) {
    const local = localCounts[table];
    const remote = supabaseCounts[table];
    const status =
      local === null || remote === null ? '⚠️ unavailable' :
      local === remote ? '✅ match' : '❌ mismatch';
    console.log(`- ${table}: ${String(local)} vs ${String(remote)}  ${status}`);
  }
}

async function main() {
  const localCounts = getLocalCounts();
  const supabaseCounts = await getSupabaseCounts();
  printComparison(localCounts, supabaseCounts);
}

main().catch((err) => {
  console.error('Comparison failed:', err.message);
  process.exit(1);
});
