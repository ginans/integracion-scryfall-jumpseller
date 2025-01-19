FROM node:22-alpine
LABEL authors="ElTioWise"

WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++ && \
    npm install -g pnpm @nestjs/cli

COPY package.json pnpm-lock.yaml /node_modules ./

RUN pnpm install

COPY . .

EXPOSE 8000

CMD ["pnpm", "run", "start:dev"]