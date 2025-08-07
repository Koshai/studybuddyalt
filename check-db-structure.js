// check-db-structure.js - Check what's in the local database
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'src', 'data', 'study_ai_simplified.db');

console.log('🔍 Checking database structure...');
console.log('Database path:', DB_PATH);

if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database not found at:', DB_PATH);
    
    // Check if there are any .db files
    const dataDir = path.join(__dirname, 'src', 'data');
    if (fs.existsSync(dataDir)) {
        console.log('📁 Files in data directory:');
        const files = fs.readdirSync(dataDir);
        files.forEach(file => console.log(`  - ${file}`));
    }
    process.exit(1);
}

const db = Database(DB_PATH);

try {
    // Get all tables
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
    `).all();
    
    console.log('\n📋 Database Tables:');
    tables.forEach(table => {
        console.log(`  - ${table.name}`);
        
        // Get row count for each table
        try {
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
            console.log(`    (${count.count} rows)`);
        } catch (e) {
            console.log(`    (could not count rows)`);
        }
    });
    
    // Check for user-related data
    console.log('\n🔍 Looking for user data...');
    
    // Try common table names
    const possibleUserTables = ['users', 'user_profiles', 'accounts'];
    for (const tableName of possibleUserTables) {
        try {
            const users = db.prepare(`SELECT * FROM ${tableName} LIMIT 5`).all();
            if (users.length > 0) {
                console.log(`\n👤 Found users in ${tableName}:`);
                users.forEach(user => {
                    console.log(`  - ${JSON.stringify(user, null, 2)}`);
                });
            }
        } catch (e) {
            // Table doesn't exist, skip
        }
    }
    
    // Try to find any data
    const possibleDataTables = ['topics', 'notes', 'questions', 'subjects'];
    for (const tableName of possibleDataTables) {
        try {
            const data = db.prepare(`SELECT * FROM ${tableName} LIMIT 3`).all();
            if (data.length > 0) {
                console.log(`\n📊 Sample data from ${tableName}:`);
                data.forEach(row => {
                    console.log(`  - ${JSON.stringify(row, null, 2)}`);
                });
            }
        } catch (e) {
            // Table doesn't exist, skip
        }
    }
    
} catch (error) {
    console.error('❌ Database check failed:', error);
} finally {
    db.close();
}