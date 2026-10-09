import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildTenantDbUrl } from './tenancy.constants';
import { createTenantClient, TenantClient } from './tenant-client';

// One PrismaClient per tenant database, created on first use and kept for the
// life of the process. Each client has its own pool (connection_limit in
// TENANT_DB_BASE_URL), so total connections grow with active tenants.
@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name);
  private readonly clients = new Map<string, TenantClient>();

  constructor(private readonly config: ConfigService) {}

  urlFor(dbName: string): string {
    return buildTenantDbUrl(
      this.config.getOrThrow<string>('TENANT_DB_BASE_URL'),
      dbName,
    );
  }

  get(dbName: string): TenantClient {
    let client = this.clients.get(dbName);
    if (!client) {
      // PrismaClient connects lazily on the first query.
      client = createTenantClient(this.urlFor(dbName));
      this.clients.set(dbName, client);
    }
    return client;
  }

  async remove(dbName: string): Promise<void> {
    const client = this.clients.get(dbName);
    if (!client) return;
    this.clients.delete(dbName);
    await client.$disconnect();
  }

  async onModuleDestroy() {
    const dbNames = [...this.clients.keys()];
    await Promise.allSettled(dbNames.map((dbName) => this.remove(dbName)));
    this.logger.log(`Disconnected ${dbNames.length} tenant client(s)`);
  }
}
