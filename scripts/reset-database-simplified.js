// scripts/reset-database-simplified.js - FIXED VERSION - Reset database for simplified version

const fs = require('fs');
const path = require('path');

class SimplifiedDatabaseReset {
    constructor() {
        // FIXED: Corrected database path to match database service
        this.dbPath = path.join(__dirname, '../data/study_ai_simplified.db');
        this.oldDbPath = path.join(__dirname, '../data/study_ai.db');
        this.uploadsPath = path.join(__dirname, '../src/uploads');
        
        // Create data directory if it doesn't exist
        this.dataDir = path.join(__dirname, '../data');
    }

    async resetDatabase() {
        console.log('🔄 Starting simplified database reset...');

        try {
            // 0. Ensure data directory exists
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
                console.log('✅ Created data directory');
            }

            // 1. Remove old database file (if exists)
            if (fs.existsSync(this.oldDbPath)) {
                fs.unlinkSync(this.oldDbPath);
                console.log('✅ Old database file deleted');
            }

            // 2. Remove new simplified database file (if exists)
            if (fs.existsSync(this.dbPath)) {
                fs.unlinkSync(this.dbPath);
                console.log('✅ Simplified database file deleted');
            } else {
                console.log('ℹ️ Simplified database file not found');
            }

            // 3. Clear uploads directory
            if (fs.existsSync(this.uploadsPath)) {
                const files = fs.readdirSync(this.uploadsPath);
                files.forEach(file => {
                    const filePath = path.join(this.uploadsPath, file);
                    if (fs.lstatSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                    }
                });
                console.log(`✅ Cleared ${files.length} uploaded files`);
            } else {
                console.log('ℹ️ Uploads directory not found');
            }

            // 4. Clear localStorage instruction
            console.log('ℹ️ Also clear browser localStorage by running in browser console:');
            console.log('   localStorage.removeItem("studyai_simplified_state")');
            console.log('   location.reload()');

            console.log('🎉 Simplified database reset complete!');
            console.log('📝 Next steps:');
            console.log('   1. Restart the server: npm run dev');
            console.log('   2. Refresh the browser');
            console.log('   3. Database will be recreated automatically');
            console.log('   4. Test with fixed subjects and create topics');

        } catch (error) {
            console.error('❌ Reset failed:', error);
        }
    }

    async createTestData() {
        console.log('📚 Creating test data for simplified version...');
        
        // Import the simplified database service
        try {
            const SimplifiedDatabaseService = require('../src/server/services/database-simplified');
            const db = new SimplifiedDatabaseService();
            
            // Initialize database
            console.log('🔄 Initializing database...');
            db.init();
            
            // Wait for database to be ready
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Create test topic under Mathematics subject
            console.log('📊 Creating Mathematics topic...');
            const topic = await db.createTopic(
                'mathematics', // Fixed subject ID
                'Basic Arithmetic',
                'Addition, subtraction, multiplication and division'
            );
            console.log('✅ Created topic:', topic.name);
            
            // Create sample note
            const sampleContent = `Basic Arithmetic Operations

Addition: Adding two or more numbers together to get a sum.
Examples: 5 + 3 = 8, 12 + 7 = 19

Subtraction: Taking one number away from another to get a difference.
Examples: 10 - 4 = 6, 15 - 8 = 7

Multiplication: Repeated addition of the same number.
Examples: 3 × 4 = 12 (same as 3 + 3 + 3 + 3), 6 × 5 = 30

Division: Splitting a number into equal parts.
Examples: 12 ÷ 3 = 4, 20 ÷ 5 = 4

These are the four basic operations in mathematics that form the foundation for more advanced calculations.`;
            
            console.log('📝 Creating sample note...');
            const note = await db.createNote(
                topic.id,
                sampleContent.trim(),
                'sample_arithmetic_notes.txt'
            );
            console.log('✅ Created sample note');
            
            // Create another topic under History
            console.log('🏛️ Creating History topic...');
            const historyTopic = await db.createTopic(
                'history',
                'World War 2',
                'Major events and figures of World War 2'
            );
            console.log('✅ Created history topic:', historyTopic.name);
            
            const historyContent = `World War 2 (1939-1945)

World War 2 was a global conflict that lasted from 1939 to 1945. It was the deadliest conflict in human history.

Key Events:
- September 1939: Germany invades Poland, war begins in Europe
- December 1941: Pearl Harbor attack, United States enters the war
- June 1944: D-Day landings in Normandy, France
- May 1945: Germany surrenders, war ends in Europe
- August 1945: Atomic bombs dropped on Japan, Japan surrenders

Major Figures:
- Adolf Hitler: Leader of Nazi Germany
- Winston Churchill: British Prime Minister
- Franklin D. Roosevelt: US President (until 1945)
- Joseph Stalin: Soviet leader
- General Eisenhower: Allied Supreme Commander

The war resulted in an estimated 70-85 million deaths and reshaped the global political landscape.`;
            
            console.log('📜 Creating history note...');
            const historyNote = await db.createNote(
                historyTopic.id,
                historyContent.trim(),
                'ww2_overview.txt'
            );
            console.log('✅ Created history note');
            
            // Close database connection
            db.close();
            
            console.log('🎉 Test data created successfully!');
            console.log('🚀 You can now test question generation');
            console.log('📋 Test data summary:');
            console.log('   - Mathematics topic: Basic Arithmetic');
            console.log('   - History topic: World War 2');
            console.log('   - 2 sample notes with content');
            
        } catch (error) {
            console.error('❌ Failed to create test data:', error);
            console.error('📋 Error details:', error.message);
            console.error('🔧 Make sure the server is not running when creating test data');
        }
    }

    // Helper method to check if paths are correct
    checkPaths() {
        console.log('🔍 PATH VERIFICATION:');
        console.log('======================');
        console.log('Database path:', this.dbPath);
        console.log('Data directory:', this.dataDir);
        console.log('Uploads path:', this.uploadsPath);
        console.log('');
        console.log('Data directory exists:', fs.existsSync(this.dataDir));
        console.log('Database file exists:', fs.existsSync(this.dbPath));
        console.log('Uploads directory exists:', fs.existsSync(this.uploadsPath));
    }
}

// Command line interface
if (require.main === module) {
    const reset = new SimplifiedDatabaseReset();
    const args = process.argv.slice(2);
    
    if (args.includes('--check-paths')) {
        reset.checkPaths();
    } else if (args.includes('--with-test-data')) {
        reset.resetDatabase().then(() => {
            console.log('⏳ Waiting 3 seconds before creating test data...');
            setTimeout(() => reset.createTestData(), 3000);
        });
    } else if (args.includes('--test-data-only')) {
        reset.createTestData();
    } else {
        reset.resetDatabase();
    }
}

module.exports = SimplifiedDatabaseReset;