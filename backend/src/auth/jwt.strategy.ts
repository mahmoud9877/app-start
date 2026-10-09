import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { TenantDb } from '../tenancy/tenant-db';

export interface TenantJwtPayload {
  sub: string;
  tenant: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly db: TenantDb,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: TenantJwtPayload): Promise<AuthenticatedUser> {
    // All tenants share JWT_SECRET, so this check is what stops alpha's token
    // from being used with `x-tenant: nile`.
    if (payload.tenant !== this.db.tenant.slug) {
      throw new UnauthorizedException('Token does not belong to this company');
    }

    // Re-checked on every request so deactivated/deleted users lose access
    // immediately rather than when their token expires.
    const user = await this.db.client.user.findFirst({
      where: { id: payload.sub, isActive: true, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      tenant: payload.tenant,
    };
  }
}
