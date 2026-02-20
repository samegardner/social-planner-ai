FROM node:20-alpine AS base

# Install build tools for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Create a seed DB with all tables (using drizzle-kit push)
RUN mkdir -p data && npx drizzle-kit push --force

# Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache python3 make g++
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone output
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

# Copy seed DB (used on first deploy when volume is empty)
COPY --from=base /app/data/social-planner.db /app/seed.db

# Symlink /app/data -> /data (persistent volume mount point)
RUN ln -s /data /app/data && mkdir -p /data

EXPOSE 3000

# On first run, seed the DB if volume is empty, then start server
CMD sh -c 'if [ ! -f /data/social-planner.db ]; then cp /app/seed.db /data/social-planner.db; echo "Seeded empty database"; fi && node server.js'
