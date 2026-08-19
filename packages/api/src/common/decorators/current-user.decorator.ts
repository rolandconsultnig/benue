import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id: string;
  phone: string;
  name: string;
  role: string; // Role enum value
  agency?: string | null;
  lgaId?: string | null;
}

/**
 * Extracts the authenticated user from the request.
 * Use on controller method params: `@CurrentUser() user: RequestUser`.
 *
 * The JwtStrategy populates `req.user` after token verification.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as RequestUser;
});
