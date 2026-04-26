/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Provide SUPABASE_URL and SUPABASE_SERVICE_KEY (preferred).');
  process.exit(1);
}

const usingServiceRole = !!process.env.SUPABASE_SERVICE_KEY;
if (!usingServiceRole) {
  console.warn('⚠️ Running without service role key. Some checks may be limited by RLS.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const REQUIRED_TABLE_COLUMNS = {
  subjects: ['id', 'name', 'description', 'icon', 'color'],
  topics: ['id', 'user_id', 'subject_id', 'name', 'description', 'created_at'],
  notes: ['id', 'topic_id', 'content', 'file_name', 'word_count', 'created_at'],
  questions: ['id', 'topic_id', 'question', 'answer', 'type', 'options', 'correct_index', 'explanation', 'created_at'],
  practice_sessions: ['id', 'user_id', 'topic_id', 'questions_count', 'correct_answers', 'accuracy_rate', 'session_date'],
  user_answers: ['id', 'question_id', 'practice_session_id', 'user_answer', 'is_correct', 'time_taken', 'created_at'],
  files: ['id', 'user_id', 'topic_id', 'file_name', 'word_count', 'created_at'],
  user_profiles: ['id', 'email'],
  user_usage: ['user_id', 'month_year'],
  flashcard_sets: ['id', 'user_id', 'name', 'created_at', 'updated_at'],
  flashcards: ['id', 'set_id', 'front', 'back', 'created_at', 'updated_at'],
  flashcard_progress: ['id', 'user_id', 'flashcard_id', 'total_attempts', 'correct_attempts', 'correct_streak', 'updated_at'],
  flashcard_study_sessions: ['id', 'user_id', 'set_id', 'study_mode', 'cards_studied', 'cards_correct', 'duration_seconds', 'session_date'],
  feedback: ['id', 'type', 'subject', 'message', 'status', 'priority', 'created_at', 'updated_at']
};

async function checkTableColumns(tableName, columns) {
  const query = columns.join(',');
  const { error } = await supabase.from(tableName).select(query).limit(1);
  if (!error) return { ok: true };

  // Distinguish table missing vs column missing vs RLS.
  const msg = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  if (msg.includes('column') || msg.includes('does not exist')) {
    return { ok: false, reason: `Missing column(s): ${error.message}` };
  }
  if (msg.includes('relation') || msg.includes('schema cache')) {
    return { ok: false, reason: `Missing table or PostgREST cache issue: ${error.message}` };
  }
  if (error.code === 'PGRST301' || msg.includes('permission') || msg.includes('rls')) {
    return { ok: false, reason: `Permission/RLS prevented validation: ${error.message}` };
  }
  return { ok: false, reason: error.message || 'Unknown validation error' };
}

async function checkStorageBucket(bucketName) {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (!error && data) return { ok: true };

    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('not found')) {
      return { ok: false, reason: `Bucket "${bucketName}" not found` };
    }
    return { ok: false, reason: error?.message || 'Unknown storage error' };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

async function main() {
  const failures = [];

  console.log('🔎 Validating Supabase compatibility against backend logic...');
  for (const [table, cols] of Object.entries(REQUIRED_TABLE_COLUMNS)) {
    // eslint-disable-next-line no-await-in-loop
    const result = await checkTableColumns(table, cols);
    if (result.ok) {
      console.log(`✅ ${table} columns OK`);
    } else {
      console.log(`❌ ${table} -> ${result.reason}`);
      failures.push({ type: 'table', table, reason: result.reason });
    }
  }

  const bucketCheck = await checkStorageBucket('study-materials');
  if (bucketCheck.ok) {
    console.log('✅ storage bucket "study-materials" OK');
  } else {
    console.log(`❌ storage bucket "study-materials" -> ${bucketCheck.reason}`);
    failures.push({ type: 'storage', table: 'study-materials', reason: bucketCheck.reason });
  }

  if (failures.length === 0) {
    console.log('\n🎉 Supabase schema appears compatible with current backend logic.');
    process.exit(0);
  }

  console.log('\n⚠️ Compatibility issues detected:');
  failures.forEach((f) => {
    console.log(`- [${f.type}] ${f.table}: ${f.reason}`);
  });
  process.exit(2);
}

main().catch((err) => {
  console.error('Validation failed:', err.message);
  process.exit(1);
});
