// scripts/reset-database.js - Clean database and start fresh

const fs = require('fs');
const path = require('path');

class DatabaseReset {
    constructor() {
        this.dbPath = path.join(__dirname, '../src/data/study_ai.db');
        this.uploadsPath = path.join(__dirname, '../src/uploads');
    }

    async resetDatabase() {
        console.log('🗑️ Starting database reset...');

        try {
            // 1. Remove database file
            if (fs.existsSync(this.dbPath)) {
                fs.unlinkSync(this.dbPath);
                console.log('✅ Database file deleted');
            } else {
                console.log('ℹ️ Database file not found');
            }

            // 2. Clear uploads directory
            if (fs.existsSync(this.uploadsPath)) {
                const files = fs.readdirSync(this.uploadsPath);
                files.forEach(file => {
                    const filePath = path.join(this.uploadsPath, file);
                    if (fs.lstatSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                    }
                });
                console.log(`✅ Cleared ${files.length} uploaded files`);
            }

            // 3. Clear localStorage (for browser)
            console.log('ℹ️ Also clear browser localStorage by running in browser console:');
            console.log('   localStorage.removeItem("studyai_state")');
            console.log('   location.reload()');

            console.log('🎉 Database reset complete!');
            console.log('📝 Next steps:');
            console.log('   1. Restart the server: npm run dev');
            console.log('   2. Refresh the browser');
            console.log('   3. Create new subjects and topics');

        } catch (error) {
            console.error('❌ Reset failed:', error);
        }
    }

    async createTestData() {
        console.log('📚 Creating test data...');
        
        const DatabaseService = require('../src/server/services/database');
        const db = new DatabaseService();
        
        try {
            // Initialize database
            db.init();
            
            // Wait for database to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Create test subject
            const subject = await db.createSubject(
                'History', 
                'World History and Historical Events'
            );
            console.log('✅ Created subject:', subject.name);
            
            // Create test topic
            const topic = await db.createTopic(
                subject.id,
                'World War 2',
                'Major events and figures of World War 2'
            );
            console.log('✅ Created topic:', topic.name);
            
            // Create sample note
            const sampleContent = `
World War 2 was a global conflict that lasted from 1939 to 1945. The war involved most of the world's nations and was the deadliest conflict in human history.

Key figures included:
- Adolf Hitler: Leader of Nazi Germany
- Winston Churchill: British Prime Minister
- Franklin D. Roosevelt: US President
- Joseph Stalin: Soviet leader

Major events:
- September 1939: Germany invades Poland, war begins
- December 1941: Pearl Harbor attack, US enters war
- June 1944: D-Day landings in Normandy
- May 1945: Germany surrenders
- August 1945: Atomic bombs dropped on Japan, war ends

The war resulted in an estimated 70-85 million deaths and reshaped the global political landscape.
            `;
            
            const note = await db.createNote(
                subject.id,
                topic.id,
                sampleContent.trim(),
                'sample_ww2_notes.txt'
            );
            console.log('✅ Created sample note');
            
            db.close();
            
            console.log('🎉 Test data created successfully!');
            console.log('🚀 You can now test question generation');
            
        } catch (error) {
            console.error('❌ Failed to create test data:', error);
            db.close();
        }
    }
}

// Command line interface
if (require.main === module) {
    const reset = new DatabaseReset();
    const args = process.argv.slice(2);
    
    if (args.includes('--with-test-data')) {
        reset.resetDatabase().then(() => {
            setTimeout(() => reset.createTestData(), 2000);
        });
    } else {
        reset.resetDatabase();
    }
}

module.exports = DatabaseReset;