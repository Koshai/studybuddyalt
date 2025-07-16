#!/bin/bash

# Offline Study AI Setup Script

echo "🧠 Offline Study AI Setup"
echo "========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama is not installed."
    echo "📥 Installing Ollama..."
    
    # Install Ollama based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://ollama.ai/install.sh | sh
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Please install Ollama from https://ollama.ai/download"
        echo "Or use: brew install ollama"
        read -p "Press enter when Ollama is installed..."
    else
        echo "Please install Ollama from https://ollama.ai/download"
        read -p "Press enter when Ollama is installed..."
    fi
else
    echo "✅ Ollama detected"
fi

# Start Ollama service
echo "🚀 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!
sleep 3

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p src/uploads
mkdir -p src/data
mkdir -p src/server/services
mkdir -p assets

# Download and install recommended AI models
echo "🤖 Setting up AI models..."
echo "This may take a while as models are large files..."

# Install Llama 3.2 3B (recommended for balance of performance and quality)
echo "📥 Downloading Llama 3.2 3B model..."
ollama pull llama3.2:3b

# Install Phi-3 Mini as backup (smaller, faster)
echo "📥 Downloading Phi-3 Mini model..."
ollama pull phi3:mini

# Test Ollama connection
echo "🧪 Testing Ollama connection..."
if ollama list | grep -q "llama3.2:3b"; then
    echo "✅ Llama 3.2 3B model ready"
else
    echo "⚠️  Llama 3.2 3B model not found, using available models"
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Set up Electron (optional)
read -p "🖥️  Do you want to set up desktop app? (y/n): " setup_desktop
if [[ $setup_desktop == "y" || $setup_desktop == "Y" ]]; then
    echo "🖥️  Setting up Electron..."
    npm install electron electron-builder --save-dev
    echo "✅ Desktop app ready"
fi

# Set up mobile (optional)
read -p "📱 Do you want to set up mobile apps? (y/n): " setup_mobile
if [[ $setup_mobile == "y" || $setup_mobile == "Y" ]]; then
    echo "📱 Setting up Capacitor..."
    npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android --save-dev
    npx cap init
    echo "✅ Mobile setup ready"
    echo "📝 To build for mobile:"
    echo "   iOS: npm run capacitor:ios"
    echo "   Android: npm run capacitor:android"
fi

# Create sample data
echo "📄 Creating sample configuration..."
cat > .env << EOF
# Offline Study AI Configuration
NODE_ENV=development
PORT=3001
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
DATABASE_PATH=./src/data/study_ai.db
UPLOAD_PATH=./src/uploads
MAX_FILE_SIZE=50MB
EOF

# Create Docker setup (optional)
read -p "🐳 Do you want to create Docker setup? (y/n): " setup_docker
if [[ $setup_docker == "y" || $setup_docker == "Y" ]]; then
    echo "🐳 Creating Docker configuration..."
    
    cat > Dockerfile << EOF
FROM node:18-alpine

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p src/uploads src/data

# Expose ports
EXPOSE 3000 3001 11434

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
EOF

    cat > docker-compose.yml << EOF
version: '3.8'

services:
  study-ai:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
      - "11434:11434"
    volumes:
      - ./src/data:/app/src/data
      - ./src/uploads:/app/src/uploads
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  # Optional: Add database backup service
  backup:
    image: alpine:latest
    volumes:
      - ./src/data:/data
      - ./backups:/backups
    command: |
      sh -c "
        while true; do
          tar -czf /backups/backup-\$(date +%Y%m%d-%H%M%S).tar.gz /data
          find /backups -name '*.tar.gz' -mtime +7 -delete
          sleep 86400
        done
      "
    restart: unless-stopped
EOF

    cat > start.sh << EOF
#!/bin/sh

# Start Ollama in background
ollama serve &

# Wait for Ollama to start
sleep 5

# Pull models if not available
ollama list | grep -q "llama3.2:3b" || ollama pull llama3.2:3b &

# Start the application
npm run dev
EOF

    echo "✅ Docker setup created"
    echo "🐳 To run with Docker: docker-compose up"
fi

# Final setup steps
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "🌐 Access the app at:"
echo "   http://localhost:3000"
echo ""
echo "🔧 API will be available at:"
echo "   http://localhost:3001"
echo ""
echo "🤖 Ollama models installed:"
ollama list
echo ""
echo "📚 Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Create your first subject"
echo "3. Upload study materials (images, PDFs, docs)"
echo "4. Generate practice questions"
echo ""
echo "💡 Tips:"
echo "- For better OCR results, use clear, high-contrast images"
echo "- Upload multiple files per topic for better question generation"
echo "- Try different difficulty levels for varied practice"
echo ""

# Cleanup
if [ ! -z "$OLLAMA_PID" ]; then
    echo "🧹 Cleaning up..."
    # Keep Ollama running for immediate use
fi

echo "✨ Ready to study smart with AI!"