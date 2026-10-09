import type { Prisma } from '../../generated/central';
import type { TenantClient } from './tenant-client';

export const TENANT_HEADER = 'x-tenant';

// The slug ends up in raw SQL (CREATE/DROP DATABASE), so this pattern is the
// only thing standing between user input and SQL injection. Don't loosen it.
export const TENANT_SLUG_PATTERN = /^[a-z0-9_]{3,30}$/;

export const tenantDbName = (slug: string) => `tenant_${slug}`;

// TENANT_DB_BASE_URL with its database (the URL path) swapped for dbName.
// Query params like connection_limit are kept.
export function buildTenantDbUrl(baseUrl: string, dbName: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/${dbName}`;
  return url.toString();
}

// A tenant as resolved per request: the row plus its enabled modules.
export const resolvedTenantInclude = {
  modules: { select: { module: true, expiresAt: true } },
} satisfies Prisma.TenantInclude;

export type ResolvedTenant = Prisma.TenantGetPayload<{
  include: typeof resolvedTenantInclude;
}>;

// What TenantMiddleware puts into CLS for the rest of the request.
export interface TenantClsStore {
  [key: symbol]: unknown;
  tenant?: ResolvedTenant;
  tenantClient?: TenantClient;
}
