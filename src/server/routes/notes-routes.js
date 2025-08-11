// src/server/routes/notes-routes.js - Note management routes
const express = require('express');
const router = express.Router();

// Import services
const ServiceFactory = require('../services/service-factory');
const authMiddleware = require('../middleware/auth-middleware');

/**
 * GET /api/notes
 * Get all notes for authenticated user
 */
router.get('/', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const storage = ServiceFactory.getStorageService();
        
        const notes = await storage.getAllNotesForUser(userId);
        console.log(`📄 Retrieved ${notes.length} notes for user ${userId}`);
        res.json(notes);
    } catch (error) {
        console.error('❌ Get all notes error:', error);
        res.status(500).json({
            error: 'Failed to fetch notes',
            details: error.message
        });
    }
});

/**
 * GET /api/notes/:noteId
 * Get specific note by ID
 */
router.get('/:noteId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { noteId } = req.params;
        const userId = req.user.id;
        
        // Note: This is a simplified approach - in a more secure system,
        // you'd want to verify the note belongs to the user
        const storage = ServiceFactory.getStorageService();
        const notes = await storage.getAllNotesForUser(userId);
        const note = notes.find(n => n.id === noteId);
        
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        res.json(note);
    } catch (error) {
        console.error('❌ Get note error:', error);
        res.status(500).json({
            error: 'Failed to fetch note',
            details: error.message
        });
    }
});

/**
 * PUT /api/notes/:noteId
 * Update note content and metadata
 */
router.put('/:noteId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { noteId } = req.params;
        const { content, file_name } = req.body;
        const userId = req.user.id;
        
        if (!content) {
            return res.status(400).json({ error: 'Note content is required' });
        }
        
        console.log(`✏️ Updating note ${noteId} for user ${userId}`);
        
        const storage = ServiceFactory.getStorageService();
        const updatedNote = await storage.updateNote(noteId, userId, content);
        
        console.log('✅ Note updated successfully');
        res.json(updatedNote);
    } catch (error) {
        console.error('❌ Update note error:', error);
        res.status(500).json({
            error: 'Failed to update note',
            details: error.message
        });
    }
});

/**
 * DELETE /api/notes/:noteId
 * Delete a note
 */
router.delete('/:noteId', authMiddleware.authenticateToken, async (req, res) => {
    try {
        const { noteId } = req.params;
        const userId = req.user.id;
        
        console.log(`🗑️ Deleting note ${noteId} for user ${userId}`);
        
        const storage = ServiceFactory.getStorageService();
        await storage.deleteNote(noteId, userId);
        
        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete note error:', error);
        res.status(500).json({
            error: 'Failed to delete note',
            details: error.message
        });
    }
});

module.exports = router;