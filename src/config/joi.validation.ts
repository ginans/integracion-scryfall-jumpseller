import * as Joi from 'joi';
export const JoiValidationSchema = Joi.object({
  ENVIRONMENT: Joi.string().valid('dev', 'prod', 'test').default('dev'),
  PORT: Joi.number().default(8000),
  APP_NAME: Joi.string().default('NestJS API'),
  JWT_SECRET: Joi.string().required(),
  URL_APP: Joi.string().required(),
  HASH: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_URI: Joi.string().required(),
  CACHE_HOST: Joi.string().required(),
  CACHE_PORT: Joi.number().default(6379),
  URL_FULLERTON: Joi.string().required(),
  CLIENT_ID_FULLERTON: Joi.string().required(),
  SECRET_KEY_FULLERTON: Joi.string().required(),
});
