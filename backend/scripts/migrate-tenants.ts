// Applies pending tenant migrations to every tenant database, one at a time.
// Stops at the first failure so a broken migration doesn't spread.
// Usage: npm run migrate:tenants
import 'dotenv/config';
import { PrismaClient, TenantStatus } from '../generated/central';
import { deployTenantMigrations } from '../src/tenancy/prisma-migrate';
import { buildTenantDbUrl } from '../src/tenancy/tenancy.constants';

async function main() {
  const baseUrl = process.env.TENANT_DB_BASE_URL;
  if (!baseUrl) throw new Error('TENANT_DB_BASE_URL must be set');

  const central = new PrismaClient({
    datasourceUrl: process.env.CENTRAL_DATABASE_URL,
  });
  // PROVISIONING tenants are skipped: provisioning runs their migrations itself.
  const tenants = await central.tenant
    .findMany({
      where: { status: { not: TenantStatus.PROVISIONING } },
      orderBy: { createdAt: 'asc' },
    })
    .finally(() => central.$disconnect());

  console.log(`Migrating ${tenants.length} tenant database(s)`);
  for (const [index, tenant] of tenants.entries()) {
    const label = `[${index + 1}/${tenants.length}] ${tenant.slug} (${tenant.dbName})`;
    try {
      const output = await deployTenantMigrations(
        buildTenantDbUrl(baseUrl, tenant.dbName),
      );
      const summary = output
        .split('\n')
        .filter((line) => /Applying migration|No pending/.test(line))
        .join(' ');
      console.log(`✔ ${label} ${summary.trim()}`);
    } catch (error) {
      const err = error as Error & { stdout?: string; stderr?: string };
      console.error(`✘ ${label} FAILED`);
      console.error(err.stderr || err.stdout || err.message);
      const remaining = tenants.slice(index + 1).map((t) => t.slug);
      console.error(
        `Stopped. Not attempted: ${remaining.length ? remaining.join(', ') : 'none'}`,
      );
      process.exit(1);
    }
  }
  console.log('All tenant databases are up to date');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
