import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv:    process.env.NODE_ENV ?? 'development',
  port:       parseInt(process.env.PORT ?? '3001', 10),
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001',
  webBaseUrl: process.env.WEB_BASE_URL ?? 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
}));
