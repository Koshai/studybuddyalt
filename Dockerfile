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
