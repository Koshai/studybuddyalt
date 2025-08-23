// src/server/services/flashcards-db-service.js - Flashcard Database Operations
const { v4: uuidv4 } = require('uuid');

class FlashcardsDbService {
    constructor(db) {
        this.db = db;
    }

    /**
     * Initialize flashcard tables and indexes
     */
    async initializeTables() {
        const tables = [
            // Flashcard Sets (Collections)
            `CREATE TABLE IF NOT EXISTS flashcard_sets (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                subject_id TEXT,
                topic_id TEXT,
                is_shared BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
            )`,

            // Individual Flashcards
            `CREATE TABLE IF NOT EXISTS flashcards (
                id TEXT PRIMARY KEY,
                set_id TEXT NOT NULL,
                front TEXT NOT NULL,
                back TEXT NOT NULL,
                hint TEXT,
                image_url TEXT,
                audio_url TEXT,
                difficulty INTEGER DEFAULT 1,
                tags TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (set_id) REFERENCES flashcard_sets (id) ON DELETE CASCADE
            )`,

            // Student Progress on Individual Cards
            `CREATE TABLE IF NOT EXISTS flashcard_progress (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                flashcard_id TEXT NOT NULL,
                mastery_level INTEGER DEFAULT 0,
                correct_streak INTEGER DEFAULT 0,
                total_attempts INTEGER DEFAULT 0,
                correct_attempts INTEGER DEFAULT 0,
                average_response_time REAL DEFAULT 0,
                last_reviewed_at DATETIME,
                next_review_at DATETIME,
                ease_factor REAL DEFAULT 2.5,
                interval_days INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (flashcard_id) REFERENCES flashcards (id) ON DELETE CASCADE,
                UNIQUE(user_id, flashcard_id)
            )`,

            // Study Sessions
            `CREATE TABLE IF NOT EXISTS flashcard_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                set_id TEXT NOT NULL,
                study_mode TEXT NOT NULL,
                cards_studied INTEGER DEFAULT 0,
                cards_correct INTEGER DEFAULT 0,
                duration_seconds INTEGER DEFAULT 0,
                completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (set_id) REFERENCES flashcard_sets (id) ON DELETE CASCADE
            )`
        ];

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                tables.forEach((sql, index) => {
                    this.db.run(sql, (err) => {
                        if (err) {
                            console.error(`Error creating flashcard table ${index}:`, err);
                            reject(err);
                        } else if (index === tables.length - 1) {
                            // Create indexes after all tables
                            this.createIndexes().then(resolve).catch(reject);
                        }
                    });
                });
            });
        });
    }

    async createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON flashcard_sets (user_id)',
            'CREATE INDEX IF NOT EXISTS idx_flashcard_sets_topic_id ON flashcard_sets (topic_id)', 
            'CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards (set_id)',
            'CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_id ON flashcard_progress (user_id)',
            'CREATE INDEX IF NOT EXISTS idx_flashcard_progress_next_review ON flashcard_progress (next_review_at)',
            'CREATE INDEX IF NOT EXISTS idx_flashcard_sessions_user_id ON flashcard_sessions (user_id)'
        ];

        return new Promise((resolve, reject) => {
            let completed = 0;
            indexes.forEach(sql => {
                this.db.run(sql, (err) => {
                    if (err && !err.message.includes('already exists')) {
                        console.error('Error creating flashcard index:', err);
                        reject(err);
                    } else {
                        completed++;
                        if (completed === indexes.length) {
                            console.log('✅ Flashcard indexes created successfully');
                            resolve();
                        }
                    }
                });
            });
        });
    }

    // ===============================
    // FLASHCARD SET OPERATIONS
    // ===============================

    /**
     * Create a new flashcard set
     */
    async createFlashcardSet(userId, setData) {
        const { name, description, subjectId, topicId, isShared = false } = setData;
        const id = uuidv4();
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO flashcard_sets 
                (id, user_id, name, description, subject_id, topic_id, is_shared) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, userId, name, description, subjectId, topicId, isShared ? 1 : 0],
                function(err) {
                    if (err) {
                        console.error('Error creating flashcard set:', err);
                        reject(err);
                    } else {
                        resolve({ id, ...setData });
                    }
                }
            );
        });
    }

    /**
     * Get all flashcard sets for a user
     */
    async getFlashcardSets(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT fs.*, 
                    COUNT(f.id) as card_count,
                    AVG(fp.mastery_level) as avg_mastery,
                    MAX(fs.updated_at) as last_studied
                FROM flashcard_sets fs
                LEFT JOIN flashcards f ON fs.id = f.set_id
                LEFT JOIN flashcard_progress fp ON f.id = fp.flashcard_id AND fp.user_id = ?
                WHERE fs.user_id = ? OR fs.is_shared = 1
                GROUP BY fs.id
                ORDER BY fs.updated_at DESC`,
                [userId, userId],
                (err, rows) => {
                    if (err) {
                        console.error('Error getting flashcard sets:', err);
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }

    /**
     * Get a specific flashcard set with cards
     */
    async getFlashcardSet(setId, userId) {
        return new Promise((resolve, reject) => {
            // First get the set info
            this.db.get(
                `SELECT * FROM flashcard_sets WHERE id = ? AND (user_id = ? OR is_shared = 1)`,
                [setId, userId],
                (err, set) => {
                    if (err) {
                        console.error('Error getting flashcard set:', err);
                        reject(err);
                    } else if (!set) {
                        resolve(null);
                    } else {
                        // Then get the cards
                        this.getFlashcardsInSet(setId).then(cards => {
                            resolve({ ...set, cards });
                        }).catch(reject);
                    }
                }
            );
        });
    }

    /**
     * Update flashcard set
     */
    async updateFlashcardSet(setId, userId, updates) {
        const { name, description, isShared } = updates;
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE flashcard_sets 
                SET name = ?, description = ?, is_shared = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?`,
                [name, description, isShared ? 1 : 0, setId, userId],
                function(err) {
                    if (err) {
                        console.error('Error updating flashcard set:', err);
                        reject(err);
                    } else if (this.changes === 0) {
                        resolve(null); // Not found or not owned by user
                    } else {
                        resolve({ id: setId, ...updates });
                    }
                }
            );
        });
    }

    /**
     * Delete flashcard set and all its cards
     */
    async deleteFlashcardSet(setId, userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM flashcard_sets WHERE id = ? AND user_id = ?',
                [setId, userId],
                function(err) {
                    if (err) {
                        console.error('Error deleting flashcard set:', err);
                        reject(err);
                    } else {
                        resolve(this.changes > 0);
                    }
                }
            );
        });
    }

    // ===============================
    // FLASHCARD OPERATIONS
    // ===============================

    /**
     * Add a flashcard to a set
     */
    async createFlashcard(setId, userId, cardData) {
        const { front, back, hint, difficulty = 1, tags } = cardData;
        const id = uuidv4();
        
        return new Promise((resolve, reject) => {
            // First verify user owns the set
            this.db.get(
                'SELECT id FROM flashcard_sets WHERE id = ? AND user_id = ?',
                [setId, userId],
                (err, set) => {
                    if (err) {
                        reject(err);
                    } else if (!set) {
                        reject(new Error('Flashcard set not found or not owned by user'));
                    } else {
                        // Create the flashcard
                        this.db.run(
                            `INSERT INTO flashcards 
                            (id, set_id, front, back, hint, difficulty, tags) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [id, setId, front, back, hint, difficulty, JSON.stringify(tags || [])],
                            function(err) {
                                if (err) {
                                    console.error('Error creating flashcard:', err);
                                    reject(err);
                                } else {
                                    resolve({ id, setId, ...cardData });
                                }
                            }
                        );
                    }
                }
            );
        });
    }

    /**
     * Get all flashcards in a set
     */
    async getFlashcardsInSet(setId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM flashcards WHERE set_id = ? ORDER BY created_at',
                [setId],
                (err, rows) => {
                    if (err) {
                        console.error('Error getting flashcards:', err);
                        reject(err);
                    } else {
                        // Parse tags JSON
                        const cards = rows.map(card => ({
                            ...card,
                            tags: card.tags ? JSON.parse(card.tags) : []
                        }));
                        resolve(cards);
                    }
                }
            );
        });
    }

    /**
     * Update a flashcard
     */
    async updateFlashcard(cardId, userId, updates) {
        const { front, back, hint, difficulty, tags } = updates;
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE flashcards 
                SET front = ?, back = ?, hint = ?, difficulty = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND set_id IN (
                    SELECT id FROM flashcard_sets WHERE user_id = ?
                )`,
                [front, back, hint, difficulty, JSON.stringify(tags || []), cardId, userId],
                function(err) {
                    if (err) {
                        console.error('Error updating flashcard:', err);
                        reject(err);
                    } else if (this.changes === 0) {
                        resolve(null);
                    } else {
                        resolve({ id: cardId, ...updates });
                    }
                }
            );
        });
    }

    /**
     * Delete a flashcard
     */
    async deleteFlashcard(cardId, userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `DELETE FROM flashcards 
                WHERE id = ? AND set_id IN (
                    SELECT id FROM flashcard_sets WHERE user_id = ?
                )`,
                [cardId, userId],
                function(err) {
                    if (err) {
                        console.error('Error deleting flashcard:', err);
                        reject(err);
                    } else {
                        resolve(this.changes > 0);
                    }
                }
            );
        });
    }

    // ===============================
    // PROGRESS TRACKING
    // ===============================

    /**
     * Get or create progress record for a flashcard
     */
    async getCardProgress(userId, flashcardId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM flashcard_progress WHERE user_id = ? AND flashcard_id = ?',
                [userId, flashcardId],
                (err, row) => {
                    if (err) {
                        console.error('Error getting card progress:', err);
                        reject(err);
                    } else if (row) {
                        resolve(row);
                    } else {
                        // Create initial progress record
                        this.createInitialProgress(userId, flashcardId)
                            .then(resolve)
                            .catch(reject);
                    }
                }
            );
        });
    }

    async createInitialProgress(userId, flashcardId) {
        const id = uuidv4();
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + 1); // Review again tomorrow
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO flashcard_progress 
                (id, user_id, flashcard_id, next_review_at) 
                VALUES (?, ?, ?, ?)`,
                [id, userId, flashcardId, nextReview.toISOString()],
                function(err) {
                    if (err) {
                        console.error('Error creating initial progress:', err);
                        reject(err);
                    } else {
                        resolve({
                            id,
                            user_id: userId,
                            flashcard_id: flashcardId,
                            mastery_level: 0,
                            correct_streak: 0,
                            total_attempts: 0,
                            correct_attempts: 0,
                            average_response_time: 0,
                            ease_factor: 2.5,
                            interval_days: 1,
                            next_review_at: nextReview.toISOString()
                        });
                    }
                }
            );
        });
    }

    /**
     * Update progress after answering a card
     */
    async updateCardProgress(userId, flashcardId, isCorrect, responseTime) {
        try {
            const progress = await this.getCardProgress(userId, flashcardId);
            const newProgress = this.calculateSpacedRepetition(progress, isCorrect, responseTime);
            
            return new Promise((resolve, reject) => {
                this.db.run(
                    `UPDATE flashcard_progress 
                    SET mastery_level = ?, correct_streak = ?, total_attempts = ?, 
                        correct_attempts = ?, average_response_time = ?, 
                        last_reviewed_at = CURRENT_TIMESTAMP, next_review_at = ?, 
                        ease_factor = ?, interval_days = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ? AND flashcard_id = ?`,
                    [
                        newProgress.mastery_level,
                        newProgress.correct_streak,
                        newProgress.total_attempts,
                        newProgress.correct_attempts,
                        newProgress.average_response_time,
                        newProgress.next_review_at,
                        newProgress.ease_factor,
                        newProgress.interval_days,
                        userId,
                        flashcardId
                    ],
                    function(err) {
                        if (err) {
                            console.error('Error updating card progress:', err);
                            reject(err);
                        } else {
                            resolve(newProgress);
                        }
                    }
                );
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Calculate spaced repetition algorithm (simplified SM-2)
     */
    calculateSpacedRepetition(progress, isCorrect, responseTime) {
        const newProgress = { ...progress };
        
        // Update counters
        newProgress.total_attempts++;
        if (isCorrect) {
            newProgress.correct_attempts++;
            newProgress.correct_streak++;
        } else {
            newProgress.correct_streak = 0;
        }
        
        // Update average response time
        const totalTime = (progress.average_response_time * (progress.total_attempts - 1)) + responseTime;
        newProgress.average_response_time = totalTime / newProgress.total_attempts;
        
        // Spaced repetition calculation
        let easeFactor = progress.ease_factor;
        let interval = progress.interval_days;
        
        if (isCorrect) {
            // Correct answer - increase interval
            if (interval === 0 || interval === 1) {
                interval = 1;
            } else if (interval === 2) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor);
            }
            
            // Adjust ease factor based on response quality (using response time as proxy)
            const quality = responseTime < 3000 ? 5 : responseTime < 8000 ? 4 : 3;
            easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            
            // Update mastery level
            if (newProgress.correct_streak >= 3 && newProgress.mastery_level < 2) {
                newProgress.mastery_level = Math.min(2, newProgress.mastery_level + 1);
            }
        } else {
            // Incorrect answer - reset interval
            interval = 1;
            easeFactor = Math.max(1.3, easeFactor - 0.2);
            
            // Decrease mastery level if consistently wrong
            if (newProgress.correct_streak === 0 && newProgress.total_attempts > 2) {
                newProgress.mastery_level = Math.max(0, newProgress.mastery_level - 1);
            }
        }
        
        // Ensure minimum values
        newProgress.ease_factor = Math.max(1.3, easeFactor);
        newProgress.interval_days = Math.max(1, interval);
        
        // Calculate next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newProgress.interval_days);
        newProgress.next_review_at = nextReview.toISOString();
        
        return newProgress;
    }

    /**
     * Get cards due for review
     */
    async getCardsForReview(userId, setId = null, limit = 20) {
        const now = new Date().toISOString();
        let query = `
            SELECT f.*, fp.mastery_level, fp.correct_streak, fp.next_review_at,
                   fs.name as set_name
            FROM flashcards f
            JOIN flashcard_sets fs ON f.set_id = fs.id
            LEFT JOIN flashcard_progress fp ON f.id = fp.flashcard_id AND fp.user_id = ?
            WHERE (fp.next_review_at IS NULL OR fp.next_review_at <= ?)
              AND (fs.user_id = ? OR fs.is_shared = 1)
        `;
        const params = [userId, now, userId];
        
        if (setId) {
            query += ' AND f.set_id = ?';
            params.push(setId);
        }
        
        query += ' ORDER BY fp.next_review_at ASC, f.created_at LIMIT ?';
        params.push(limit);
        
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Error getting cards for review:', err);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Record a study session
     */
    async recordStudySession(userId, setId, studyMode, cardsStudied, cardsCorrect, durationSeconds) {
        const id = uuidv4();
        
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO flashcard_sessions 
                (id, user_id, set_id, study_mode, cards_studied, cards_correct, duration_seconds) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, userId, setId, studyMode, cardsStudied, cardsCorrect, durationSeconds],
                function(err) {
                    if (err) {
                        console.error('Error recording study session:', err);
                        reject(err);
                    } else {
                        resolve({
                            id,
                            userId,
                            setId,
                            studyMode,
                            cardsStudied,
                            cardsCorrect,
                            durationSeconds
                        });
                    }
                }
            );
        });
    }

    /**
     * Get study statistics
     */
    async getStudyStats(userId, days = 7) {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - days);
        
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT 
                    DATE(completed_at) as study_date,
                    COUNT(*) as sessions,
                    SUM(cards_studied) as total_cards,
                    SUM(cards_correct) as total_correct,
                    SUM(duration_seconds) as total_time
                FROM flashcard_sessions 
                WHERE user_id = ? AND completed_at >= ?
                GROUP BY DATE(completed_at)
                ORDER BY study_date DESC`,
                [userId, dateThreshold.toISOString()],
                (err, rows) => {
                    if (err) {
                        console.error('Error getting study stats:', err);
                        reject(err);
                    } else {
                        resolve(rows || []);
                    }
                }
            );
        });
    }
}

module.exports = FlashcardsDbService;