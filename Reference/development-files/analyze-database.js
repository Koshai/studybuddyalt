// analyze-database.js - Database Structure Analysis
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔍 Analyzing SQLite Database Structure...\n');

// Open the SQLite database
const db = new sqlite3.Database('./src/data/study_ai_simplified.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database\n');
    
    // Start analysis
    analyzeDatabase();
});

function analyzeDatabase() {
    // Get all table names
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
        if (err) {
            console.error('❌ Error getting tables:', err.message);
            return;
        }
        
        console.log(`📊 Tables found: ${tables.length}`);
        console.log('─'.repeat(60));
        
        let processedTables = 0;
        
        tables.forEach((table, index) => {
            analyzeTable(table.name, () => {
                processedTables++;
                if (processedTables === tables.length) {
                    // All tables processed, show relationships
                    showRelationships(tables);
                }
            });
        });
    });
}

function analyzeTable(tableName, callback) {
    console.log(`\n🗂️  Table: ${tableName}`);
    
    // Get table schema
    db.all(`PRAGMA table_info(${tableName})`, [], (err, schema) => {
        if (err) {
            console.error(`❌ Error getting schema for ${tableName}:`, err.message);
            callback();
            return;
        }
        
        console.log('   Columns:');
        schema.forEach(col => {
            const nullable = col.notnull ? 'NOT NULL' : 'NULL';
            const pk = col.pk ? ' (PRIMARY KEY)' : '';
            const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
            console.log(`     - ${col.name}: ${col.type} ${nullable}${pk}${defaultVal}`);
        });
        
        // Get row count
        db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, result) => {
            if (err) {
                console.log(`   Rows: Unable to count (${err.message})`);
            } else {
                console.log(`   Rows: ${result.count}`);
            }
            
            // Show sample data for small tables (not questions/notes which might be large)
            if (tableName !== 'questions' && tableName !== 'notes') {
                db.all(`SELECT * FROM ${tableName} LIMIT 3`, [], (err, samples) => {
                    if (err) {
                        console.log(`   Sample: Unable to fetch (${err.message})`);
                    } else if (samples.length > 0) {
                        console.log('   Sample data:');
                        samples.forEach((row, i) => {
                            const rowStr = JSON.stringify(row, null, 2).replace(/\n\s+/g, ' ');
                            const truncated = rowStr.length > 100 ? rowStr.slice(0, 100) + '...' : rowStr;
                            console.log(`     [${i+1}] ${truncated}`);
                        });
                    }
                    
                    console.log('─'.repeat(40));
                    callback();
                });
            } else {
                console.log('─'.repeat(40));
                callback();
            }
        });
    });
}

function showRelationships(tables) {
    console.log('\n🔗 Foreign Key Relationships:');
    
    let processedFKs = 0;
    
    tables.forEach(table => {
        db.all(`PRAGMA foreign_key_list(${table.name})`, [], (err, fks) => {
            processedFKs++;
            
            if (!err && fks.length > 0) {
                console.log(`   ${table.name}:`);
                fks.forEach(fk => {
                    console.log(`     - ${fk.from} → ${fk.table}.${fk.to}`);
                });
            }
            
            if (processedFKs === tables.length) {
                showIndexes();
            }
        });
    });
}

function showIndexes() {
    console.log('\n📇 Indexes:');
    
    db.all("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'", [], (err, indexes) => {
        if (err) {
            console.error('❌ Error getting indexes:', err.message);
        } else {
            indexes.forEach(idx => {
                console.log(`   ${idx.name} on ${idx.tbl_name}`);
            });
        }
        
        console.log('\n✅ Database analysis complete!\n');
        
        // Now analyze Supabase schema files
        analyzeSupabaseSchema();
    });
}

function analyzeSupabaseSchema() {
    console.log('🌐 Analyzing Supabase Schema Files...\n');
    
    const schemaFiles = [
        './supabase-setup.sql',
        './supabase-setup-clean.sql',
        './supabase-add-constraints.sql',
        './supabase-add-note-id.sql'
    ];
    
    schemaFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`📄 Found: ${file}`);
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                // Extract table names from CREATE TABLE statements
                const createTableRegex = /CREATE TABLE\s+(\w+)/gi;
                const tables = [];
                let match;
                
                while ((match = createTableRegex.exec(content)) !== null) {
                    tables.push(match[1]);
                }
                
                if (tables.length > 0) {
                    console.log(`   Tables defined: ${tables.join(', ')}`);
                }
                
                // Look for constraints and foreign keys
                if (content.includes('FOREIGN KEY') || content.includes('REFERENCES')) {
                    console.log('   ✅ Contains foreign key relationships');
                }
                
                if (content.includes('ALTER TABLE')) {
                    console.log('   ✅ Contains table modifications');
                }
                
                console.log('');
                
            } catch (error) {
                console.log(`   ❌ Error reading file: ${error.message}`);
            }
        } else {
            console.log(`❌ Not found: ${file}`);
        }
    });
    
    // Close database and provide sync analysis
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('💾 Database connection closed');
            provideSyncAnalysis();
        }
    });
}

function provideSyncAnalysis() {
    console.log('\n' + '═'.repeat(60));
    console.log('🔄 SQLITE ↔️ SUPABASE SYNC ANALYSIS');
    console.log('═'.repeat(60));
    
    console.log(`
📊 SYNC STRATEGY RECOMMENDATIONS:

1. **Data Flow Direction:**
   • Local SQLite: Primary for development/offline
   • Supabase: Cloud backup and multi-device sync
   
2. **Sync Triggers:**
   • User login: Pull latest from Supabase
   • User logout: Push local changes to Supabase
   • Periodic sync: Every 5-10 minutes when online
   • Conflict resolution: Last-write-wins or user choice

3. **Tables to Sync:**
   • users → Sync profile, settings, subscription status
   • subjects → Read-only (predefined list)
   • topics → Sync user-created topics
   • notes → Sync all note content and edits
   • questions → Sync generated questions
   • practice_sessions → Sync scores and progress
   • usage_tracking → Sync for billing/limits

4. **Sync Implementation:**
   • Add 'last_synced' timestamp to all tables
   • Add 'local_id' for offline-created records
   • Use UUIDs for cross-platform compatibility
   • Batch operations for efficiency
   
5. **Conflict Resolution:**
   • Compare 'updated_at' timestamps
   • For critical data (notes): Keep both versions
   • For usage data: Sum totals
   • For settings: User preference wins

🎯 Next Steps:
1. Review the database structure above
2. Compare with Supabase schema files
3. Identify any missing columns or tables
4. Plan the sync service implementation
    `);
}