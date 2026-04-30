import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import stripeConfig from './config/stripe.config';
import s3Config from './config/s3.config';
import vimeoConfig from './config/vimeo.config';
import emailConfig from './config/email.config';
import { configValidationSchema } from './config/config.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExpertiseAreasModule } from './expertise-areas/expertise-areas.module';
import { CoursesModule } from './courses/courses.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

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
      { name: 'short',  ttl: 1000,  limit: 10  },  // 10 req/sec
      { name: 'medium', ttl: 10000, limit: 50  },  // 50 req/10s
      { name: 'long',   ttl: 60000, limit: 200 },  // 200 req/min
    ]),

    // ── Database ─────────────────────────────────
    PrismaModule,

    // ── Feature modules ──────────────────────────
    AuthModule,
    UsersModule,
    ExpertiseAreasModule,
    CoursesModule,
    ModulesModule,
    LessonsModule,
    // ReviewModule, UploadsModule, ProgressModule, PaymentsModule,
    // CertificatesModule, NotificationsModule, ReportsModule
    // LessonsModule, ProgressModule, PaymentsModule,
    // CertificatesModule, NotificationsModule, ReportsModule
  ],
  providers: [
    // Global rate-limit guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global JWT guard — all routes protected unless @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global RBAC guard — enforces @Roles() where applied
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
