// fix-user-data.js - Fix user data assignment
require('dotenv').config();
const SimplifiedDatabaseService = require('./src/server/services/database-simplified');

const db = new SimplifiedDatabaseService();

async function fixUserData() {
  const USER_ID = 'f629a691-afef-4d4f-b368-a3a4600405b7'; // Your user ID
  
  console.log('🔧 Fixing user data assignment...');
  
  try {
    db.init();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n1️⃣ Cleaning up duplicate sample data...');
    
    // Delete topics with NULL user_id (sample data without user assignment)
    await new Promise((resolve, reject) => {
      db.db.run('DELETE FROM topics WHERE user_id IS NULL', function(err) {
        if (err) reject(err);
        else {
          console.log(`✅ Deleted ${this.changes} duplicate topics`);
          resolve();
        }
      });
    });
    
    // Delete orphaned notes
    await new Promise((resolve, reject) => {
      db.db.run(`DELETE FROM notes WHERE topic_id NOT IN (SELECT id FROM topics)`, function(err) {
        if (err) reject(err);
        else {
          console.log(`✅ Deleted ${this.changes} orphaned notes`);
          resolve();
        }
      });
    });
    
    console.log('\n2️⃣ Creating fresh sample data for your user...');
    
    // Create sample topics for the user
    const sampleTopics = [
      {
        subjectId: 'computer-science',
        name: 'JavaScript Fundamentals',
        description: 'Core concepts of JavaScript programming',
        notes: [
          {
            content: `JavaScript Variables and Data Types

Variables in JavaScript:
- var: function-scoped, can be redeclared
- let: block-scoped, cannot be redeclared  
- const: block-scoped, cannot be reassigned

Data Types:
1. Primitive types:
   - string: "Hello World"
   - number: 42, 3.14
   - boolean: true, false
   - undefined: undefined
   - null: null

2. Non-primitive types:
   - object: {}, []
   - function: function() {}

Examples:
let name = "John";          // string
let age = 25;               // number
let isStudent = true;       // boolean
let courses = [];           // array (object)`,
            fileName: 'js-fundamentals.txt'
          }
        ]
      },
      {
        subjectId: 'mathematics',
        name: 'Calculus - Derivatives',
        description: 'Understanding derivatives and their applications',
        notes: [
          {
            content: `Derivatives in Calculus

Definition:
The derivative of a function f(x) at point x is the limit:
f'(x) = lim(h→0) [f(x+h) - f(x)] / h

Basic Rules:
1. Power Rule: d/dx(x^n) = nx^(n-1)
2. Product Rule: d/dx(uv) = u'v + uv'
3. Quotient Rule: d/dx(u/v) = (u'v - uv') / v²
4. Chain Rule: d/dx(f(g(x))) = f'(g(x)) · g'(x)

Common Derivatives:
- d/dx(c) = 0 (constant)
- d/dx(x) = 1
- d/dx(x²) = 2x
- d/dx(sin x) = cos x
- d/dx(e^x) = e^x

Example:
Find the derivative of f(x) = 3x² + 2x - 5
f'(x) = 6x + 2`,
            fileName: 'calculus-derivatives.txt'
          }
        ]
      },
      {
        subjectId: 'natural-sciences',
        name: 'Physics - Mechanics', 
        description: 'Classical mechanics and Newton\'s laws',
        notes: [
          {
            content: `Classical Mechanics

Newton's Laws of Motion:

First Law (Law of Inertia):
An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force.

Second Law:
F = ma
Force equals mass times acceleration

Third Law:
For every action, there is an equal and opposite reaction.

Kinematic Equations:
1. v = v₀ + at
2. x = x₀ + v₀t + ½at²
3. v² = v₀² + 2a(x - x₀)

Work and Energy:
- Work: W = F·d·cos(θ)
- Kinetic Energy: KE = ½mv²
- Potential Energy: PE = mgh`,
            fileName: 'physics-mechanics.txt'
          }
        ]
      }
    ];
    
    let topicsCreated = 0;
    let notesCreated = 0;
    
    for (const topicData of sampleTopics) {
      console.log(`  📝 Creating topic: ${topicData.name}`);
      
      const topic = await db.createTopicForUser(
        topicData.subjectId, 
        topicData.name, 
        topicData.description, 
        USER_ID
      );
      topicsCreated++;
      
      for (const noteData of topicData.notes) {
        console.log(`    📄 Adding note: ${noteData.fileName}`);
        await db.createNoteForUser(
          topic.id, 
          noteData.content, 
          noteData.fileName, 
          USER_ID
        );
        notesCreated++;
      }
    }
    
    console.log('\n3️⃣ Verifying results...');
    const userStats = await db.getDashboardStatsForUser(USER_ID);
    console.log('✅ User stats after fix:', userStats);
    
    const userTopics = await db.getTopicsForUser('all', USER_ID);
    console.log(`✅ User now has ${userTopics.length} topics:`);
    userTopics.forEach(topic => {
      console.log(`  - ${topic.name} (${topic.subject_id})`);
    });
    
    console.log(`\n🎉 Success! Created ${topicsCreated} topics and ${notesCreated} notes for user`);
    
  } catch (error) {
    console.error('❌ Error fixing user data:', error);
  } finally {
    setTimeout(() => {
      db.close();
      process.exit(0);
    }, 1000);
  }
}

fixUserData();