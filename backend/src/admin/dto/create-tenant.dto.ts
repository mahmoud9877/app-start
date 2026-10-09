import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { normalizeEmail, trim } from '../../common/transforms';
import { TENANT_SLUG_PATTERN } from '../../tenancy/tenancy.constants';
import {
  TENANT_MODULE_KEYS,
  TenantModuleKey,
} from '../../tenancy/tenant-modules';

export class CreateTenantDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  // Not lowercased for the caller: "Alpha" is rejected rather than silently
  // becoming "alpha", since the slug is what users type in x-tenant.
  @IsString()
  @Matches(TENANT_SLUG_PATTERN, {
    message: 'slug must be 3-30 characters of a-z, 0-9 or _',
  })
  slug!: string;

  @Transform(normalizeEmail)
  @IsEmail()
  adminEmail!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  adminName?: string;

  // bcrypt only uses the first 72 bytes.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  adminPassword!: string;

  // Optional modules to enable from the start; more can be added later.
  @IsOptional()
  @IsArray()
  @IsIn(TENANT_MODULE_KEYS, {
    each: true,
    message: `each module must be one of: ${TENANT_MODULE_KEYS.join(', ')}`,
  })
  modules?: TenantModuleKey[];
}
