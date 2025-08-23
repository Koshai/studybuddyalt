# Flashcard System Design - Teacher-First Approach

## 🏫 Teacher Use Cases

### **1. Content Creation**
- **Auto-Generate from Notes**: Convert existing notes into flashcard sets
- **Manual Creation**: Create custom flashcards from scratch  
- **Batch Import**: Upload CSV/Excel files with flashcard data
- **Smart Suggestions**: AI suggests improvements to flashcard content

### **2. Class Management**
- **Shared Sets**: Create flashcard sets for entire class
- **Assignment**: Assign specific flashcard sets to students
- **Progress Tracking**: See which students are struggling with which cards
- **Analytics**: Class-wide performance on specific concepts

### **3. Differentiation**
- **Difficulty Levels**: Beginner, Intermediate, Advanced versions
- **Learning Styles**: Text, Visual, Audio flashcards
- **Adaptive Pacing**: Slower repetition for struggling students

## 🎓 Student Experience

### **Study Modes**
1. **Recognition Mode**: Show question, pick from multiple answers
2. **Recall Mode**: Show question, type/speak the answer
3. **Rapid Fire**: Quick succession for speed drilling
4. **Spaced Review**: Algorithm-based optimal timing

### **Progress Tracking**
- **Mastery Levels**: Learning → Familiar → Mastered
- **Streak Tracking**: Consecutive correct answers
- **Time Analytics**: How long to recall each card
- **Confidence Rating**: Student rates their confidence level

## 🗄️ Database Schema

```sql
-- Flashcard Sets (Collections)
CREATE TABLE flashcard_sets (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    subject_id INTEGER,
    topic_id INTEGER,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects (id),
    FOREIGN KEY (topic_id) REFERENCES topics (id)
);

-- Individual Flashcards
CREATE TABLE flashcards (
    id INTEGER PRIMARY KEY,
    set_id INTEGER NOT NULL,
    front TEXT NOT NULL,           -- Question/Term
    back TEXT NOT NULL,            -- Answer/Definition
    hint TEXT,                     -- Optional hint
    image_url TEXT,               -- Optional image
    audio_url TEXT,               -- Optional audio
    difficulty INTEGER DEFAULT 1, -- 1=Easy, 2=Medium, 3=Hard
    tags TEXT,                    -- JSON array of tags
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_id) REFERENCES flashcard_sets (id) ON DELETE CASCADE
);

-- Student Progress on Individual Cards
CREATE TABLE flashcard_progress (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    flashcard_id INTEGER NOT NULL,
    mastery_level INTEGER DEFAULT 0, -- 0=Learning, 1=Familiar, 2=Mastered
    correct_streak INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    correct_attempts INTEGER DEFAULT 0,
    average_response_time REAL DEFAULT 0,
    last_reviewed_at DATETIME,
    next_review_at DATETIME,
    ease_factor REAL DEFAULT 2.5,    -- For spaced repetition
    interval_days INTEGER DEFAULT 1,  -- Days until next review
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, flashcard_id),
    FOREIGN KEY (flashcard_id) REFERENCES flashcards (id) ON DELETE CASCADE
);

-- Study Sessions
CREATE TABLE flashcard_sessions (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    set_id INTEGER NOT NULL,
    study_mode TEXT NOT NULL,     -- recognition, recall, rapid_fire, spaced_review
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_id) REFERENCES flashcard_sets (id)
);
```

## 🧠 Spaced Repetition Algorithm (Simplified SM-2)

```javascript
// Calculate next review date based on performance
function calculateNextReview(card, isCorrect) {
    let easeFactor = card.ease_factor;
    let interval = card.interval_days;
    
    if (isCorrect) {
        if (interval === 0) {
            interval = 1;
        } else if (interval === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
        interval = 1; // Reset to beginning
        easeFactor = Math.max(1.3, easeFactor - 0.2);
    }
    
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    
    return {
        ease_factor: Math.max(1.3, easeFactor),
        interval_days: interval,
        next_review_at: nextReviewDate
    };
}
```

## 🎯 Implementation Priority

### **Phase 1: Core Flashcards (Week 1)**
1. Database schema setup
2. Basic CRUD operations for flashcard sets
3. Simple flashcard creation UI
4. Basic study mode (recognition)
5. Progress tracking

### **Phase 2: Teacher Features (Week 2)**
1. Auto-generate flashcards from notes
2. Shared flashcard sets
3. Class progress dashboard
4. Import/export functionality

### **Phase 3: Advanced Learning (Week 3)**
1. Spaced repetition algorithm
2. Multiple study modes
3. Analytics and insights
4. Mobile-optimized interface

### **Phase 4: Collaboration (Week 4)**
1. Student-to-student sharing
2. Community flashcard library
3. Teacher assignments
4. Performance competitions

## 🛠️ Technical Implementation

### **Frontend Components Needed**
- `FlashcardSetList.js` - Browse available sets
- `FlashcardCreator.js` - Create new cards/sets
- `FlashcardStudy.js` - Main study interface  
- `FlashcardProgress.js` - Progress dashboard
- `FlashcardImporter.js` - Batch import functionality

### **Backend Services Needed**
- `flashcard-db-service.js` - Database operations
- `spaced-repetition-service.js` - Algorithm implementation
- `flashcard-generator-service.js` - AI-powered card creation
- `flashcard-routes.js` - API endpoints

### **Integration Points**
- Notes system (auto-generate from existing notes)
- AI services (smart card generation and evaluation)
- Usage tracking (count flashcard creation and study time)
- Authentication (user-specific progress tracking)

## 📊 Teacher Analytics Dashboard

### **Class Overview**
- Total flashcard sets assigned
- Average study time per student
- Cards mastered vs. struggling concepts
- Most and least effective flashcard sets

### **Individual Student Progress**
- Mastery progression over time
- Time spent studying each set
- Accuracy trends
- Recommended focus areas

### **Content Effectiveness**
- Which flashcards are consistently difficult
- Cards that need revision or better hints
- Most engaging study modes per concept

---

*This design prioritizes teacher workflow efficiency and student learning outcomes while maintaining the privacy-first architecture of the existing Jaquizy platform.*