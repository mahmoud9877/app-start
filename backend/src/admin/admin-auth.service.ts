import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CentralPrismaService } from '../central/central-prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly central: CentralPrismaService,
    // Configured with ADMIN_JWT_SECRET in AdminModule.
    private readonly jwt: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.central.superAdmin.findUnique({
      where: { email: dto.email },
    });
    const passwordMatches =
      admin !== null && (await bcrypt.compare(dto.password, admin.password));
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      accessToken: await this.jwt.signAsync({ sub: admin.id }),
      admin: { id: admin.id, email: admin.email },
    };
  }
}
