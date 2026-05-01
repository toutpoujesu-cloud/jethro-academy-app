import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { IAuthResponse, IJwtPayload, IRefreshJwtPayload } from '@jethro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma:         PrismaService,
    private readonly jwtService:     JwtService,
    private readonly configService:  ConfigService,
  ) {}

  // ── Register ───────────────────────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<IAuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const saltRounds = this.configService.get<number>('jwt.bcryptSaltRounds', 12);
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email:        dto.email.toLowerCase().trim(),
        passwordHash,
        firstName:    dto.firstName.trim(),
        lastName:     dto.lastName.trim(),
        role:         UserRole.LEARNER,
        status:       UserStatus.ACTIVE,
        timezone:     dto.timezone ?? 'UTC',
      },
    });

    this.logger.log(`New learner registered: ${user.email}`);
    return this.generateAuthResponse(user.id, user.email, user.role);
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<IAuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.email}`);
    return this.generateAuthResponse(user.id, user.email, user.role);
  }

  // ── Refresh ────────────────────────────────────────────────────────────────
  async refresh(userId: string, tokenId: string): Promise<IAuthResponse> {
    // Rotate: revoke the used refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data:  { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    return this.generateAuthResponse(user.id, user.email, user.role);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async logout(userId: string): Promise<{ message: string }> {
    // Revoke ALL refresh tokens for this user (logout from all devices)
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data:  { revokedAt: new Date() },
    });
    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Logged out successfully' };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async generateAuthResponse(
    userId: string,
    email:  string,
    role:   UserRole,
  ): Promise<IAuthResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email, role),
      this.generateRefreshToken(userId),
    ]);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    return {
      user: user as unknown as IAuthResponse['user'],
      tokens: {
        accessToken,
        refreshToken: refreshToken.token,
        expiresIn: 15 * 60, // 15 minutes in seconds
      },
    };
  }

  private generateAccessToken(userId: string, email: string, role: UserRole): Promise<string> {
    const payload: IJwtPayload = { sub: userId, email, role: role as unknown as IJwtPayload['role'] };
    return this.jwtService.signAsync(payload, {
      secret:    this.configService.getOrThrow<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn', '15m'),
    });
  }

  private async generateRefreshToken(userId: string): Promise<{ token: string }> {
    const tokenId   = uuidv4();
    const rawToken  = uuidv4() + '-' + uuidv4(); // ~72 bytes of entropy
    const saltRounds = this.configService.get<number>('jwt.bcryptSaltRounds', 12);
    const tokenHash = await bcrypt.hash(rawToken, saltRounds);

    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '30d');
    const days = parseInt(refreshExpiresIn.replace('d', ''), 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Build JWT wrapping the tokenId (enables selective revocation)
    const payload: IRefreshJwtPayload = { sub: userId, tokenId };
    const jwtToken = await this.jwtService.signAsync(payload, {
      secret:    this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiresIn,
    });

    // Store hashed raw token in DB
    await this.prisma.refreshToken.create({
      data: { id: tokenId, userId, tokenHash, expiresAt },
    });

    return { token: jwtToken };
  }
}
