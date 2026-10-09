import { SetMetadata } from '@nestjs/common';

// Optional modules a tenant pays for. Core features (auth, users) are always
// on and aren't listed here.
// To add a paid module: add its key here, then put @RequiresModule('<key>')
// on its controller.
export const TENANT_MODULES = {
  sales: 'Sales',
  inventory: 'Inventory',
  purchasing: 'Purchasing',
  accounting: 'Accounting',
} as const;

export type TenantModuleKey = keyof typeof TENANT_MODULES;

export const TENANT_MODULE_KEYS = Object.keys(
  TENANT_MODULES,
) as TenantModuleKey[];

export const isTenantModuleKey = (value: string): value is TenantModuleKey =>
  Object.hasOwn(TENANT_MODULES, value);

export const REQUIRED_MODULE_KEY = 'requiredTenantModule';
export const CORE = 'core';

// Every tenant controller must carry exactly one of these two decorators;
// the app refuses to start otherwise (see TenantModuleAuditService), so a
// paid module can't be left open by forgetting the decorator.

// Returns 403 unless the current tenant has paid for this module and it
// hasn't expired. Enforced by TenantModuleGuard.
export const RequiresModule = (module: TenantModuleKey) =>
  SetMetadata(REQUIRED_MODULE_KEY, module);

// Included for every tenant (auth, users, company info).
export const CoreModule = () => SetMetadata(REQUIRED_MODULE_KEY, CORE);

export interface ModuleGrant {
  module: string;
  expiresAt: Date | null;
}

// A module is usable while its row exists and hasn't expired.
export const isGrantActive = (grant: ModuleGrant, now = new Date()) =>
  grant.expiresAt === null || grant.expiresAt > now;
