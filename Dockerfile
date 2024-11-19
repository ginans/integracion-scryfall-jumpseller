FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache yarn && \
    yarn global add pm2
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn run build
EXPOSE 3000
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]