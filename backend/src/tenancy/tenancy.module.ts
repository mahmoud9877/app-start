import { Global, Module } from '@nestjs/common';
import { APP_GUARD, DiscoveryModule } from '@nestjs/core';
import { OnPremBootstrapService } from './onprem-bootstrap.service';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantDb } from './tenant-db';
import { TenantModuleAuditService } from './tenant-module-audit.service';
import { TenantModuleGuard } from './tenant-module.guard';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { TenantResolver } from './tenant-resolver.service';

// Global so any tenant-scoped module can inject TenantDb without importing this.
@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [
    TenantConnectionService,
    TenantDb,
    TenantProvisioningService,
    TenantResolver,
    OnPremBootstrapService,
    TenantModuleAuditService,
    { provide: APP_GUARD, useClass: TenantModuleGuard },
  ],
  exports: [
    TenantConnectionService,
    TenantDb,
    TenantProvisioningService,
    TenantResolver,
  ],
})
export class TenancyModule {}
