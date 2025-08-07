// import-to-supabase.js - Import user data to Supabase
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

async function importUserData() {
    console.log('📤 Importing user data to Supabase...');
    
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
        // First, create/ensure user exists in user_profiles
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
        
        // Import topics
        console.log('\n2️⃣ Importing topics...');
        if (userData.topics.length > 0) {
            const { data, error } = await supabase
                .from('topics')
                .upsert(userData.topics, { onConflict: 'id' });
            
            if (error) {
                console.error('❌ Error importing topics:', error);
            } else {
                console.log(`✅ Imported ${userData.topics.length} topics`);
            }
        }
        
        // Import notes
        console.log('\n3️⃣ Importing notes...');
        if (userData.notes.length > 0) {
            const { data, error } = await supabase
                .from('notes')
                .upsert(userData.notes, { onConflict: 'id' });
            
            if (error) {
                console.error('❌ Error importing notes:', error);
            } else {
                console.log(`✅ Imported ${userData.notes.length} notes`);
            }
        }
        
        // Import questions
        console.log('\n4️⃣ Importing questions...');
        if (userData.questions.length > 0) {
            const { data, error } = await supabase
                .from('questions')
                .upsert(userData.questions, { onConflict: 'id' });
            
            if (error) {
                console.error('❌ Error importing questions:', error);
            } else {
                console.log(`✅ Imported ${userData.questions.length} questions`);
            }
        }
        
        // Import practice sessions (if any)
        if (userData.practice_sessions.length > 0) {
            console.log('\n5️⃣ Importing practice sessions...');
            const { data, error } = await supabase
                .from('practice_sessions')
                .upsert(userData.practice_sessions, { onConflict: 'id' });
            
            if (error) {
                console.error('❌ Error importing practice sessions:', error);
            } else {
                console.log(`✅ Imported ${userData.practice_sessions.length} practice sessions`);
            }
        }
        
        // Import user answers (if any)
        if (userData.user_answers.length > 0) {
            console.log('\n6️⃣ Importing user answers...');
            const { data, error } = await supabase
                .from('user_answers')
                .upsert(userData.user_answers, { onConflict: 'id' });
            
            if (error) {
                console.error('❌ Error importing user answers:', error);
            } else {
                console.log(`✅ Imported ${userData.user_answers.length} user answers`);
            }
        }
        
        // Import usage tracking
        if (userData.user_usage.length > 0) {
            console.log('\n7️⃣ Importing usage tracking...');
            const { data, error } = await supabase
                .from('usage_tracking')
                .upsert(userData.user_usage.map(usage => ({
                    ...usage,
                    // Convert user_usage format to usage_tracking format if needed
                    id: undefined, // Let Supabase generate new ID
                    month_year: new Date().toISOString().slice(0, 7) // Current month
                })), { onConflict: 'user_id,month_year' });
            
            if (error) {
                console.error('❌ Error importing usage tracking:', error);
            } else {
                console.log(`✅ Imported usage tracking data`);
            }
        }
        
        console.log('\n🎉 Import completed successfully!');
        console.log('\n📱 Next steps:');
        console.log('1. Go to your Railway app: https://jaquizy.com');
        console.log('2. Log in with your account');
        console.log('3. Your topics, notes, and questions should now appear!');
        
    } catch (error) {
        console.error('❌ Import failed:', error);
    }
}

importUserData();