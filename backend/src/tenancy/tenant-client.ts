import { PrismaClient } from '../../generated/tenant';

export function createTenantClient(datasourceUrl: string) {
  return new PrismaClient({
    datasourceUrl,
    // Password hashes are left out of every query result unless a query opts
    // back in with `omit: { password: false }` (only login does).
    omit: { user: { password: true } },
  });
}

// Use this type, not the bare PrismaClient: the global omit changes result types.
export type TenantClient = ReturnType<typeof createTenantClient>;
