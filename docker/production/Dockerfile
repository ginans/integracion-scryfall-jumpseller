# Establish base image
FROM node:22-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm @nestjs/cli && \
    pnpm install

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npx @nestjs/cli build

# Runner stage (production)
FROM base AS runner
WORKDIR /app

# Install PM2 and production dependencies
RUN apk add --no-cache npm && \
    npm install -g pm2 pnpm && \
    npm cache clean --force

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy production files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/ecosystem.config.js ./

# Install production dependencies only
RUN pnpm install --prod

# Set user
USER nestjs

# Configure environment
ARG PORT=8000
ENV PORT=$PORT \
    NODE_ENV=production

EXPOSE $PORT

# Start the application
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]