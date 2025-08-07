// apply-schema-fix.js - Apply the missing user_id columns fix
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

async function applySchemaFix() {
    console.log('🔧 Applying schema fix for missing user_id columns...');
    
    try {
        // Read the SQL fix
        const sqlFix = fs.readFileSync('fix-missing-user-id-columns.sql', 'utf8');
        
        console.log('📝 Executing SQL fix...');
        
        // Execute the SQL (Note: we need to use rpc for complex SQL)
        const { data, error } = await supabase.rpc('exec_sql', { sql_statement: sqlFix });
        
        if (error) {
            // If rpc doesn't work, we'll need to break it into parts
            console.log('⚠️ RPC method not available, applying fixes manually...');
            
            // Add user_id to notes table
            console.log('1️⃣ Adding user_id column to notes table...');
            try {
                await supabase.rpc('exec', {
                    sql: `
                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM information_schema.columns 
                                WHERE table_name = 'notes' AND column_name = 'user_id'
                            ) THEN
                                ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
                            END IF;
                        END $$;
                    `
                });
                console.log('✅ Added user_id to notes table');
            } catch (e) {
                console.error('❌ Could not add user_id to notes:', e.message);
            }
            
            // Add user_id to questions table
            console.log('2️⃣ Adding user_id column to questions table...');
            try {
                await supabase.rpc('exec', {
                    sql: `
                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM information_schema.columns 
                                WHERE table_name = 'questions' AND column_name = 'user_id'
                            ) THEN
                                ALTER TABLE questions ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
                            END IF;
                        END $$;
                    `
                });
                console.log('✅ Added user_id to questions table');
            } catch (e) {
                console.error('❌ Could not add user_id to questions:', e.message);
            }
            
        } else {
            console.log('✅ SQL fix applied successfully');
        }
        
        // Verify the fix worked
        console.log('\n🔍 Verifying schema fix...');
        
        // Check notes table
        const { data: notesColumns } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'notes')
            .eq('column_name', 'user_id');
            
        // Check questions table  
        const { data: questionsColumns } = await supabase
            .from('information_schema.columns') 
            .select('column_name')
            .eq('table_name', 'questions')
            .eq('column_name', 'user_id');
        
        if (notesColumns && notesColumns.length > 0) {
            console.log('✅ notes table now has user_id column');
        } else {
            console.log('❌ notes table still missing user_id column');
        }
        
        if (questionsColumns && questionsColumns.length > 0) {
            console.log('✅ questions table now has user_id column');
        } else {
            console.log('❌ questions table still missing user_id column');
        }
        
        console.log('\n🎉 Schema fix complete!');
        console.log('📝 Next step: Re-import your data with the corrected schema');
        
    } catch (error) {
        console.error('❌ Schema fix failed:', error);
    }
}

applySchemaFix();