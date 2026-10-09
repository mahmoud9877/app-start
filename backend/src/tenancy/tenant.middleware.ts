import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NestMiddleware,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { TenantStatus } from '../../generated/central';
import type { DeploymentMode } from '../config/deployment';
import { TENANT_HEADER, TenantClsStore } from './tenancy.constants';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantResolver } from './tenant-resolver.service';

// Resolves the request's tenant and its PrismaClient, and stores both in CLS.
// SaaS: the tenant comes from the x-tenant header. On-prem: it's always the
// single installed company (ONPREM_TENANT_SLUG) and the header is ignored.
// Applied to every route except /admin/*.
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  // Set only in on-prem mode.
  private readonly fixedSlug?: string;

  constructor(
    private readonly resolver: TenantResolver,
    private readonly connections: TenantConnectionService,
    private readonly cls: ClsService<TenantClsStore>,
    config: ConfigService,
  ) {
    if (config.get<DeploymentMode>('DEPLOYMENT_MODE') === 'onprem') {
      this.fixedSlug = config.getOrThrow<string>('ONPREM_TENANT_SLUG');
    }
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    const slug =
      this.fixedSlug ?? req.header(TENANT_HEADER)?.trim().toLowerCase();
    if (!slug) {
      throw new BadRequestException(`Missing ${TENANT_HEADER} header`);
    }

    const tenant = await this.resolver.resolve(slug);
    if (!tenant) {
      throw new NotFoundException(`Company "${slug}" not found`);
    }
    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new ForbiddenException('This company account is suspended');
    }

    this.cls.set('tenant', tenant);
    this.cls.set('tenantClient', this.connections.get(tenant.dbName));
    next();
  }
}
