// Clean SQLite Database - removes all data and recreates fresh schema
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'src/data/study_ai_simplified.db');

console.log('🧹 Cleaning SQLite database...');
console.log('📍 Database path:', dbPath);

// Check if database exists
if (fs.existsSync(dbPath)) {
    console.log('📁 Database file exists, deleting...');
    try {
        fs.unlinkSync(dbPath);
        console.log('✅ Database file deleted successfully');
    } catch (error) {
        console.error('❌ Error deleting database file:', error.message);
        console.log('🔄 Database might be in use. Please stop the server and try again.');
        process.exit(1);
    }
} else {
    console.log('📝 Database file does not exist');
}

// Create fresh database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error creating fresh database:', err);
        process.exit(1);
    } else {
        console.log('✅ Fresh database created successfully');
        
        // The database schema will be created automatically when the server starts
        // via the SimplifiedDatabaseService.init() method
        
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err);
            } else {
                console.log('✅ Database cleanup completed successfully');
                console.log('🚀 You can now start your server - it will create fresh tables');
            }
        });
    }
});