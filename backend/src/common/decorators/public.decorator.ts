import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Skips the global tenant JwtAuthGuard. The x-tenant header is still required.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
