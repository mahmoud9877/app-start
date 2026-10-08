import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global so every module's repository can inject PrismaService
// without importing DatabaseModule.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
