import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedAdmin } from '../common/types/authenticated-user';
import { CentralPrismaService } from '../central/central-prisma.service';

export const ADMIN_JWT_STRATEGY = 'admin-jwt';

interface AdminJwtPayload {
  sub: string;
}

// Verifies super admin tokens, signed with ADMIN_JWT_SECRET (never JWT_SECRET),
// so a tenant user's token can't be replayed against /admin.
@Injectable()
export class AdminJwtStrategy extends PassportStrategy(
  Strategy,
  ADMIN_JWT_STRATEGY,
) {
  constructor(
    config: ConfigService,
    private readonly central: CentralPrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('ADMIN_JWT_SECRET'),
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AuthenticatedAdmin> {
    const admin = await this.central.superAdmin.findUnique({
      where: { id: payload.sub },
    });
    if (!admin) {
      throw new UnauthorizedException();
    }
    return { id: admin.id, email: admin.email };
  }
}
