# Build stage for frontend
FROM node:20-alpine AS client-build
WORKDIR /app/Client
COPY Client/package*.json ./
RUN npm ci
COPY Client/ ./
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built frontend
COPY --from=client-build /app/Client/dist ./Client/dist

# Create uploads and logs directories
RUN mkdir -p server/uploads logs

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server/index.js"]
