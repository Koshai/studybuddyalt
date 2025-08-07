// verify-import.js - Verify the imported data in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyImport() {
    console.log('🔍 Verifying imported data in Supabase...');
    
    const userId = '127fa11a-442f-4180-b0c4-c5e3efacdea5';
    
    try {
        // Check user profile
        console.log('\n1️⃣ Checking user profile...');
        const { data: user, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (userError) {
            console.error('❌ User profile error:', userError);
        } else {
            console.log('✅ User profile found:', user.email);
            console.log('   - ID:', user.id);
            console.log('   - Created:', user.created_at);
        }
        
        // Check topics
        console.log('\n2️⃣ Checking topics...');
        const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select('*')
            .eq('user_id', userId);
        
        if (topicsError) {
            console.error('❌ Topics error:', topicsError);
        } else {
            console.log(`✅ Found ${topics.length} topics:`);
            topics.forEach(topic => {
                console.log(`   - ${topic.name} (${topic.subject}) - ID: ${topic.id}`);
            });
        }
        
        // Check notes
        console.log('\n3️⃣ Checking notes...');
        const { data: notes, error: notesError } = await supabase
            .from('notes')
            .select('*, topics(name)')
            .eq('user_id', userId);
        
        if (notesError) {
            console.error('❌ Notes error:', notesError);
        } else {
            console.log(`✅ Found ${notes.length} notes:`);
            notes.forEach(note => {
                console.log(`   - "${note.title}" in ${note.topics?.name || 'Unknown Topic'}`);
                console.log(`     Content length: ${note.content?.length || 0} chars`);
            });
        }
        
        // Check questions
        console.log('\n4️⃣ Checking questions...');
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('*, topics(name)')
            .eq('user_id', userId);
        
        if (questionsError) {
            console.error('❌ Questions error:', questionsError);
        } else {
            console.log(`✅ Found ${questions.length} questions:`);
            questions.forEach(question => {
                console.log(`   - "${question.question}" in ${question.topics?.name || 'Unknown Topic'}`);
                console.log(`     Type: ${question.type}, Difficulty: ${question.difficulty}`);
            });
        }
        
        // Check RLS policies
        console.log('\n5️⃣ Testing Row Level Security...');
        
        // Create a regular (non-service) client to test RLS
        const regularClient = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY || 'your-anon-key');
        
        try {
            const { data: rlsTest, error: rlsError } = await regularClient
                .from('topics')
                .select('*')
                .eq('user_id', userId);
            
            if (rlsError) {
                console.log('⚠️ RLS blocking access (expected without auth):', rlsError.message);
            } else {
                console.log('✅ RLS test passed, found topics:', rlsTest.length);
            }
        } catch (e) {
            console.log('⚠️ RLS test failed (expected):', e.message);
        }
        
        console.log('\n📊 Summary:');
        console.log(`- User ID: ${userId}`);
        console.log(`- Topics: ${topics?.length || 0}`);
        console.log(`- Notes: ${notes?.length || 0}`);
        console.log(`- Questions: ${questions?.length || 0}`);
        
        if (topics?.length > 0) {
            console.log('\n✅ Data is successfully stored in Supabase!');
            console.log('\n🔍 If data is not showing in the app, the issue might be:');
            console.log('1. User ID mismatch between local login and imported data');
            console.log('2. RLS policies not allowing access');
            console.log('3. Frontend not properly authenticated');
            console.log('4. API routes not properly querying Supabase');
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

verifyImport();