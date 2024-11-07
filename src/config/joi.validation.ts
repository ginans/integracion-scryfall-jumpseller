import * as Joi from 'joi';
export const JoiValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DB_URI: Joi.required(),
  DB_NAME: Joi.string().required(),
  JWT_SECRET: Joi.required(),
  URL_APP: Joi.required(),
  URL_FULLERTON: Joi.string().required(),
  CLIENT_ID_FULLERTON: Joi.string().required(),
  SECRET_KEY_FULLERTON: Joi.string().required(),
  HASH: Joi.string().required(),
});
