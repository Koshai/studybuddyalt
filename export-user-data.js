// export-user-data.js - Export user data from local SQLite to JSON
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'src', 'data', 'study_ai_simplified.db');

console.log('📊 Exporting user data from local SQLite...');

if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database not found at:', DB_PATH);
    process.exit(1);
}

const db = Database(DB_PATH);

try {
    // Get your user ID (replace with your actual email)
    const userEmail = process.argv[2] || 'your-email@example.com';
    console.log(`🔍 Looking for user: ${userEmail}`);
    
    // Use the user ID we found in the database
    const userId = '127fa11a-442f-4180-b0c4-c5e3efacdea5';
    
    console.log(`✅ Using user ID: ${userId}`);
    
    // Export all user data
    const exportData = {
        user_id: userId,
        topics: db.prepare('SELECT * FROM topics WHERE user_id = ?').all(userId),
        notes: [],
        questions: [],
        practice_sessions: db.prepare('SELECT * FROM practice_sessions WHERE user_id = ?').all(userId),
        user_answers: [],
        user_usage: db.prepare('SELECT * FROM user_usage WHERE user_id = ?').all(userId)
    };
    
    // Get notes and questions for each topic
    exportData.topics.forEach(topic => {
        // Get notes for this topic
        const topicNotes = db.prepare('SELECT * FROM notes WHERE topic_id = ?').all(topic.id);
        exportData.notes.push(...topicNotes);
        
        // Get questions for this topic
        const topicQuestions = db.prepare('SELECT * FROM questions WHERE topic_id = ?').all(topic.id);
        exportData.questions.push(...topicQuestions);
    });
    
    // Get user answers for practice sessions
    exportData.practice_sessions.forEach(session => {
        const sessionAnswers = db.prepare('SELECT * FROM user_answers WHERE session_id = ?').all(session.id);
        exportData.user_answers.push(...sessionAnswers);
    });
    
    // Save to JSON file
    const exportFile = `user-data-export-${userId}.json`;
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    
    console.log('\n📈 Export Summary:');
    console.log(`  - Topics: ${exportData.topics.length}`);
    console.log(`  - Notes: ${exportData.notes.length}`);
    console.log(`  - Questions: ${exportData.questions.length}`);
    console.log(`  - Practice Sessions: ${exportData.practice_sessions.length}`);
    console.log(`  - User Answers: ${exportData.user_answers.length}`);
    console.log(`  - Usage Records: ${exportData.user_usage.length}`);
    
    console.log(`\n✅ Data exported to: ${exportFile}`);
    console.log('\nNext steps:');
    console.log('1. Upload this file to your Supabase database');
    console.log('2. Or send it to me to help import it');
    
} catch (error) {
    console.error('❌ Export failed:', error);
} finally {
    db.close();
}