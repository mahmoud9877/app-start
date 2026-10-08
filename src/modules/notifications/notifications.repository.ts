import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// The only place in this module that talks to Prisma.
@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}
}
