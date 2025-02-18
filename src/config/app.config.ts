export const EnvConfiguration = () => ({
  node_env: process.env.NODE_ENV || 'development',
  port: +process.env.PORT || 8000,
  app_name: process.env.APP_NAME || 'NestJS API',
  jwt_secret: process.env.JWT_SECRET,
  url_backend: process.env.URL_APP_BACKEND || 'http://localhost:8000',
  url_frontend: process.env.URL_APP_FRONTEND || 'http://localhost:8000',
  hash: process.env.HASH,
  db_name: process.env.DB_NAME,
  db_uri: process.env.DB_URI,
  cache_url: process.env.CACHE_URL || 'redis://localhost:6379',
  JWT_HOURS_EXPIRE: +process.env.JWT_HOURS_EXPIRE || 2,
});
