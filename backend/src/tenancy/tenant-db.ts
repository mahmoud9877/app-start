import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import type { TenantClient } from './tenant-client';
import { ResolvedTenant, TenantClsStore } from './tenancy.constants';

// Inject this in tenant-scoped services: `this.db.client.user.findMany()`.
// The client is the current request's tenant database, set by TenantMiddleware.
@Injectable()
export class TenantDb {
  constructor(private readonly cls: ClsService<TenantClsStore>) {}

  get client(): TenantClient {
    const client = this.cls.get('tenantClient');
    if (!client) {
      // Only reachable if a tenant service is called outside a tenant request
      // (e.g. from an /admin route). That's a bug, not a client error.
      throw new InternalServerErrorException(
        'No tenant in the current context',
      );
    }
    return client;
  }

  get tenant(): ResolvedTenant {
    const tenant = this.cls.get('tenant');
    if (!tenant) {
      throw new InternalServerErrorException(
        'No tenant in the current context',
      );
    }
    return tenant;
  }
}
