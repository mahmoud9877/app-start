import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// Returns request.user: an AuthenticatedUser on tenant routes,
// an AuthenticatedAdmin on /admin routes.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): unknown => {
    return ctx.switchToHttp().getRequest<Request & { user?: unknown }>().user;
  },
);
