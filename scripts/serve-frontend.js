// scripts/serve-frontend.js - Simple frontend server
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../src/frontend')));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🎨 Frontend server running at http://localhost:${PORT}`);
  console.log(`🔌 Make sure backend is running at http://localhost:3001`);
});

module.exports = app;