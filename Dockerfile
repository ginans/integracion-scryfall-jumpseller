FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN apk add --no-cache yarn && \
    yarn install --production --frozen-lockfile
COPY . .
RUN yarn run build
FROM node:22-alpine AS runtime
WORKDIR /usr/src/app
RUN apk add --no-cache yarn && \
    yarn global add pm2
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/ecosystem.config.js ./ecosystem.config.js
ARG PORT=8000
ENV PORT=$PORT
EXPOSE $PORT
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]

