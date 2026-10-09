import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  validateSync,
  ValidateIf,
} from 'class-validator';
import { TENANT_SLUG_PATTERN } from '../tenancy/tenancy.constants';
import { TENANT_MODULE_KEYS } from '../tenancy/tenant-modules';
import { DEPLOYMENT_MODES, DeploymentMode, isOnPrem } from './deployment';

const onPremOnly = (env: EnvironmentVariables) => isOnPrem(env);

class EnvironmentVariables {
  @IsOptional()
  @IsIn(DEPLOYMENT_MODES)
  DEPLOYMENT_MODE: DeploymentMode = 'saas';

  // --- on-prem only ---
  @ValidateIf(onPremOnly)
  @Matches(TENANT_SLUG_PATTERN)
  ONPREM_TENANT_SLUG: string = 'main';

  @ValidateIf(onPremOnly)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ONPREM_COMPANY_NAME?: string;

  // Only used on first boot, to create the company's first admin user.
  @ValidateIf(
    (env: EnvironmentVariables) => isOnPrem(env) && !!env.ONPREM_ADMIN_EMAIL,
  )
  @IsEmail()
  ONPREM_ADMIN_EMAIL?: string;

  @ValidateIf(
    (env: EnvironmentVariables) => isOnPrem(env) && !!env.ONPREM_ADMIN_PASSWORD,
  )
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  ONPREM_ADMIN_PASSWORD?: string;

  // Comma-separated module keys, e.g. "sales,inventory". Empty = core only.
  // Reads the raw value: implicit conversion would turn "a,b" into ["a,b"].
  @Transform(({ obj }: { obj: Record<string, unknown> }) => {
    const raw = obj.ONPREM_MODULES;
    return typeof raw === 'string'
      ? raw
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
      : (raw ?? []);
  })
  @ValidateIf(onPremOnly)
  @IsIn(TENANT_MODULE_KEYS, {
    each: true,
    message: `ONPREM_MODULES entries must be one of: ${TENANT_MODULE_KEYS.join(', ')}`,
  })
  ONPREM_MODULES: string[] = [];

  @IsOptional()
  @IsInt()
  PORT?: number;

  @IsString()
  @IsNotEmpty()
  CENTRAL_DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  TENANT_DB_BASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  // SaaS only: on-prem has no /admin routes.
  @ValidateIf((env: EnvironmentVariables) => !isOnPrem(env))
  @IsString()
  @IsNotEmpty()
  ADMIN_JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  ADMIN_JWT_EXPIRES_IN?: string;
}

// Fails fast on startup if required env vars are missing or invalid.
export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  if (
    !isOnPrem(validated) &&
    validated.JWT_SECRET === validated.ADMIN_JWT_SECRET
  ) {
    throw new Error('JWT_SECRET and ADMIN_JWT_SECRET must be different');
  }
  return validated;
}
