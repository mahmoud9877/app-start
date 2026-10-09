import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_ADMIN_ROUTE_KEY } from '../admin/admin-jwt.guard';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

// Global guard: every tenant route needs a tenant JWT unless marked @Public().
// /admin routes are skipped here; AdminJwtGuard protects them instead.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const skip = [IS_PUBLIC_KEY, IS_ADMIN_ROUTE_KEY].some((key) =>
      this.reflector.getAllAndOverride<boolean>(key, [
        context.getHandler(),
        context.getClass(),
      ]),
    );
    return skip || super.canActivate(context);
  }
}
