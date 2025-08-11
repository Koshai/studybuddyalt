#!/bin/sh

# Start Ollama in background
ollama serve &

# Wait for Ollama to start
sleep 5

# Pull models if not available
ollama list | grep -q "llama3.2:3b" || ollama pull llama3.2:3b &

# Start the application
npm run dev
