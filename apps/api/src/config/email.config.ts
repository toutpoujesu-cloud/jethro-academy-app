import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  host:        process.env.SMTP_HOST,
  port:        parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure:      process.env.SMTP_SECURE === 'true',
  user:        process.env.SMTP_USER,
  pass:        process.env.SMTP_PASS,
  fromName:    process.env.EMAIL_FROM_NAME ?? 'Jethro Academy',
  fromAddress: process.env.EMAIL_FROM_ADDRESS,
}));
