// ── Payment Status ────────────────────────────────────────────────────────────
export enum PaymentStatus {
  PENDING   = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED    = 'FAILED',
  REFUNDED  = 'REFUNDED',
}

// ── Enrollment Source ─────────────────────────────────────────────────────────
export enum EnrollmentSource {
  PURCHASE     = 'PURCHASE',      // Paid via Stripe
  COUPON_FREE  = 'COUPON_FREE',   // 100% discount coupon
  ADMIN_GRANT  = 'ADMIN_GRANT',   // Manually granted by admin
  COMPLIMENTARY = 'COMPLIMENTARY',
}

// ── Coupon Type ───────────────────────────────────────────────────────────────
export enum CouponType {
  PERCENT = 'PERCENT',   // e.g. 20 = 20% off
  FIXED   = 'FIXED',     // e.g. 1000 = $10.00 off (in cents)
}

// ── Coupon Scope ──────────────────────────────────────────────────────────────
export enum CouponScope {
  COURSE  = 'COURSE',    // Applies to specific course(s)
  GLOBAL  = 'GLOBAL',    // Applies to any course
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface IPayment {
  id:               string;
  userId:           string;
  courseId:         string;
  couponId:         string | null;
  stripeSessionId:  string;
  stripePaymentIntentId: string | null;
  amount:           number;     // In cents
  currency:         string;     // ISO 4217
  status:           PaymentStatus;
  metadata:         unknown;    // JSON
  createdAt:        Date;
  updatedAt:        Date;
}

export interface IEnrollment {
  id:        string;
  userId:    string;
  courseId:  string;
  paymentId: string | null;
  source:    EnrollmentSource;
  grantedById: string | null;   // Admin who granted access
  expiresAt: Date | null;       // Optional access expiry
  createdAt: Date;
}

export interface ICoupon {
  id:          string;
  code:        string;
  type:        CouponType;
  value:       number;          // Percentage or cents
  scope:       CouponScope;
  courseIds:   string[];        // Empty = all courses (GLOBAL scope)
  maxUses:     number | null;   // null = unlimited
  usedCount:   number;
  expiresAt:   Date | null;
  isActive:    boolean;
  createdById: string;
  createdAt:   Date;
  updatedAt:   Date;
}
