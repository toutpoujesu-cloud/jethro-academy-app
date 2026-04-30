import { UserRole } from './user.types';

// ── Token Pair ────────────────────────────────────────────────────────────────
export interface ITokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;  // seconds
}

// ── JWT Payload ───────────────────────────────────────────────────────────────
export interface IJwtPayload {
  sub:   string;     // User UUID
  email: string;
  role:  UserRole;
  iat?:  number;
  exp?:  number;
}

// ── Refresh Token JWT Payload ─────────────────────────────────────────────────
export interface IRefreshJwtPayload {
  sub:     string;
  tokenId: string;  // DB RefreshToken record ID (allows selective revocation)
  iat?:    number;
  exp?:    number;
}

// ── Auth Response ─────────────────────────────────────────────────────────────
export interface IAuthResponse {
  user:   { id: string; email: string; firstName: string; lastName: string; role: UserRole };
  tokens: ITokenPair;
}
