import {
  applyDecorators,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { ADMIN_JWT_STRATEGY } from './admin-jwt.strategy';

export const IS_ADMIN_ROUTE_KEY = 'isAdminRoute';

@Injectable()
export class AdminJwtGuard extends AuthGuard(ADMIN_JWT_STRATEGY) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Only handler-level @Public() counts here (e.g. POST /admin/login), so a
    // class-level @Public() can't accidentally open every admin route.
    if (this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler())) {
      return true;
    }
    return super.canActivate(context);
  }
}

// Put on admin controllers: requires a super admin token on every route
// (except handlers marked @Public()), and tells the global tenant
// JwtAuthGuard to stay out of the way.
export const AdminRoute = () =>
  applyDecorators(
    SetMetadata(IS_ADMIN_ROUTE_KEY, true),
    UseGuards(AdminJwtGuard),
  );
