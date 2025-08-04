// debug-user-data.js - Debug user authentication and data
require('dotenv').config();
const SimplifiedDatabaseService = require('./src/server/services/database-simplified');
const AuthService = require('./src/server/services/auth-service');

const db = new SimplifiedDatabaseService();
const authService = new AuthService();

async function debugUserData() {
  console.log('🔍 Debugging user data and authentication...');
  
  try {
    // Initialize database
    db.init();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n1️⃣ Checking global database stats:');
    const globalStats = await db.getDashboardStats();
    console.log('Global stats:', globalStats);
    
    console.log('\n2️⃣ Checking all topics in database:');
    const allTopics = await db.getAllTopics();
    console.log(`Found ${allTopics.length} total topics:`);
    allTopics.forEach(topic => {
      console.log(`  - ${topic.name} (subject: ${topic.subject_id}, user_id: ${topic.user_id || 'NULL'})`);
    });
    
    console.log('\n3️⃣ Checking all notes in database:');
    const allNotes = await db.getAllNotes();
    console.log(`Found ${allNotes.length} total notes:`);
    allNotes.forEach(note => {
      console.log(`  - Note in topic ${note.topic_id}: ${note.file_name || 'No filename'} (${note.word_count} words)`);
    });
    
    console.log('\n4️⃣ Testing user authentication (if possible):');
    try {
      // Try to get a specific user profile
      const testUserId = 'f629a691-afef-4d4f-b368-a3a4600405b7'; // From your logs
      console.log(`Testing with user ID: ${testUserId}`);
      
      const userProfile = await authService.getUserProfile(testUserId);
      console.log('User profile:', userProfile);
      
      console.log('\n5️⃣ Checking user-specific data:');
      const userStats = await db.getDashboardStatsForUser(testUserId);
      console.log('User-specific stats:', userStats);
      
      const userTopics = await db.getTopicsForUser('all', testUserId);
      console.log(`User topics: ${userTopics.length}`);
      userTopics.forEach(topic => {
        console.log(`  - ${topic.name} (user: ${topic.user_id})`);
      });
      
    } catch (authError) {
      console.log('Auth error (expected if Supabase is down):', authError.message);
    }
    
    console.log('\n6️⃣ Database schema check:');
    // Check if user_id columns exist
    try {
      await new Promise((resolve, reject) => {
        db.db.get("PRAGMA table_info(topics)", (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      db.db.all("PRAGMA table_info(topics)", (err, columns) => {
        if (err) {
          console.log('Error checking topics schema:', err);
        } else {
          console.log('Topics table columns:');
          columns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} (pk: ${col.pk}, notnull: ${col.notnull})`);
          });
        }
      });
      
    } catch (schemaError) {
      console.log('Schema check error:', schemaError);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    setTimeout(() => {
      db.close();
      process.exit(0);
    }, 2000);
  }
}

// Run the debug
debugUserData();