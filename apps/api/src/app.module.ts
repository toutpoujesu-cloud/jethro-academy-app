import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import stripeConfig from './config/stripe.config';
import s3Config from './config/s3.config';
import vimeoConfig from './config/vimeo.config';
import emailConfig from './config/email.config';
import { configValidationSchema } from './config/config.validation';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // ── Config (global, validated at startup) ────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, stripeConfig, s3Config, vimeoConfig, emailConfig],
      validationSchema: configValidationSchema,
      validationOptions: { abortEarly: true },
    }),

    // ── Rate limiting ────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000,  limit: 10 },   // 10 req/sec
      { name: 'medium', ttl: 10000, limit: 50 },   // 50 req/10s
      { name: 'long', ttl: 60000, limit: 200 },    // 200 req/min
    ]),

    // ── Database ─────────────────────────────────
    PrismaModule,

    // Feature modules will be imported here as they are built:
    // AuthModule, UsersModule, CoursesModule, ModulesModule,
    // LessonsModule, ProgressModule, PaymentsModule,
    // CertificatesModule, NotificationsModule, ReportsModule
  ],
})
export class AppModule {}
