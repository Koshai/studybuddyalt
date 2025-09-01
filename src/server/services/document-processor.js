// src/server/services/document-processor.js - Document text extraction service

const { v4: uuidv4 } = require('uuid');

class DocumentProcessor {
    constructor() {
        // Simple document processor without external service dependencies
    }

    async processDocument(fileBuffer, filename, mimeType) {
        console.log(`📄 Processing document: ${filename} (${mimeType})`);
        
        try {
            let extractedText = '';
            let wordCount = 0;

            switch (mimeType) {
                case 'application/pdf':
                    extractedText = await this.processPDFBuffer(fileBuffer);
                    break;
                    
                case 'text/html':
                    extractedText = this.processHTML(fileBuffer.toString('utf8'));
                    break;
                    
                case 'text/plain':
                    extractedText = fileBuffer.toString('utf8');
                    break;
                    
                case 'text/markdown':
                    extractedText = this.processMarkdown(fileBuffer.toString('utf8'));
                    break;
                    
                case 'application/msword':
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    // For now, treat as plain text - could add mammoth.js later for proper DOC/DOCX parsing
                    extractedText = fileBuffer.toString('utf8');
                    break;
                    
                default:
                    throw new Error(`Unsupported file type: ${mimeType}`);
            }

            // Clean and process the text
            extractedText = this.cleanText(extractedText);
            wordCount = this.countWords(extractedText);

            console.log(`✅ Document processed: ${wordCount} words extracted`);

            return {
                content: extractedText,
                word_count: wordCount,
                file_type: mimeType
            };

        } catch (error) {
            console.error(`❌ Error processing document ${filename}:`, error);
            throw new Error(`Failed to process ${filename}: ${error.message}`);
        }
    }

    async processPDFBuffer(buffer) {
        try {
            const pdf = require('pdf-parse');
            
            console.log('📄 Processing PDF buffer...');
            const data = await pdf(buffer, {
                max: 0, // Process all pages
                version: 'v1.10.100'
            });
            
            console.log(`📄 PDF processed: ${data.numpages} pages, ${data.text?.length || 0} characters`);
            return data.text || '';
            
        } catch (error) {
            console.error('❌ PDF processing error:', error);
            throw new Error(`PDF processing failed: ${error.message}`);
        }
    }

    processHTML(htmlContent) {
        // Simple HTML processing - remove tags and decode entities
        let text = htmlContent
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
            .replace(/<[^>]*>/g, ' ') // Remove HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
            
        return text;
    }

    processMarkdown(markdownContent) {
        // Simple markdown processing - remove markdown syntax
        return markdownContent
            .replace(/^#{1,6}\s+/gm, '') // Remove headers
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
            .replace(/\*([^*]+)\*/g, '$1') // Remove italic
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
            .replace(/`([^`]+)`/g, '$1') // Remove inline code
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/^\s*[-*+]\s+/gm, '• '); // Convert lists to bullet points
    }

    cleanText(text) {
        if (!text) return '';
        
        return text
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            // Remove excessive line breaks
            .replace(/\n{3,}/g, '\n\n')
            // Remove page numbers and common artifacts
            .replace(/^\d+\s*$/gm, '')
            .replace(/^Page \d+.*$/gm, '')
            // Remove form feed and special characters
            .replace(/\f/g, '')
            .replace(/\u00A0/g, ' ')
            // Clean up and trim
            .trim();
    }

    countWords(text) {
        if (!text) return 0;
        return text
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0)
            .length;
    }

    // Create database record for processed file - match existing table structure
    createFileRecord(userId, topicId, filename, content, wordCount) {
        return {
            // Don't specify id - let Supabase generate it
            user_id: userId, // This should already be UUID from auth
            topic_id: topicId, // This should already be UUID
            file_name: filename,
            content: content,
            word_count: wordCount
            // Don't specify timestamps - let database defaults handle them
        };
    }
}

module.exports = DocumentProcessor;