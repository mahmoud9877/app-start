import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Read-only, cross-module queries for reporting. Never writes.
@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}
}
