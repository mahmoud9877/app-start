import { Global, Module } from '@nestjs/common';
import { CentralPrismaService } from './central-prisma.service';

@Global()
@Module({
  providers: [CentralPrismaService],
  exports: [CentralPrismaService],
})
export class CentralModule {}
