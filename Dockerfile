# Establecer base image
FROM node:22-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copiar archivos del package
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN npm install -g pnpm @nestjs/cli && \
    pnpm install

# Builder stage
FROM base AS builder
WORKDIR /app

# Copiar dependencias y código fuente
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Construir la aplicación
RUN npx @nestjs/cli build

# Runner stage (producción)
FROM base AS runner
WORKDIR /app

# Instalar PM2 y dependencias de producción
RUN apk add --no-cache npm && \
    npm install -g pm2 pnpm && \
    npm cache clean --force

# Crear un usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Crear directorio de logs y asignar permisos
RUN mkdir -p /app/logs && chown -R nestjs:nestjs /app/logs

# Copiar archivos de producción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/ecosystem.config.js ./

# Instalar dependencias de producción
RUN pnpm install --prod

# Establecer el usuario
USER nestjs

# Configurar el entorno
ARG PORT=8000
ENV PORT=$PORT \
    NODE_ENV=production

EXPOSE $PORT

# Iniciar la aplicación
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
