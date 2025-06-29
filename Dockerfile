# Multi-stage build for HomeVault
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci --only=production

# Build stage
FROM base AS builder

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S homevault -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=homevault:nodejs /app/backend ./backend
COPY --from=builder --chown=homevault:nodejs /app/frontend/build ./frontend/build
COPY --from=builder --chown=homevault:nodejs /app/package*.json ./
COPY --from=builder --chown=homevault:nodejs /app/server.js ./

# Create uploads directory
RUN mkdir -p uploads && chown homevault:nodejs uploads

# Switch to non-root user
USER homevault

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start application
CMD ["node", "server.js"] 