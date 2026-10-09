import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TenantDb } from '../tenancy/tenant-db';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { TenantJwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: TenantDb,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findForLogin(dto.email);
    const passwordMatches =
      user !== null && (await bcrypt.compare(dto.password, user.password));
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: TenantJwtPayload = {
      sub: user.id,
      tenant: this.db.tenant.slug,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      // Listed explicitly so the password hash can't slip into the response.
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
