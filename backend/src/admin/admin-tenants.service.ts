import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TenantStatus } from '../../generated/central';
import { CentralPrismaService } from '../central/central-prisma.service';
import { TenantProvisioningService } from '../tenancy/tenant-provisioning.service';
import { TenantResolver } from '../tenancy/tenant-resolver.service';
import {
  isTenantModuleKey,
  TENANT_MODULE_KEYS,
  TENANT_MODULES,
} from '../tenancy/tenant-modules';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { EnableModuleDto } from './dto/enable-module.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

const withModules = {
  modules: {
    select: { module: true, enabledAt: true, expiresAt: true },
    orderBy: { module: 'asc' },
  },
} satisfies Prisma.TenantInclude;

@Injectable()
export class AdminTenantsService {
  constructor(
    private readonly central: CentralPrismaService,
    private readonly provisioning: TenantProvisioningService,
    private readonly resolver: TenantResolver,
  ) {}

  findAll() {
    return this.central.tenant.findMany({
      include: withModules,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.central.tenant.findUnique({
      where: { id },
      include: withModules,
    });
    if (!tenant) {
      throw new NotFoundException('Company not found');
    }
    return tenant;
  }

  // The catalog the dashboard picks from.
  listAvailableModules() {
    return TENANT_MODULE_KEYS.map((key) => ({
      key,
      name: TENANT_MODULES[key],
    }));
  }

  // Grants a paid module, or renews it: calling again for an existing module
  // replaces its expiry. Omitting expiresAt grants it with no expiry.
  async enableModule(id: string, dto: EnableModuleDto) {
    const tenant = await this.findOne(id);
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    await this.central.tenantModule.upsert({
      where: { tenantId_module: { tenantId: id, module: dto.module } },
      create: { tenantId: id, module: dto.module, expiresAt },
      update: { expiresAt },
    });
    this.resolver.invalidate(tenant.slug);
    return this.findOne(id);
  }

  // Blocks access only; the module's tables and data stay in the tenant DB.
  async disableModule(id: string, module: string) {
    const tenant = await this.findOne(id);
    if (!isTenantModuleKey(module)) {
      throw new NotFoundException(`Unknown module "${module}"`);
    }
    const { count } = await this.central.tenantModule.deleteMany({
      where: { tenantId: id, module },
    });
    if (count === 0) {
      throw new NotFoundException(
        `Module "${module}" is not enabled for this company`,
      );
    }
    this.resolver.invalidate(tenant.slug);
    return this.findOne(id);
  }

  create(dto: CreateTenantDto) {
    return this.provisioning.provision(dto);
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    const updated = await this.central.tenant.update({
      where: { id },
      data: { name: dto.name },
    });
    this.resolver.invalidate(updated.slug);
    return updated;
  }

  suspend(id: string) {
    return this.setStatus(id, TenantStatus.SUSPENDED);
  }

  activate(id: string) {
    return this.setStatus(id, TenantStatus.ACTIVE);
  }

  // Irreversible: drops the company's database with all its data.
  // The company must be suspended first, so one request can't wipe an
  // active company by mistake.
  async remove(id: string) {
    const tenant = await this.findOne(id);
    if (tenant.status !== TenantStatus.SUSPENDED) {
      throw new ConflictException('Suspend the company before deleting it');
    }
    await this.provisioning.deprovision(tenant);
  }

  private async setStatus(id: string, status: TenantStatus) {
    const tenant = await this.findOne(id);
    // A half-provisioned tenant must go through provisioning, not activate.
    if (tenant.status === TenantStatus.PROVISIONING) {
      throw new ConflictException('Company is still being provisioned');
    }
    const updated = await this.central.tenant.update({
      where: { id },
      data: { status },
    });
    // Without this, the middleware cache keeps serving the old status for up to 60s.
    this.resolver.invalidate(updated.slug);
    return updated;
  }
}
