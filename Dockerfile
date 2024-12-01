FROM node:20-alpine

# Establecer el directorio de trabajo
WORKDIR /usr/src/app

# Instalar dependencias y herramientas necesarias en una sola capa
RUN apk add --no-cache yarn && \
    yarn global add pm2 && \
    yarn install --frozen-lockfile

# Copiar el resto de los archivos
COPY . .

# Construir la aplicación
RUN yarn run build

# Exponer el puerto
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]