FROM node:22-alpine AS base
LABEL authors="ElTioWise"

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && \
    pnpm install

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN apk add --no-cache npm && \
    npm install -g pm2 pnpm && \
    npm cache clean --force

# Creamos y asignamos permisos a los directorios necesarios
RUN mkdir -p /app/logs && \
    chown -R nestjs:nodejs /app
production
# Copiamos los archivos necesarios
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nestjs:nodejs /app/docker/prod/.env ./.env

# Instalamos dependencias como el usuario nestjs
ARG PORT=8000
ENV PORT=$PORT \
    NODE_ENV=production
EXPOSE $PORT
CMD ["pnpm", "run", "dev"]