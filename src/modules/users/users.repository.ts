import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// The only place in this module that talks to Prisma.
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: { email: string; name: string; password: string }) {
    return this.prisma.user.create({ data });
  }
}
