FROM node:20-alpine AS base

# Install build tools for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Create data directory
RUN mkdir -p /app/data

# The agent script runs as a long-lived process
CMD ["npx", "tsx", "scripts/agent.ts"]
