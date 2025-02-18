import * as Joi from 'joi';
export const JoiValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production').default('developer'),
  PORT: Joi.number().default(8000),
  APP_NAME: Joi.string().default('NestJS API'),
  JWT_SECRET: Joi.string().required(),
  URL_APP_BACKEND: Joi.string().required(),
  URL_APP_FRONTEND: Joi.string().required(),
  HASH: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_URI: Joi.string().required(),
  CACHE_URL: Joi.string().required(),
});
