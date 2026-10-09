import { Controller, Get } from '@nestjs/common';
import { TenantDb } from '../tenancy/tenant-db';
import {
  CoreModule,
  isGrantActive,
  TENANT_MODULE_KEYS,
  TENANT_MODULES,
} from '../tenancy/tenant-modules';

// The current company as seen by its own users. The frontend uses `modules`
// to show only what the company has paid for.
@CoreModule()
@Controller('company')
export class CompanyController {
  constructor(private readonly db: TenantDb) {}

  @Get()
  get() {
    const { name, slug, modules } = this.db.tenant;
    const now = new Date();
    return {
      name,
      slug,
      modules: TENANT_MODULE_KEYS.map((key) => {
        const grant = modules.find((m) => m.module === key);
        return {
          key,
          name: TENANT_MODULES[key],
          active: grant !== undefined && isGrantActive(grant, now),
          expiresAt: grant?.expiresAt ?? null,
        };
      }),
    };
  }
}
