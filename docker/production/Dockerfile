ARG IMAGE=node:22-alpine
###################
# BUILD FOR PRODUCTION
###################
FROM $IMAGE AS builder
ENV NODE_ENV build
USER node
WORKDIR /home/node
RUN apk add --no-cache yarn
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && \
    yarn cache clean \
COPY --chown=node:node . .
RUN yarn build
###################
# PRODUCTION
###################
FROM $IMAGE AS production
USER node
WORKDIR /home/node
RUN npm install -g pm2 && \
    npm cache clean --force
COPY --chown=nodejs:nodejs --from=build /usr/src/app/dist ./dist
COPY --chown=nodejs:nodejs --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=build /usr/src/app/package.json ./
COPY --chown=nodejs:nodejs --from=build /usr/src/app/ecosystem.config.js ./
COPY --chown=nodejs:nodejs --from=build /usr/src/app/.env.production ./.env.production
ARG PORT=8000
ENV PORT=$PORT \
    NODE_ENV=production
EXPOSE $PORT
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]