export const EnvConfiguration = () => ({
  environment: process.env.NODE_ENV || 'dev',
  port: +process.env.PORT || 3000,
  db_uri: process.env.DB_URI,
  db_name: process.env.DB_NAME,
  jwt_secret: process.env.JWT_SECRET,
  url_app: process.env.URL_APP,
  url_fullerton: process.env.URL_FULLERTON,
  client_id_fullerton: process.env.CLIENT_ID_FULLERTON,
  hash: +process.env.HASH || 10,
  secret_key_fullerton: process.env.SECRET_KEY_FULLERTON,
  url_defontana: process.env.URL_DEFONTANA,
});
