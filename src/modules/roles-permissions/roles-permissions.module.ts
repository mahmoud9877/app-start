import { Module } from '@nestjs/common';
import { RolesPermissionsController } from './roles-permissions.controller';
import { RolesPermissionsRepository } from './roles-permissions.repository';
import { RolesPermissionsService } from './roles-permissions.service';

@Module({
  controllers: [RolesPermissionsController],
  providers: [RolesPermissionsService, RolesPermissionsRepository],
  exports: [RolesPermissionsService],
})
export class RolesPermissionsModule {}
