import { Injectable } from '@nestjs/common';
import { CentralPrismaService } from '../central/central-prisma.service';
import {
  ResolvedTenant,
  resolvedTenantInclude,
  TENANT_SLUG_PATTERN,
} from './tenancy.constants';

const CACHE_TTL_MS = 60_000;

// Slug → tenant (with its enabled modules) lookup with a 60s in-memory cache, used by TenantMiddleware.
// It's a provider rather than part of the middleware because Nest instantiates
// middleware separately from providers: admin code calling invalidate() must
// hit the same cache the middleware reads.
@Injectable()
export class TenantResolver {
  private readonly cache = new Map<
    string,
    { tenant: ResolvedTenant | null; expiresAt: number }
  >();

  constructor(private readonly central: CentralPrismaService) {}

  async resolve(slug: string): Promise<ResolvedTenant | null> {
    // Slugs that don't match the pattern can't exist, so skip the DB lookup.
    if (!TENANT_SLUG_PATTERN.test(slug)) return null;

    const cached = this.cache.get(slug);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }
    const tenant = await this.central.tenant.findUnique({
      where: { slug },
      include: resolvedTenantInclude,
    });
    // Misses are cached too, so unknown slugs don't hit the DB on every request.
    this.cache.set(slug, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });
    return tenant;
  }

  // Call after creating a tenant or changing its status or modules, so the
  // change applies on the next request instead of after the TTL.
  invalidate(slug: string) {
    this.cache.delete(slug);
  }
}
