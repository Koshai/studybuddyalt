// generate-sample-data.js - Generate sample study materials for testing
const SimplifiedDatabaseService = require('./src/server/services/database-simplified');

const db = new SimplifiedDatabaseService();

// Sample study content for different subjects
const SAMPLE_DATA = {
  'computer-science': {
    topics: [
      {
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
   - symbol: Symbol('id')
   - bigint: 123n

2. Non-primitive types:
   - object: {}, []
   - function: function() {}

Type conversion:
- Implicit: JavaScript automatically converts types
- Explicit: parseInt(), Number(), String()

Examples:
let name = "John";          // string
let age = 25;               // number
let isStudent = true;       // boolean
let courses = [];           // array (object)
let person = {              // object
  name: name,
  age: age
};`,
            fileName: 'js-fundamentals.txt'
          },
          {
            content: `JavaScript Functions and Scope

Function Declaration:
function greet(name) {
  return "Hello, " + name;
}

Function Expression:
const greet = function(name) {
  return "Hello, " + name;
};

Arrow Functions:
const greet = (name) => "Hello, " + name;

Scope:
- Global scope: Variables declared outside functions
- Function scope: Variables declared inside functions
- Block scope: Variables declared with let/const in blocks

Closures:
Functions that have access to outer function variables even after the outer function returns.

Example:
function outerFunction(x) {
  return function innerFunction(y) {
    return x + y;
  };
}

const addFive = outerFunction(5);
console.log(addFive(3)); // 8`,
            fileName: 'js-functions.txt'
          }
        ]
      },
      {
        name: 'Data Structures',
        description: 'Arrays, objects, and advanced data structures',
        notes: [
          {
            content: `Data Structures in Programming

1. Arrays:
   - Ordered collection of elements
   - Zero-indexed
   - Dynamic size in JavaScript
   
   Operations:
   - Access: arr[index] - O(1)
   - Insert: arr.push(element) - O(1)
   - Delete: arr.pop() - O(1)
   - Search: arr.indexOf(element) - O(n)

2. Objects (Hash Maps):
   - Key-value pairs
   - Fast lookup by key
   
   Operations:
   - Access: obj[key] - O(1)
   - Insert: obj[key] = value - O(1)
   - Delete: delete obj[key] - O(1)

3. Linked Lists:
   - Nodes containing data and reference to next node
   - Dynamic size
   - No random access
   
   Types:
   - Singly linked list
   - Doubly linked list
   - Circular linked list

4. Stacks (LIFO - Last In, First Out):
   - push(): Add element to top
   - pop(): Remove element from top
   - peek(): View top element

5. Queues (FIFO - First In, First Out):
   - enqueue(): Add element to rear
   - dequeue(): Remove element from front
   - front(): View front element`,
            fileName: 'data-structures.txt'
          }
        ]
      }
    ]
  },
  'mathematics': {
    topics: [
      {
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
- d/dx(cos x) = -sin x
- d/dx(e^x) = e^x
- d/dx(ln x) = 1/x

Applications:
1. Finding slopes of tangent lines
2. Optimization problems (max/min)
3. Related rates
4. Motion analysis (velocity, acceleration)

Example:
Find the derivative of f(x) = 3x² + 2x - 5
f'(x) = 6x + 2`,
            fileName: 'calculus-derivatives.txt'
          }
        ]
      },
      {
        name: 'Linear Algebra',
        description: 'Vectors, matrices, and linear transformations',
        notes: [
          {
            content: `Linear Algebra Fundamentals

Vectors:
- Mathematical objects with magnitude and direction
- Represented as arrays of numbers
- Operations: addition, scalar multiplication, dot product

Vector Addition:
[a₁, a₂] + [b₁, b₂] = [a₁+b₁, a₂+b₂]

Dot Product:
a·b = a₁b₁ + a₂b₂ + ... + aₙbₙ
Result is a scalar

Matrices:
- Rectangular arrays of numbers
- Dimensions: m×n (m rows, n columns)

Matrix Operations:
1. Addition: Add corresponding elements
2. Scalar multiplication: Multiply each element
3. Matrix multiplication: Row×Column

Matrix Multiplication:
(AB)ᵢⱼ = Σₖ aᵢₖbₖⱼ

Identity Matrix:
Square matrix with 1s on diagonal, 0s elsewhere
AI = IA = A

Inverse Matrix:
AA⁻¹ = A⁻¹A = I
Not all matrices have inverses

Applications:
- Solving systems of linear equations
- Computer graphics transformations
- Data analysis and machine learning
- Economic modeling`,
            fileName: 'linear-algebra.txt'
          }
        ]
      }
    ]
  },
  'natural-sciences': {
    topics: [
      {
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
- F: Force (Newtons)
- m: Mass (kg)
- a: Acceleration (m/s²)

Third Law:
For every action, there is an equal and opposite reaction.

Kinematic Equations:
1. v = v₀ + at
2. x = x₀ + v₀t + ½at²
3. v² = v₀² + 2a(x - x₀)
4. x = x₀ + ½(v₀ + v)t

Where:
- v: final velocity
- v₀: initial velocity
- a: acceleration
- t: time
- x: position

Work and Energy:
- Work: W = F·d·cos(θ)
- Kinetic Energy: KE = ½mv²
- Potential Energy: PE = mgh
- Conservation of Energy: Total energy remains constant

Momentum:
- Linear Momentum: p = mv
- Conservation of Momentum: Total momentum before = Total momentum after`,
            fileName: 'physics-mechanics.txt'
          }
        ]
      },
      {
        name: 'Chemistry - Atomic Structure',
        description: 'Atoms, electrons, and chemical bonding',
        notes: [
          {
            content: `Atomic Structure and Chemical Bonding

Atomic Structure:
- Nucleus: Contains protons (+) and neutrons (neutral)
- Electrons (-): Orbit the nucleus in energy levels/shells

Atomic Number (Z): Number of protons
Mass Number (A): Protons + neutrons
Isotopes: Same element, different number of neutrons

Electron Configuration:
- s orbital: max 2 electrons
- p orbital: max 6 electrons  
- d orbital: max 10 electrons
- f orbital: max 14 electrons

Aufbau Principle: Fill lowest energy orbitals first
Pauli Exclusion: No two electrons can have identical quantum numbers
Hund's Rule: Fill orbitals singly before pairing

Chemical Bonding:

1. Ionic Bonds:
   - Transfer of electrons
   - Metal + non-metal
   - Electrostatic attraction
   - Examples: NaCl, MgO

2. Covalent Bonds:
   - Sharing of electrons
   - Non-metal + non-metal
   - Single, double, triple bonds
   - Examples: H₂O, CO₂, N₂

3. Metallic Bonds:
   - Sea of delocalized electrons
   - Metal atoms
   - Explains conductivity, malleability

Bond Properties:
- Bond length: Distance between nuclei
- Bond energy: Energy to break the bond
- Polarity: Unequal sharing of electrons`,
            fileName: 'chemistry-atomic.txt'
          }
        ]
      }
    ]
  },
  'history': {
    topics: [
      {
        name: 'World War II',
        description: 'Major events and consequences of WWII',
        notes: [
          {
            content: `World War II (1939-1945)

Causes:
1. Treaty of Versailles aftermath
2. Rise of fascism in Germany, Italy, Japan
3. Economic instability from Great Depression
4. Failure of League of Nations
5. Appeasement policy failures

Key Events Timeline:

1939:
- September 1: Germany invades Poland
- September 3: Britain and France declare war

1940:
- April-June: Germany conquers Norway, Denmark, Netherlands, Belgium, France
- Battle of Britain (air warfare)

1941:
- June 22: Operation Barbarossa - Germany invades Soviet Union
- December 7: Pearl Harbor attack - US enters war

1942:
- Battle of Stalingrad begins
- Battle of Midway (Pacific theater)

1943:
- German surrender at Stalingrad
- Italy surrenders

1944:
- June 6: D-Day - Allied invasion of Normandy
- Liberation of concentration camps begins

1945:
- May 8: VE Day - Germany surrenders
- August 6 & 9: Atomic bombs on Hiroshima and Nagasaki
- August 15: VJ Day - Japan surrenders

Consequences:
- 50-80 million deaths
- Holocaust - systematic murder of 6 million Jews
- United Nations established
- Cold War begins
- Decolonization accelerates
- Nuclear age begins`,
            fileName: 'wwii-history.txt'
          }
        ]
      }
    ]
  }
};

async function generateSampleData(userId = null) {
  console.log('🎓 Generating sample study materials...');
  
  try {
    // Initialize database
    db.init();
    
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // If no userId provided, try to find an existing user or create global data
    if (!userId) {
      console.log('⚠️  No user ID provided. Creating global sample data.');
      console.log('💡 To create user-specific data, run: node generate-sample-data.js YOUR_USER_ID');
    }
    
    let totalTopics = 0;
    let totalNotes = 0;
    
    // Generate data for each subject
    for (const [subjectId, subjectData] of Object.entries(SAMPLE_DATA)) {
      console.log(`📚 Processing subject: ${subjectId}`);
      
      for (const topicData of subjectData.topics) {
        console.log(`  📝 Creating topic: ${topicData.name}`);
        
        // Create topic (with user_id if provided)
        const topic = userId 
          ? await db.createTopicForUser(subjectId, topicData.name, topicData.description, userId)
          : await db.createTopic(subjectId, topicData.name, topicData.description);
        totalTopics++;
        
        // Add notes to this topic
        for (const noteData of topicData.notes) {
          console.log(`    📄 Adding note: ${noteData.fileName || 'Untitled'}`);
          if (userId) {
            await db.createNoteForUser(topic.id, noteData.content, noteData.fileName, userId);
          } else {
            await db.createNote(topic.id, noteData.content, noteData.fileName);
          }
          totalNotes++;
        }
        
        console.log(`    ✅ Topic "${topicData.name}" created with ${topicData.notes.length} notes`);
      }
    }
    
    console.log(`\n🎉 Sample data generation complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - ${totalTopics} topics created`);
    console.log(`   - ${totalNotes} notes created`);
    console.log(`   - Subjects covered: ${Object.keys(SAMPLE_DATA).length}`);
    
    // Test the data
    const stats = await db.getDashboardStats();
    console.log(`\n📈 Database Stats:`);
    console.log(`   - Total topics: ${stats.total_topics}`);
    console.log(`   - Total notes: ${stats.total_notes}`);
    console.log(`   - Total questions: ${stats.total_questions}`);
    
  } catch (error) {
    console.error('❌ Error generating sample data:', error);
  } finally {
    db.close();
  }
}

// Run the generator
if (require.main === module) {
  const userId = process.argv[2]; // Get user ID from command line argument
  generateSampleData(userId);
}

module.exports = { generateSampleData, SAMPLE_DATA };