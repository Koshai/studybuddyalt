// scripts/fix-file-upload.js - Quick fix for file upload issues

const fs = require('fs');
const path = require('path');

function fixServerFile() {
  const serverPath = path.join(__dirname, '../src/server/index.js');
  
  if (!fs.existsSync(serverPath)) {
    console.error('❌ Server file not found at:', serverPath);
    return;
  }
  
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Check if the fix is already applied
  if (serverContent.includes('text/plain') && serverContent.includes('application/txt')) {
    console.log('✅ File upload fix already applied!');
    return;
  }
  
  // Find and replace the fileFilter function
  const oldFileFilter = /fileFilter:\s*\(req,\s*file,\s*cb\)\s*=>\s*{[\s\S]*?}\s*}/;
  
  const newFileFilter = `fileFilter: (req, file, cb) => {
    console.log(\`🔍 File upload attempt: \${file.originalname} (\${file.mimetype})\`);
    
    // Allowed file extensions
    const allowedExtensions = /\\.(jpeg|jpg|png|gif|pdf|doc|docx|txt)$/i;
    
    // Allowed MIME types
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      
      // Text files
      'text/plain',
      'text/txt',
      'application/txt',
      'text/csv'
    ];
    
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    
    console.log(\`📋 File validation:\`);
    console.log(\`   File: \${file.originalname}\`);
    console.log(\`   MIME type: \${file.mimetype}\`);
    console.log(\`   Extension valid: \${extname}\`);
    console.log(\`   MIME type valid: \${mimetype}\`);
    
    if (mimetype && extname) {
      console.log(\`✅ File accepted: \${file.originalname}\`);
      return cb(null, true);
    } else {
      console.log(\`❌ File rejected: \${file.originalname}\`);
      console.log(\`   Supported extensions: .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx, .txt\`);
      console.log(\`   Supported MIME types: \${allowedMimeTypes.join(', ')}\`);
      
      const error = new Error(\`File type not supported. Supported formats: images (jpg, png, gif), PDFs, Word documents (.doc, .docx), and text files (.txt)\`);
      error.code = 'INVALID_FILE_TYPE';
      cb(error);
    }
  }`;
  
  if (oldFileFilter.test(serverContent)) {
    // Replace the old fileFilter
    serverContent = serverContent.replace(oldFileFilter, newFileFilter);
    
    // Create backup
    fs.writeFileSync(serverPath + '.backup', fs.readFileSync(serverPath));
    console.log('📄 Created backup:', serverPath + '.backup');
    
    // Write fixed version
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Applied file upload fix to server!');
    console.log('🔄 Restart your server to apply changes');
    
  } else {
    console.log('⚠️ Could not find fileFilter function to replace');
    console.log('🔧 Please manually update the multer configuration');
  }
}

function createTestFile() {
  const testDir = path.join(__dirname, '../test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  const testFilePath = path.join(testDir, 'test-upload.txt');
  const testContent = `This is a test file for StudyAI upload functionality.

Testing file upload with text content.
Created on: ${new Date().toISOString()}

This file should be accepted by the upload system.`;

  fs.writeFileSync(testFilePath, testContent);
  console.log('📝 Created test file:', testFilePath);
  
  return testFilePath;
}

function runTests() {
  console.log('🧪 Testing file upload fix...\n');
  
  // Test file extension detection
  const testFiles = [
    'document.txt',
    'image.jpg', 
    'presentation.pdf',
    'spreadsheet.xlsx',  // Should be rejected
    'archive.zip'        // Should be rejected
  ];
  
  const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt)$/i;
  
  testFiles.forEach(filename => {
    const isAllowed = allowedExtensions.test(filename);
    console.log(`${isAllowed ? '✅' : '❌'} ${filename}: ${isAllowed ? 'ALLOWED' : 'REJECTED'}`);
  });
  
  // Test MIME types
  console.log('\n🔍 MIME Type Tests:');
  const testMimeTypes = [
    'text/plain',           // ✅ Should be allowed
    'image/jpeg',          // ✅ Should be allowed  
    'application/pdf',     // ✅ Should be allowed
    'application/zip',     // ❌ Should be rejected
    'video/mp4'           // ❌ Should be rejected
  ];
  
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/txt', 'application/txt', 'text/csv'
  ];
  
  testMimeTypes.forEach(mimeType => {
    const isAllowed = allowedMimeTypes.includes(mimeType);
    console.log(`${isAllowed ? '✅' : '❌'} ${mimeType}: ${isAllowed ? 'ALLOWED' : 'REJECTED'}`);
  });
}

// Main execution
console.log('🔧 StudyAI File Upload Fix\n');

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--fix')) {
    fixServerFile();
  } else if (args.includes('--test-file')) {
    const testFile = createTestFile();
    console.log(`\n📋 Test file created: ${testFile}`);
    console.log('🧪 Test command:');
    console.log(`curl -X POST -F "file=@${testFile}" http://localhost:3001/api/test-upload`);
  } else if (args.includes('--test')) {
    runTests();
  } else {
    console.log('Available options:');
    console.log('  --fix       Apply the file upload fix');
    console.log('  --test-file Create a test file');
    console.log('  --test      Run validation tests');
    console.log('');
    console.log('Quick fix: node scripts/fix-file-upload.js --fix');
  }
}

module.exports = { fixServerFile, createTestFile, runTests };