FROM node:22-alpine AS base
LABEL authors="ElTioWise"

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --shamefully-hoist

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm install -g @nestjs/cli && \
    nest build

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache npm && \
    npm install -g pm2 pnpm && \
    npm cache clean --force

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Creamos y asignamos permisos a los directorios necesarios
RUN mkdir -p /app/logs && \
    mkdir -p /app/dist && \
    chown -R nestjs:nodejs /app

# Copiamos los archivos necesarios
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nestjs:nodejs /app/ecosystem.config.js ./ecosystem.config.js
COPY --from=builder --chown=nestjs:nodejs /app/docker/prod/.env ./.env

# Instalamos dependencias como el usuario nestjs
USER nestjs
RUN pnpm install --prod --frozen-lockfile --shamefully-hoist

# Verificamos que los archivos existan
RUN ls -la /app && \
    echo "Verificando ecosystem.config.js:" && \
    cat /app/ecosystem.config.js

ARG PORT=8000
ENV PORT=$PORT \
    NODE_ENV=production

EXPOSE $PORT

CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]