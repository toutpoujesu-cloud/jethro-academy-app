import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IJwtPayload } from '@jethro/shared';

/**
 * Extracts the authenticated user from the request.
 * Use in controller methods: @CurrentUser() user: IJwtPayload
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IJwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: IJwtPayload }>();
    return request.user;
  },
);
