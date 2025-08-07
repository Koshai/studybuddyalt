// import-with-user-id.js - Re-import data with proper user_id assignment
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function importWithUserId() {
    console.log('📤 Re-importing user data with proper user_id assignment...');
    
    // Read exported data
    const exportFile = 'user-data-export-127fa11a-442f-4180-b0c4-c5e3efacdea5.json';
    
    if (!fs.existsSync(exportFile)) {
        console.error(`❌ Export file not found: ${exportFile}`);
        console.log('Run: node export-user-data.js first');
        process.exit(1);
    }
    
    const userData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    console.log(`📊 Loaded data for user: ${userData.user_id}`);
    
    try {
        // First, check if user exists
        console.log('\n1️⃣ Checking user profile...');
        const { data: existingUser } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userData.user_id)
            .single();
        
        if (!existingUser) {
            console.log('❌ User profile not found in Supabase');
            console.log('Make sure you have logged into the Railway app first to create the user profile');
            return;
        }
        
        console.log(`✅ User profile exists: ${existingUser.email}`);
        
        // Clear existing data to avoid duplicates
        console.log('\n2️⃣ Clearing existing imported data...');
        
        // Delete in reverse order due to foreign key constraints
        await supabase.from('questions').delete().eq('user_id', userData.user_id);
        await supabase.from('notes').delete().eq('user_id', userData.user_id);  
        await supabase.from('topics').delete().eq('user_id', userData.user_id);
        
        console.log('✅ Cleared existing data');
        
        // Import topics (these should already have user_id)
        console.log('\n3️⃣ Importing topics...');
        if (userData.topics.length > 0) {
            const { data, error } = await supabase
                .from('topics')
                .upsert(userData.topics.map(topic => ({
                    ...topic,
                    user_id: userData.user_id // Ensure user_id is set
                })), { onConflict: 'id' });
            
            if (error) {
                console.error('❌ Error importing topics:', error);
            } else {
                console.log(`✅ Imported ${userData.topics.length} topics`);
            }
        }
        
        // Import notes with user_id
        console.log('\n4️⃣ Importing notes with user_id...');
        if (userData.notes.length > 0) {
            const notesWithUserId = userData.notes.map(note => ({
                ...note,
                user_id: userData.user_id // Add the missing user_id
            }));
            
            const { data, error } = await supabase
                .from('notes')
                .upsert(notesWithUserId, { onConflict: 'id' });
            
            if (error) {
                console.error('❌ Error importing notes:', error);
                console.error('Full error:', JSON.stringify(error, null, 2));
            } else {
                console.log(`✅ Imported ${userData.notes.length} notes`);
            }
        }
        
        // Import questions with user_id
        console.log('\n5️⃣ Importing questions with user_id...');
        if (userData.questions.length > 0) {
            const questionsWithUserId = userData.questions.map(question => ({
                ...question,
                user_id: userData.user_id // Add the missing user_id
            }));
            
            const { data, error } = await supabase
                .from('questions')
                .upsert(questionsWithUserId, { onConflict: 'id' });
            
            if (error) {
                console.error('❌ Error importing questions:', error);
                console.error('Full error:', JSON.stringify(error, null, 2));
            } else {
                console.log(`✅ Imported ${userData.questions.length} questions`);
            }
        }
        
        // Verify import worked
        console.log('\n6️⃣ Verifying import...');
        
        const { data: topics } = await supabase
            .from('topics')
            .select('*')
            .eq('user_id', userData.user_id);
            
        const { data: notes } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userData.user_id);
            
        const { data: questions } = await supabase
            .from('questions')
            .select('*')
            .eq('user_id', userData.user_id);
        
        console.log('📊 Final count:');
        console.log(`  - Topics: ${topics?.length || 0}`);
        console.log(`  - Notes: ${notes?.length || 0}`);
        console.log(`  - Questions: ${questions?.length || 0}`);
        
        if ((topics?.length || 0) > 0 && (notes?.length || 0) > 0 && (questions?.length || 0) > 0) {
            console.log('\n🎉 Import completed successfully!');
            console.log('✅ All data now has proper user_id assignments');
            console.log('\n📱 Next steps:');
            console.log('1. Go to your Railway app: https://jaquizy.com');
            console.log('2. Log in with your account');
            console.log('3. Your topics, notes, and questions should now appear!');
        } else {
            console.log('\n⚠️ Import may have failed - some data is missing');
        }
        
    } catch (error) {
        console.error('❌ Import failed:', error);
    }
}

importWithUserId();