#!/bin/bash
# scripts/start-simplified.sh - Startup script for simplified StudyAI

echo "🧠 Starting StudyAI Simplified..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Step 1: Checking dependencies...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are installed${NC}"

# Check if Ollama is running
echo -e "${BLUE}🔄 Step 2: Checking Ollama...${NC}"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama is running${NC}"
else
    echo -e "${YELLOW}⚠️ Ollama is not running or not installed${NC}"
    echo -e "${YELLOW}Please start Ollama or install it from: https://ollama.ai${NC}"
    echo -e "${YELLOW}Required model: llama3.2:3b${NC}"
    echo -e "${YELLOW}Run: ollama pull llama3.2:3b${NC}"
fi

# Install dependencies if needed
echo -e "${BLUE}🔄 Step 3: Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing npm packages...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Reset database if requested
if [ "$1" = "--reset-db" ]; then
    echo -e "${BLUE}🔄 Step 4: Resetting database...${NC}"
    node scripts/reset-database-simplified.js --with-test-data
    echo -e "${GREEN}✅ Database reset with test data${NC}"
fi

# Create necessary directories
echo -e "${BLUE}🔄 Step 5: Creating directories...${NC}"
mkdir -p src/data
mkdir -p src/uploads
echo -e "${GREEN}✅ Directories created${NC}"

# Start the server
echo -e "${BLUE}🔄 Step 6: Starting server...${NC}"
echo -e "${GREEN}🚀 Starting StudyAI Simplified Server...${NC}"
echo -e "${GREEN}📱 Frontend will be available at: http://localhost:3000${NC}"
echo -e "${GREEN}🔌 API will be available at: http://localhost:3001${NC}"
echo -e "${GREEN}🧪 Test endpoint: http://localhost:3001/api/test-ollama-simple${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start with node directly pointing to the fixed server file
NODE_ENV=development node src/server/index.js