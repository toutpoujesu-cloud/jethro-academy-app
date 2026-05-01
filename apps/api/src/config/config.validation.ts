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

  // Stripe — optional in development (payments feature disabled until keys provided)
  STRIPE_SECRET_KEY:      Joi.string().optional().default('sk_test_placeholder'),
  STRIPE_PUBLISHABLE_KEY: Joi.string().optional().default('pk_test_placeholder'),
  STRIPE_WEBHOOK_SECRET:  Joi.string().optional().default('whsec_placeholder'),
  STRIPE_CURRENCY:        Joi.string().default('usd'),

  // AWS S3 — optional in development (upload feature disabled until keys provided)
  AWS_REGION:            Joi.string().optional().default('us-east-1'),
  AWS_ACCESS_KEY_ID:     Joi.string().optional().default('placeholder'),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional().default('placeholder'),
  AWS_S3_BUCKET:         Joi.string().optional().default('jethro-uploads'),
  AWS_S3_PRESIGNED_URL_EXPIRES: Joi.number().default(3600),

  // Vimeo — optional in development
  VIMEO_ACCESS_TOKEN: Joi.string().optional().default('placeholder'),
  VIMEO_CLIENT_ID:    Joi.string().optional().default('placeholder'),
  VIMEO_CLIENT_SECRET:Joi.string().optional().default('placeholder'),

  // Email — optional in development (emails logged to console instead)
  SMTP_HOST:           Joi.string().optional().default('localhost'),
  SMTP_PORT:           Joi.number().default(587),
  SMTP_SECURE:         Joi.boolean().default(false),
  SMTP_USER:           Joi.string().optional().default('dev@jethro.academy'),
  SMTP_PASS:           Joi.string().optional().default('placeholder'),
  EMAIL_FROM_NAME:     Joi.string().default('Jethro Academy'),
  EMAIL_FROM_ADDRESS:  Joi.string().email().optional().default('noreply@jethro.academy'),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Sentry (optional)
  SENTRY_DSN: Joi.string().uri().optional(),
}).options({ allowUnknown: true });
