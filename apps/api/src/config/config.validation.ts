import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  API_BASE_URL: Joi.string().uri().default('http://localhost:3001'),
  WEB_BASE_URL: Joi.string().uri().default('http://localhost:3000'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // Bcrypt
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(8).max(15).default(12),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_CURRENCY: Joi.string().default('usd'),

  // AWS S3
  AWS_REGION: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  AWS_S3_PRESIGNED_URL_EXPIRES: Joi.number().default(3600),

  // Vimeo
  VIMEO_ACCESS_TOKEN: Joi.string().required(),
  VIMEO_CLIENT_ID: Joi.string().required(),
  VIMEO_CLIENT_SECRET: Joi.string().required(),

  // Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  EMAIL_FROM_NAME: Joi.string().default('Jethro Academy'),
  EMAIL_FROM_ADDRESS: Joi.string().email().required(),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Sentry (optional)
  SENTRY_DSN: Joi.string().uri().optional(),
}).options({ allowUnknown: false });
