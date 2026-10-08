import { Injectable } from '@nestjs/common';
import { RolesPermissionsRepository } from './roles-permissions.repository';

@Injectable()
export class RolesPermissionsService {
  constructor(
    private readonly rolesPermissionsRepository: RolesPermissionsRepository,
  ) {}
}
