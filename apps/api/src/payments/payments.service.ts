import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrollmentSource, PaymentStatus, CouponType } from '@prisma/client';
import Stripe from 'stripe';
import { IJwtPayload } from '@jethro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto, GrantAccessDto } from './dto/create-checkout.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma:        PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(configService.getOrThrow<string>('stripe.secretKey'), {
      apiVersion: '2024-06-20',
    });
  }

  // ── Create Stripe Checkout Session ────────────────────────────────────────
  async createCheckout(dto: CreateCheckoutDto, user: IJwtPayload) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');

    // Check if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.sub, courseId: dto.courseId } },
    });
    if (existing) throw new ConflictException('You are already enrolled in this course');

    let discountAmount = 0;
    let couponId: string | undefined;

    // Validate coupon if provided
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.couponCode.toUpperCase() } });

      if (!coupon || !coupon.isActive) throw new BadRequestException('Coupon code is invalid or inactive');
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Coupon has expired');
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Coupon usage limit reached');

      // Check course scope
      if (coupon.scope === 'COURSE') {
        const courseCoupon = await this.prisma.couponCourse.findUnique({
          where: { couponId_courseId: { couponId: coupon.id, courseId: course.id } },
        });
        if (!courseCoupon) throw new BadRequestException('This coupon does not apply to this course');
      }

      discountAmount = coupon.type === CouponType.PERCENT
        ? Math.round(course.price * (coupon.value / 100))
        : Math.min(coupon.value, course.price);
      couponId = coupon.id;
    }

    const finalAmount = Math.max(0, course.price - discountAmount);

    // Free course (100% discount) — enroll directly
    if (finalAmount === 0) {
      await this.enrollUser(user.sub, course.id, EnrollmentSource.COUPON_FREE, undefined, couponId);
      if (couponId) {
        await this.prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }
      return { enrolled: true, message: 'Enrolled successfully (coupon covered full price)' };
    }

    const webBaseUrl = this.configService.get<string>('app.webBaseUrl', 'http://localhost:3000');
    const session = await this.stripe.checkout.sessions.create({
      mode:          'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency:     course.currency,
          product_data: { name: course.title, description: course.description ?? undefined },
          unit_amount:  finalAmount,
        },
        quantity: 1,
      }],
      metadata: {
        userId:   user.sub,
        courseId: course.id,
        couponId: couponId ?? '',
      },
      success_url: dto.successUrl ?? `${webBaseUrl}/courses?enrolled=true`,
      cancel_url:  dto.cancelUrl  ?? `${webBaseUrl}/courses`,
    });

    // Record pending payment
    await this.prisma.payment.create({
      data: {
        userId:         user.sub,
        courseId:       course.id,
        couponId:       couponId ?? null,
        stripeSessionId: session.id,
        amount:         finalAmount,
        currency:       course.currency,
        status:         PaymentStatus.PENDING,
      },
    });

    this.logger.log(`Checkout session created: ${session.id} for user=${user.sub} course=${course.id}`);
    return { checkoutUrl: session.url };
  }

  // ── Stripe Webhook ────────────────────────────────────────────────────────
  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.getOrThrow<string>('stripe.webhookSecret');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  // ── Admin: manually grant access ──────────────────────────────────────────
  async grantAccess(dto: GrantAccessDto, granter: IJwtPayload) {
    const [user, course] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
      this.prisma.course.findUnique({ where: { id: dto.courseId } }),
    ]);

    if (!user)   throw new NotFoundException('User not found');
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: dto.userId, courseId: dto.courseId } },
    });
    if (existing) throw new ConflictException('User is already enrolled in this course');

    const enrollment = await this.enrollUser(
      dto.userId, dto.courseId, EnrollmentSource.ADMIN_GRANT, granter.sub,
    );

    this.logger.log(`Access granted: user=${dto.userId} course=${dto.courseId} by=${granter.email}`);
    return enrollment;
  }

  // ── Learner: payment history ──────────────────────────────────────────────
  async getHistory(user: IJwtPayload) {
    return this.prisma.payment.findMany({
      where:   { userId: user.sub },
      include: { course: { select: { id: true, title: true, thumbnailUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Check enrollment ──────────────────────────────────────────────────────
  async checkEnrollment(courseId: string, userId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    return !!enrollment;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async enrollUser(
    userId:      string,
    courseId:    string,
    source:      EnrollmentSource,
    grantedById?: string,
    _couponId?:  string,
  ) {
    return this.prisma.enrollment.create({
      data: { userId, courseId, source, grantedById: grantedById ?? null },
    });
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const { userId, courseId, couponId } = session.metadata ?? {};
    if (!userId || !courseId) return;

    // Idempotency: skip if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      this.logger.warn(`Duplicate checkout.session.completed — already enrolled: ${session.id}`);
      return;
    }

    await Promise.all([
      this.prisma.payment.update({
        where: { stripeSessionId: session.id },
        data:  {
          status:                PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: session.payment_intent as string,
        },
      }),
      this.enrollUser(userId, courseId, EnrollmentSource.PURCHASE),
      couponId
        ? this.prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } })
        : Promise.resolve(),
    ]);

    this.logger.log(`Enrollment created via Stripe: user=${userId} course=${courseId}`);
  }

  private async handlePaymentFailed(intent: Stripe.PaymentIntent) {
    await this.prisma.payment.updateMany({
      where: { stripePaymentIntentId: intent.id },
      data:  { status: PaymentStatus.FAILED },
    });
    this.logger.warn(`Payment failed: intent=${intent.id}`);
  }
}
