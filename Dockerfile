# Stage 1: Build the frontend
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies needed for build
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:20-slim

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --production && npm install tsx

# Copy built assets and server code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start server using tsx to run the TypeScript entry point
CMD ["npx", "tsx", "server.ts"]
