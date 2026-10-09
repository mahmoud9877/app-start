import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const TENANT_SCHEMA_PATH = resolve(
  process.cwd(),
  'prisma/tenant/schema.prisma',
);

// Runs `prisma migrate deploy` for the tenant schema against one database.
// Shared by tenant provisioning (at runtime) and scripts/migrate-tenants.ts,
// which is why the prisma CLI is a production dependency.
export async function deployTenantMigrations(databaseUrl: string) {
  const prismaCli = require.resolve('prisma/build/index.js');
  const { stdout } = await execFileAsync(
    process.execPath,
    [prismaCli, 'migrate', 'deploy', '--schema', TENANT_SCHEMA_PATH],
    {
      env: { ...process.env, TENANT_DATABASE_URL: databaseUrl },
      timeout: 120_000,
    },
  );
  return stdout;
}
