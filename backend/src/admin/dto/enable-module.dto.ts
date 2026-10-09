import { IsDateString, IsIn, IsOptional } from 'class-validator';
import {
  TENANT_MODULE_KEYS,
  TenantModuleKey,
} from '../../tenancy/tenant-modules';

export class EnableModuleDto {
  @IsIn(TENANT_MODULE_KEYS, {
    message: `module must be one of: ${TENANT_MODULE_KEYS.join(', ')}`,
  })
  module!: TenantModuleKey;

  // Paid until (ISO 8601, e.g. "2027-01-31T23:59:59Z"). Omit for no expiry.
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
