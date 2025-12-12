# Backend Dockerfile - Optimized for smaller size
FROM node:20-alpine

# Install only essential FFmpeg components (smaller than full ffmpeg)
RUN apk add --no-cache ffmpeg

# Create app directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install production dependencies only, skip optional native modules
RUN npm ci --omit=dev --omit=optional && \
    npm cache clean --force

# Copy source code
COPY . .

# Create required directories
RUN mkdir -p uploads temp outputs

# Remove unnecessary files to reduce size
RUN rm -rf .git .gitignore *.md tests

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# Start the server
CMD ["node", "server.js"]
