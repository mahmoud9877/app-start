import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantStatus } from '../../generated/central';
import { CentralPrismaService } from '../central/central-prisma.service';
import type { DeploymentMode } from '../config/deployment';
import { deployTenantMigrations } from './prisma-migrate';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantModuleKey } from './tenant-modules';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { TenantResolver } from './tenant-resolver.service';

// On-prem only. Runs on every boot, before the app accepts requests:
// - first boot: creates the single company (database, migrations, first
//   admin user) from the ONPREM_* env vars;
// - later boots: applies pending tenant migrations, so upgrading a customer
//   is just "deploy the new image and restart";
// - every boot: makes the enabled modules match ONPREM_MODULES exactly.
@Injectable()
export class OnPremBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OnPremBootstrapService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly central: CentralPrismaService,
    private readonly connections: TenantConnectionService,
    private readonly provisioning: TenantProvisioningService,
    private readonly resolver: TenantResolver,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<DeploymentMode>('DEPLOYMENT_MODE') !== 'onprem') {
      return;
    }
    const slug = this.config.getOrThrow<string>('ONPREM_TENANT_SLUG');
    const name = this.config.getOrThrow<string>('ONPREM_COMPANY_NAME');
    const modules = this.config.get<TenantModuleKey[]>('ONPREM_MODULES', []);

    const existing = await this.central.tenant.findUnique({ where: { slug } });
    let tenantId: string;

    if (!existing) {
      const adminEmail = this.config.get<string>('ONPREM_ADMIN_EMAIL');
      const adminPassword = this.config.get<string>('ONPREM_ADMIN_PASSWORD');
      if (!adminEmail || !adminPassword) {
        throw new Error(
          'First on-prem boot: set ONPREM_ADMIN_EMAIL and ONPREM_ADMIN_PASSWORD to create the first admin user',
        );
      }
      this.logger.log(`First boot: creating company "${slug}"`);
      const tenant = await this.provisioning.provision({
        name,
        slug,
        adminEmail,
        adminPassword,
        modules,
      });
      tenantId = tenant.id;
    } else {
      if (existing.status === TenantStatus.PROVISIONING) {
        // Only possible if the process died mid-provisioning (normal failures roll back).
        throw new Error(
          `Company "${slug}" is stuck in PROVISIONING. Drop database "${existing.dbName}" and delete its row from erp_central.tenants, then restart.`,
        );
      }
      await deployTenantMigrations(this.connections.urlFor(existing.dbName));
      // There's no super admin on-prem to suspend or rename the company,
      // so the env vars are the source of truth.
      await this.central.tenant.update({
        where: { id: existing.id },
        data: { name, status: TenantStatus.ACTIVE },
      });
      tenantId = existing.id;
    }

    await this.central.$transaction([
      this.central.tenantModule.deleteMany({
        where: { tenantId, module: { notIn: modules } },
      }),
      this.central.tenantModule.createMany({
        data: modules.map((module) => ({ tenantId, module })),
        skipDuplicates: true,
      }),
    ]);
    this.resolver.invalidate(slug);
    this.logger.log(
      `On-prem company "${slug}" ready. Modules: ${modules.join(', ') || 'core only'}`,
    );
  }
}
