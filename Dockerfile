# Use Node.js 20 LTS
FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ pkgconfig

# Set working directory
WORKDIR /app

# Copy package.json (package-lock.json is in .gitignore)
COPY package.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application code
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p src/uploads src/data
RUN chmod -R 755 src/uploads src/data

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]