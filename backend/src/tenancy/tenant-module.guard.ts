import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantDb } from './tenant-db';
import {
  CORE,
  isGrantActive,
  REQUIRED_MODULE_KEY,
  TENANT_MODULES,
  TenantModuleKey,
} from './tenant-modules';

// Global guard: a route marked @RequiresModule('x') is only reachable by
// tenants with an unexpired grant for x. @CoreModule() routes and /admin
// routes (no metadata) pass through.
@Injectable()
export class TenantModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: TenantDb,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      TenantModuleKey | typeof CORE | undefined
    >(REQUIRED_MODULE_KEY, [context.getHandler(), context.getClass()]);
    if (!required || required === CORE) {
      return true;
    }

    const name = TENANT_MODULES[required];
    // Grants come from the middleware cache, which admin changes invalidate.
    // Expiry is checked against the current time, so it applies on the dot.
    const grant = this.db.tenant.modules.find((m) => m.module === required);
    if (!grant) {
      throw new ForbiddenException(
        `Your company has not subscribed to the ${name} module`,
      );
    }
    if (!isGrantActive(grant)) {
      throw new ForbiddenException(
        `Your company's ${name} subscription expired on ${grant.expiresAt!.toISOString().slice(0, 10)}`,
      );
    }
    return true;
  }
}
