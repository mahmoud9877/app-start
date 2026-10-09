import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Tenant, TenantStatus } from '../../generated/central';
import { CentralPrismaService } from '../central/central-prisma.service';
import { deployTenantMigrations } from './prisma-migrate';
import { TENANT_SLUG_PATTERN, tenantDbName } from './tenancy.constants';
import { TenantModuleKey } from './tenant-modules';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantResolver } from './tenant-resolver.service';

export interface ProvisionTenantInput {
  name: string;
  slug: string;
  adminEmail: string;
  adminName?: string;
  adminPassword: string;
  // Optional modules to enable from the start (keys of TENANT_MODULES).
  modules?: TenantModuleKey[];
}

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    private readonly central: CentralPrismaService,
    private readonly connections: TenantConnectionService,
    private readonly resolver: TenantResolver,
  ) {}

  // Tenant row (PROVISIONING) → CREATE DATABASE → migrations → first admin
  // user → ACTIVE. Any failure after the row exists is rolled back.
  async provision(input: ProvisionTenantInput): Promise<Tenant> {
    // Re-checked here (not only in the DTO) because the slug is interpolated
    // into CREATE/DROP DATABASE below.
    if (!TENANT_SLUG_PATTERN.test(input.slug)) {
      throw new BadRequestException('Invalid slug');
    }
    const dbName = tenantDbName(input.slug);

    // A duplicate slug fails here with P2002 → 409, before anything is created.
    // Module rows are removed with the tenant row on rollback (cascade).
    const tenant = await this.central.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        dbName,
        modules: {
          create: [...new Set(input.modules ?? [])].map((module) => ({
            module,
          })),
        },
      },
    });

    let databaseCreated = false;
    try {
      await this.central.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
      databaseCreated = true;

      await deployTenantMigrations(this.connections.urlFor(dbName));

      await this.connections.get(dbName).user.create({
        data: {
          email: input.adminEmail.trim().toLowerCase(),
          name: input.adminName ?? 'Administrator',
          password: await bcrypt.hash(input.adminPassword, 10),
        },
      });

      const active = await this.central.tenant.update({
        where: { id: tenant.id },
        data: { status: TenantStatus.ACTIVE },
      });
      // Drop any cached "not found" from requests made before it existed.
      this.resolver.invalidate(active.slug);
      this.logger.log(`Provisioned tenant "${active.slug}" (${dbName})`);
      return active;
    } catch (error) {
      this.logger.error(
        `Provisioning "${input.slug}" failed, rolling back`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.rollback(tenant.id, dbName, databaseCreated);
      throw new InternalServerErrorException(
        `Failed to provision company "${input.slug}"`,
      );
    }
  }

  // Permanently deletes a tenant: its database and its central row.
  // The row is removed only after the database is gone, so a failed DROP
  // leaves the tenant listed (and retryable) instead of orphaning a database.
  async deprovision(tenant: Tenant): Promise<void> {
    // dbName is interpolated into raw SQL; only accept names we generate.
    if (
      !TENANT_SLUG_PATTERN.test(tenant.slug) ||
      tenant.dbName !== tenantDbName(tenant.slug)
    ) {
      throw new InternalServerErrorException(
        `Refusing to drop unexpected database name "${tenant.dbName}"`,
      );
    }

    this.resolver.invalidate(tenant.slug);
    await this.connections.remove(tenant.dbName);
    // WITH (FORCE) terminates any remaining connections to the database.
    await this.central.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS "${tenant.dbName}" WITH (FORCE)`,
    );
    await this.central.tenant.delete({ where: { id: tenant.id } });
    this.resolver.invalidate(tenant.slug);
    this.logger.warn(`Deleted tenant "${tenant.slug}" (${tenant.dbName})`);
  }

  // Best effort: each step runs even if an earlier one fails.
  private async rollback(
    tenantId: string,
    dbName: string,
    databaseCreated: boolean,
  ) {
    const steps: [string, () => Promise<unknown>][] = [
      ['disconnect client', () => this.connections.remove(dbName)],
      [
        'drop database',
        // Only drop a database this call created. If CREATE DATABASE failed
        // because it already existed, it isn't ours to delete.
        async () =>
          databaseCreated &&
          this.central.$executeRawUnsafe(
            `DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`,
          ),
      ],
      [
        'delete tenant row',
        () => this.central.tenant.delete({ where: { id: tenantId } }),
      ],
    ];
    for (const [label, step] of steps) {
      try {
        await step();
      } catch (error) {
        this.logger.error(
          `Rollback step "${label}" failed for ${dbName}`,
          error,
        );
      }
    }
  }
}
