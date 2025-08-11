// src/server/services/patterns-manager.js
// Manages successful question patterns for future reuse

class PatternsManager {
  constructor() {
    this.successfulPatterns = new Map();
    console.log('🔄 PatternsManager initialized');
  }

  /**
   * Store successful patterns for future use
   */
  storeSuccessfulPatterns(subjectId, questions) {
    if (!this.successfulPatterns.has(subjectId)) {
      this.successfulPatterns.set(subjectId, []);
    }
    
    const patterns = this.successfulPatterns.get(subjectId);
    
    // Add new patterns
    questions.forEach(q => {
      patterns.push({
        question: q.question,
        options: q.options,
        type: q.type,
        createdAt: new Date(),
        questionLength: q.question.length,
        hasNumbers: /\d+/.test(q.question)
      });
    });
    
    // Keep only last 20 successful patterns per subject
    if (patterns.length > 20) {
      patterns.splice(0, patterns.length - 20);
    }
    
    console.log(`📚 Stored ${questions.length} patterns for ${subjectId} (total: ${patterns.length})`);
  }

  /**
   * Get successful patterns for a subject
   */
  getSuccessfulPatterns(subjectId) {
    return this.successfulPatterns.get(subjectId) || [];
  }

  /**
   * Get a random successful pattern for a subject
   */
  getRandomPattern(subjectId) {
    const patterns = this.getSuccessfulPatterns(subjectId);
    if (patterns.length === 0) {
      return null;
    }
    
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  /**
   * Get patterns similar to a given question style
   */
  getSimilarPatterns(subjectId, referenceQuestion, maxResults = 5) {
    const patterns = this.getSuccessfulPatterns(subjectId);
    if (patterns.length === 0) {
      return [];
    }
    
    const refLength = referenceQuestion.length;
    const hasNumbers = /\d+/.test(referenceQuestion);
    
    // Score patterns by similarity
    const scoredPatterns = patterns.map(pattern => {
      let score = 0;
      
      // Length similarity (prefer similar lengths)
      const lengthDiff = Math.abs(pattern.questionLength - refLength);
      score += Math.max(0, 100 - lengthDiff);
      
      // Number presence similarity
      if (pattern.hasNumbers === hasNumbers) {
        score += 50;
      }
      
      // Keyword similarity (basic)
      const refWords = referenceQuestion.toLowerCase().split(/\s+/);
      const patternWords = pattern.question.toLowerCase().split(/\s+/);
      const commonWords = refWords.filter(word => patternWords.includes(word));
      score += commonWords.length * 10;
      
      return { pattern, score };
    });
    
    // Sort by score and return top patterns
    return scoredPatterns
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.pattern);
  }

  /**
   * Get pattern statistics for a subject
   */
  getPatternStats(subjectId) {
    const patterns = this.getSuccessfulPatterns(subjectId);
    
    if (patterns.length === 0) {
      return {
        count: 0,
        avgLength: 0,
        hasNumbers: 0,
        oldestPattern: null,
        newestPattern: null
      };
    }
    
    const avgLength = patterns.reduce((sum, p) => sum + p.questionLength, 0) / patterns.length;
    const numbersCount = patterns.filter(p => p.hasNumbers).length;
    const dates = patterns.map(p => p.createdAt).sort();
    
    return {
      count: patterns.length,
      avgLength: Math.round(avgLength),
      numbersPercentage: Math.round((numbersCount / patterns.length) * 100),
      oldestPattern: dates[0],
      newestPattern: dates[dates.length - 1]
    };
  }

  /**
   * Clear old patterns (older than specified days)
   */
  clearOldPatterns(subjectId, daysOld = 30) {
    const patterns = this.getSuccessfulPatterns(subjectId);
    if (patterns.length === 0) {
      return 0;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const filteredPatterns = patterns.filter(p => p.createdAt > cutoffDate);
    const removedCount = patterns.length - filteredPatterns.length;
    
    if (removedCount > 0) {
      this.successfulPatterns.set(subjectId, filteredPatterns);
      console.log(`🧹 Removed ${removedCount} old patterns for ${subjectId}`);
    }
    
    return removedCount;
  }

  /**
   * Get best performing pattern types for a subject
   */
  getBestPatternTypes(subjectId) {
    const patterns = this.getSuccessfulPatterns(subjectId);
    if (patterns.length === 0) {
      return [];
    }
    
    // Analyze pattern characteristics
    const characteristics = {
      short: patterns.filter(p => p.questionLength < 50).length,
      medium: patterns.filter(p => p.questionLength >= 50 && p.questionLength < 100).length,
      long: patterns.filter(p => p.questionLength >= 100).length,
      withNumbers: patterns.filter(p => p.hasNumbers).length,
      withoutNumbers: patterns.filter(p => !p.hasNumbers).length
    };
    
    // Return sorted characteristics
    return Object.entries(characteristics)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count, percentage: Math.round((count / patterns.length) * 100) }));
  }

  /**
   * Export patterns for backup
   */
  exportPatterns(subjectId = null) {
    if (subjectId) {
      return {
        subject: subjectId,
        patterns: this.getSuccessfulPatterns(subjectId),
        exportedAt: new Date()
      };
    }
    
    const allPatterns = {};
    for (const [subject, patterns] of this.successfulPatterns.entries()) {
      allPatterns[subject] = patterns;
    }
    
    return {
      allSubjects: allPatterns,
      exportedAt: new Date()
    };
  }

  /**
   * Import patterns from backup
   */
  importPatterns(data) {
    try {
      if (data.subject && data.patterns) {
        // Import single subject
        this.successfulPatterns.set(data.subject, data.patterns);
        console.log(`📥 Imported ${data.patterns.length} patterns for ${data.subject}`);
        return { success: true, imported: data.patterns.length };
      }
      
      if (data.allSubjects) {
        // Import all subjects
        let totalImported = 0;
        for (const [subject, patterns] of Object.entries(data.allSubjects)) {
          this.successfulPatterns.set(subject, patterns);
          totalImported += patterns.length;
        }
        console.log(`📥 Imported ${totalImported} patterns for ${Object.keys(data.allSubjects).length} subjects`);
        return { success: true, imported: totalImported };
      }
      
      return { success: false, error: 'Invalid import data format' };
      
    } catch (error) {
      console.error('❌ Error importing patterns:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset all patterns for a subject
   */
  resetPatterns(subjectId) {
    const patterns = this.getSuccessfulPatterns(subjectId);
    const count = patterns.length;
    
    this.successfulPatterns.set(subjectId, []);
    console.log(`🔄 Reset ${count} patterns for ${subjectId}`);
    
    return count;
  }

  /**
   * Get overall statistics across all subjects
   */
  getOverallStats() {
    let totalPatterns = 0;
    let totalSubjects = 0;
    const subjectBreakdown = {};
    
    for (const [subject, patterns] of this.successfulPatterns.entries()) {
      totalPatterns += patterns.length;
      totalSubjects++;
      subjectBreakdown[subject] = patterns.length;
    }
    
    return {
      totalPatterns,
      totalSubjects,
      averagePatternsPerSubject: totalSubjects > 0 ? Math.round(totalPatterns / totalSubjects) : 0,
      subjectBreakdown
    };
  }

  /**
   * Find patterns matching specific criteria
   */
  findPatterns(criteria) {
    const results = [];
    
    for (const [subjectId, patterns] of this.successfulPatterns.entries()) {
      const matchingPatterns = patterns.filter(pattern => {
        let matches = true;
        
        if (criteria.minLength && pattern.questionLength < criteria.minLength) {
          matches = false;
        }
        
        if (criteria.maxLength && pattern.questionLength > criteria.maxLength) {
          matches = false;
        }
        
        if (criteria.hasNumbers !== undefined && pattern.hasNumbers !== criteria.hasNumbers) {
          matches = false;
        }
        
        if (criteria.keywords && criteria.keywords.length > 0) {
          const questionLower = pattern.question.toLowerCase();
          const hasKeywords = criteria.keywords.some(keyword => 
            questionLower.includes(keyword.toLowerCase())
          );
          if (!hasKeywords) {
            matches = false;
          }
        }
        
        if (criteria.createdAfter && pattern.createdAt < criteria.createdAfter) {
          matches = false;
        }
        
        return matches;
      });
      
      if (matchingPatterns.length > 0) {
        results.push({
          subject: subjectId,
          patterns: matchingPatterns
        });
      }
    }
    
    return results;
  }
}

module.exports = PatternsManager;