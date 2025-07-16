# 🧠 Offline Study AI

An intelligent, offline-first study companion that transforms your notes into personalized practice questions using local AI models. No internet required, no data sent to external services.

## ✨ Features

- **📚 Multi-Subject Organization**: Organize study materials by subject and topic
- **🔤 OCR Text Extraction**: Convert handwritten notes and images to text using Tesseract.js
- **📄 PDF Processing**: Extract text from PDF documents and textbooks
- **🤖 AI Question Generation**: Generate unlimited practice questions using local Ollama models
- **🎯 Adaptive Difficulty**: Easy, medium, and hard question levels
- **📱 Cross-Platform**: Web, desktop (Electron), and mobile (Capacitor) support
- **🔒 Privacy-First**: Everything runs locally - your data never leaves your device
- **🚫 Offline-Ready**: No internet connection required after setup

## 🏗️ Architecture

```
Frontend (React/HTML)
├── Web App (Vite)
├── Desktop App (Electron)
└── Mobile Apps (Capacitor)

Backend (Node.js/Express)
├── File Upload & Processing
├── OCR Service (Tesseract.js)
├── PDF Processing
└── Database (SQLite)

AI Layer
└── Ollama (Local LLM)
    ├── Llama 3.2 3B
    ├── Phi-3 Mini
    └── Custom Models
```

## 🚀 Quick Start

### Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/offline-study-ai.git
cd offline-study-ai

# Run the setup script
chmod +x setup.sh
./setup.sh

# Start the application
npm run dev
```

### Manual Setup

1. **Prerequisites**
   ```bash
   # Install Node.js 18+
   node --version  # Should be 18.0.0 or higher
   
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   # or visit https://ollama.ai/download
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup AI Models**
   ```bash
   # Start Ollama service
   ollama serve
   
   # Install recommended models
   ollama pull llama3.2:3b      # Primary model (3.8GB)
   ollama pull phi3:mini        # Backup model (2.2GB)
   ```

4. **Start the Application**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm run preview
   ```

5. **Access the App**
   - Web: http://localhost:3000
   - API: http://localhost:3001

## 📖 Usage Guide

### 1. Create Subjects and Topics
- Navigate to the Subjects tab
- Click "Add Subject" (e.g., "History", "Biology", "Mathematics")
- Create topics within subjects (e.g., "Civil War", "Cell Biology", "Calculus")

### 2. Upload Study Materials
- Go to the Upload tab
- Select subject and topic
- Upload files:
  - **Images**: Handwritten notes, textbook pages, whiteboards
  - **PDFs**: Textbooks, lecture slides, research papers
  - **Documents**: Word docs, text files

### 3. Generate Practice Questions
- Navigate to the Practice tab
- Select a subject and topic
- Choose "Generate New Questions" for AI-created questions
- Or "Load Random Questions" for previously generated ones

### 4. Study and Practice
- Answer questions in your own words
- Check answers and get immediate feedback
- Track your progress and accuracy

## 🔧 Configuration

### Environment Variables
```bash
# .env file
NODE_ENV=development
PORT=3001
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
DATABASE_PATH=./src/data/study_ai.db
UPLOAD_PATH=./src/uploads
MAX_FILE_SIZE=50MB
```

### Supported File Types
- **Images**: JPG, PNG, GIF, WEBP
- **Documents**: PDF, DOC, DOCX, TXT
- **Maximum size**: 50MB per file

### AI Models

| Model | Size | Best For | Performance |
|-------|------|----------|-------------|
| Llama 3.2 3B | 3.8GB | Balanced quality/speed | Recommended |
| Phi-3 Mini | 2.2GB | Quick responses | Good for older hardware |
| Mistral 7B | 7GB | High quality | Requires more RAM |

## 📱 Platform-Specific Builds

### Desktop App (Electron)
```bash
# Development
npm run electron

# Build distributables
npm run electron:build
```

### Mobile Apps (Capacitor)

#### iOS
```bash
# Setup
npm run capacitor:ios
cd ios && xcode-select --install

# Build in Xcode
open ios/App/App.xcworkspace
```

#### Android
```bash
# Setup
npm run capacitor:android

# Build
cd android && ./gradlew assembleDebug
```

## 🐳 Docker Deployment

### Quick Start with Docker
```bash
# Build and run
docker-compose up -d

# Access at http://localhost:3000
```

### Custom Docker Build
```bash
# Build image
docker build -t offline-study-ai .

# Run container
docker run -p 3000:3000 -p 3001:3001 -p 11434:11434 \
  -v $(pwd)/data:/app/src/data \
  offline-study-ai
```

## 🔧 Development

### Project Structure
```
offline-study-ai/
├── src/
│   ├── server/
│   │   ├── index.js              # Express server
│   │   └── services/
│   │       ├── database.js       # SQLite operations
│   │       ├── ollama.js         # AI integration
│   │       ├── ocr.js           # Image processing
│   │       └── pdf.js           # PDF processing
│   ├── uploads/                  # File uploads
│   └── data/                     # SQLite database
├── index.html                    # Frontend app
├── package.json                  # Dependencies
├── vite.config.js               # Build configuration
├── capacitor.config.ts          # Mobile configuration
└── docker-compose.yml           # Container setup
```

### API Endpoints

#### Subjects
- `GET /api/subjects` - List all subjects
- `POST /api/subjects` - Create new subject

#### Topics
- `GET /api/subjects/:id/topics` - List topics for subject
- `POST /api/subjects/:id/topics` - Create new topic

#### File Processing
- `POST /api/upload` - Upload and process files

#### Questions
- `POST /api/topics/:id/generate-questions` - Generate new questions
- `GET /api/topics/:id/questions` - Get all questions
- `GET /api/topics/:id/random-questions` - Get random questions

#### AI Models
- `GET /api/ollama/models` - List available models
- `POST /api/ollama/pull` - Download new model

### Adding New AI Models

1. **Download Model**
   ```bash
   ollama pull model-name
   ```

2. **Update Configuration**
   ```javascript
   // In src/server/services/ollama.js
   this.defaultModel = 'your-model-name';
   ```

3. **Test Integration**
   ```bash
   curl -X POST http://localhost:3001/api/ollama/models
   ```

## 🎯 Advanced Features

### Custom Question Templates
Modify question generation prompts in `src/server/services/ollama.js`:

```javascript
const customPrompt = `
Create ${count} ${difficulty} questions about: ${topic}
Focus on: ${focusAreas}
Format: ${preferredFormat}
`;
```

### Batch Processing
Process multiple files at once:

```bash
# CLI utility (future feature)
npm run batch-process --subject="Biology" --topic="Cells" --directory="./materials/"
```

### Export/Import Data
```bash
# Export study data
npm run export --format=json --output=backup.json

# Import from backup
npm run import --file=backup.json
```

## 🛠️ Troubleshooting

### Common Issues

1. **Ollama Not Starting**
   ```bash
   # Check if Ollama is running
   ps aux | grep ollama
   
   # Restart Ollama
   ollama serve
   ```

2. **OCR Not Working**
   - Ensure images are clear and high-contrast
   - Try different image formats
   - Check console for Tesseract errors

3. **Questions Not Generating**
   - Verify Ollama models are downloaded: `ollama list`
   - Check if study materials have enough content
   - Review server logs for AI processing errors

4. **Mobile Build Issues**
   ```bash
   # Clear Capacitor cache
   npx cap clean
   npx cap sync
   ```

### Performance Optimization

1. **For Older Hardware**
   - Use Phi-3 Mini model instead of Llama 3.2
   - Reduce concurrent file processing
   - Lower image resolution before OCR

2. **For Better Quality**
   - Use Llama 3.2 7B or Mistral 7B
   - Increase context window size
   - Add more detailed study materials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines
- Follow ESLint configuration
- Add tests for new features
- Update documentation
- Ensure offline functionality

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Ollama** - Local AI model serving
- **Tesseract.js** - OCR processing
- **SQLite** - Local database
- **React** - Frontend framework
- **Electron** - Desktop app framework
- **Capacitor** - Mobile app framework

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: Wiki

---

**Built with ❤️ for students who value privacy and offline learning**