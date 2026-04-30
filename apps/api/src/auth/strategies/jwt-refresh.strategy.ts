import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as bcrypt from 'bcrypt';
import { IRefreshJwtPayload } from '@jethro/shared';
import { PrismaService } from '../../prisma/prisma.service';

export interface RefreshTokenRequest {
  sub:     string;
  tokenId: string;
  token:   string; // Raw token injected by strategy for hash comparison
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: { body: { refreshToken: string } },
    payload: IRefreshJwtPayload,
  ): Promise<RefreshTokenRequest> {
    const rawToken = req.body.refreshToken;

    // Look up the stored token record
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
    });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    if (tokenRecord.userId !== payload.sub) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    // Verify hash
    const isValid = await bcrypt.compare(rawToken, tokenRecord.tokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    return { sub: payload.sub, tokenId: payload.tokenId, token: rawToken };
  }
}
