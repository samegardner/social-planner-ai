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

# Copy drizzle migrations (needed at runtime for DB setup)
COPY --from=base /app/drizzle ./drizzle

# Symlink /app/data -> /data (persistent volume mount point)
RUN ln -s /data /app/data && mkdir -p /data

EXPOSE 3000

CMD ["node", "server.js"]
