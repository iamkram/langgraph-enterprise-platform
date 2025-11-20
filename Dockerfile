# Multi-stage build for optimized production image

# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY client/package.json ./client/

# Install pnpm
RUN npm install -g pnpm@8

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY client ./client
COPY shared ./shared
COPY tsconfig.json ./

# Build frontend
RUN pnpm --filter client build

# Stage 2: Build backend
FROM node:22-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/

# Install pnpm
RUN npm install -g pnpm@8

# Install dependencies (production only)
RUN pnpm install --frozen-lockfile --prod

# Copy source code
COPY server ./server
COPY shared ./shared
COPY drizzle ./drizzle
COPY tsconfig.json ./

# Stage 3: Production image
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy built frontend
COPY --from=frontend-builder /app/client/dist ./client/dist

# Copy backend dependencies and source
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/server ./server
COPY --from=backend-builder /app/shared ./shared
COPY --from=backend-builder /app/drizzle ./drizzle
COPY --from=backend-builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server/_core/index.js"]
