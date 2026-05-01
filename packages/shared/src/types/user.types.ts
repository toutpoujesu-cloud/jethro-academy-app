// ── User Roles ────────────────────────────────────────────────────────────────
export enum UserRole {
  SUPER_ADMIN  = 'SUPER_ADMIN',
  CONTENT_ADMIN = 'CONTENT_ADMIN',
  INSTRUCTOR   = 'INSTRUCTOR',
  LEARNER      = 'LEARNER',
}

// ── User Status ───────────────────────────────────────────────────────────────
export enum UserStatus {
  ACTIVE    = 'ACTIVE',
  INACTIVE  = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  INVITED   = 'INVITED',   // Instructor invited, hasn't set password yet
}

// ── Core User Interface ───────────────────────────────────────────────────────
export interface IUser {
  id:          string;
  email:       string;
  firstName:   string;
  lastName:    string;
  role:        UserRole;
  status:      UserStatus;
  avatarUrl:   string | null;
  bio:         string | null;
  phoneNumber: string | null;
  country:     string | null;
  timezone:    string | null;
  createdAt:   Date;
  updatedAt:   Date;
  deletedAt:   Date | null;  // Soft delete
}

// ── Safe user (no password hash) ─────────────────────────────────────────────
export type SafeUser = Omit<IUser, never>;  // All public fields are already safe

