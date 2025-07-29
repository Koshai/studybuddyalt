// scripts/remove-questions-only.js - Remove only questions from database, keep topics and notes

const fs = require('fs');
const path = require('path');

class QuestionRemover {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/study_ai_simplified.db');
        this.dataDir = path.join(__dirname, '../data');
    }

    async removeQuestionsOnly() {
        console.log('🗑️ Removing questions from database...');

        try {
            // Import the simplified database service
            const SimplifiedDatabaseService = require('../src/server/services/database-simplified');
            const db = new SimplifiedDatabaseService();
            
            // Initialize database connection
            console.log('🔄 Connecting to database...');
            db.init();
            
            // Wait for database to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get current stats before deletion
            const statsBefore = await this.getQuestionStats(db);
            console.log('📊 Current database state:');
            console.log(`   Questions: ${statsBefore.questions}`);
            console.log(`   User Answers: ${statsBefore.userAnswers}`);
            console.log(`   Practice Sessions: ${statsBefore.practiceSessions}`);
            console.log(`   Topics: ${statsBefore.topics} (will be preserved)`);
            console.log(`   Notes: ${statsBefore.notes} (will be preserved)`);
            
            if (statsBefore.questions === 0) {
                console.log('ℹ️ No questions found in database');
                db.close();
                return;
            }

            // Confirm deletion
            console.log('\n⚠️ This will remove:');
            console.log('   - All generated questions');
            console.log('   - All user answers');
            console.log('   - All practice session history');
            console.log('\n✅ This will preserve:');
            console.log('   - All topics');
            console.log('   - All uploaded notes and study materials');
            
            // Remove questions and related data
            await this.performCleanup(db);
            
            // Get stats after deletion
            const statsAfter = await this.getQuestionStats(db);
            console.log('\n✅ Cleanup completed!');
            console.log('📊 Database state after cleanup:');
            console.log(`   Questions: ${statsAfter.questions}`);
            console.log(`   User Answers: ${statsAfter.userAnswers}`);
            console.log(`   Practice Sessions: ${statsAfter.practiceSessions}`);
            console.log(`   Topics: ${statsAfter.topics} (preserved)`);
            console.log(`   Notes: ${statsAfter.notes} (preserved)`);
            
            console.log('\n🎯 You can now:');
            console.log('   1. Fix your Ollama model issues');
            console.log('   2. Generate new questions with working AI');
            console.log('   3. Your study materials are still intact');
            
            db.close();
            
        } catch (error) {
            console.error('❌ Failed to remove questions:', error);
            console.error('🔧 Make sure the server is not running when cleaning questions');
        }
    }

    async performCleanup(db) {
        return new Promise((resolve, reject) => {
            db.db.serialize(() => {
                console.log('🔄 Starting transaction...');
                db.db.run('BEGIN TRANSACTION');
                
                try {
                    // Delete in correct order due to foreign key constraints
                    console.log('🗑️ Deleting user answers...');
                    db.db.run('DELETE FROM user_answers');
                    
                    console.log('🗑️ Deleting practice sessions...');
                    db.db.run('DELETE FROM practice_sessions');
                    
                    console.log('🗑️ Deleting questions...');
                    db.db.run('DELETE FROM questions', function(err) {
                        if (err) {
                            console.error('❌ Error deleting questions:', err);
                            db.db.run('ROLLBACK');
                            reject(err);
                        } else {
                            console.log(`✅ Deleted ${this.changes} questions`);
                            db.db.run('COMMIT');
                            resolve();
                        }
                    });
                    
                } catch (error) {
                    console.error('❌ Transaction error:', error);
                    db.db.run('ROLLBACK');
                    reject(error);
                }
            });
        });
    }

    async getQuestionStats(db) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    (SELECT COUNT(*) FROM questions) as questions,
                    (SELECT COUNT(*) FROM user_answers) as user_answers,
                    (SELECT COUNT(*) FROM practice_sessions) as practice_sessions,
                    (SELECT COUNT(*) FROM topics) as topics,
                    (SELECT COUNT(*) FROM notes) as notes
            `;
            
            db.db.get(sql, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        questions: row.questions || 0,
                        userAnswers: row.user_answers || 0,
                        practiceSessions: row.practice_sessions || 0,
                        topics: row.topics || 0,
                        notes: row.notes || 0
                    });
                }
            });
        });
    }

    // Helper method to check database exists
    checkDatabase() {
        console.log('🔍 DATABASE CHECK:');
        console.log('==================');
        console.log('Database path:', this.dbPath);
        console.log('Database exists:', fs.existsSync(this.dbPath));
        
        if (!fs.existsSync(this.dbPath)) {
            console.log('❌ Database file not found!');
            console.log('🔧 Run the reset script first to create the database');
            return false;
        }
        return true;
    }

    // Method to remove questions for specific topic only
    async removeQuestionsForTopic(topicId) {
        console.log(`🗑️ Removing questions for topic: ${topicId}`);

        try {
            const SimplifiedDatabaseService = require('../src/server/services/database-simplified');
            const db = new SimplifiedDatabaseService();
            
            db.init();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get topic info
            const topic = await db.getTopicById(topicId);
            if (!topic) {
                console.log(`❌ Topic ${topicId} not found`);
                db.close();
                return;
            }
            
            console.log(`📚 Topic: ${topic.name}`);
            
            // Get questions count for this topic
            const questions = await db.getQuestions(topicId);
            console.log(`🔢 Found ${questions.length} questions for this topic`);
            
            if (questions.length === 0) {
                console.log('ℹ️ No questions to remove for this topic');
                db.close();
                return;
            }
            
            // Remove questions for this topic
            return new Promise((resolve, reject) => {
                db.db.serialize(() => {
                    db.db.run('BEGIN TRANSACTION');
                    
                    // Delete user answers for questions in this topic
                    db.db.run(`DELETE FROM user_answers WHERE question_id IN 
                        (SELECT id FROM questions WHERE topic_id = ?)`, [topicId]);
                    
                    // Delete practice sessions for this topic
                    db.db.run('DELETE FROM practice_sessions WHERE topic_id = ?', [topicId]);
                    
                    // Delete questions for this topic
                    db.db.run('DELETE FROM questions WHERE topic_id = ?', [topicId], function(err) {
                        if (err) {
                            db.db.run('ROLLBACK');
                            reject(err);
                        } else {
                            console.log(`✅ Deleted ${this.changes} questions for topic: ${topic.name}`);
                            db.db.run('COMMIT');
                            db.close();
                            resolve();
                        }
                    });
                });
            });
            
        } catch (error) {
            console.error('❌ Failed to remove questions for topic:', error);
        }
    }
}

// Command line interface
if (require.main === module) {
    const remover = new QuestionRemover();
    const args = process.argv.slice(2);
    
    if (args.includes('--check')) {
        remover.checkDatabase();
    } else if (args.includes('--topic')) {
        const topicIndex = args.indexOf('--topic');
        const topicId = args[topicIndex + 1];
        if (topicId) {
            remover.removeQuestionsForTopic(topicId);
        } else {
            console.log('❌ Please provide topic ID: --topic <topic-id>');
        }
    } else if (args.includes('--all')) {
        remover.removeQuestionsOnly();
    } else {
        console.log('🗑️ Question Remover for StudyAI');
        console.log('==============================');
        console.log('');
        console.log('Commands:');
        console.log('  --check          Check if database exists');
        console.log('  --all            Remove ALL questions (keeps topics and notes)');
        console.log('  --topic <id>     Remove questions for specific topic only');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/remove-questions-only.js --check');
        console.log('  node scripts/remove-questions-only.js --all');
        console.log('  node scripts/remove-questions-only.js --topic abc-123-def');
    }
}

module.exports = QuestionRemover;