# Use Node.js 20 LTS
FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ pkgconfig

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p src/uploads

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]