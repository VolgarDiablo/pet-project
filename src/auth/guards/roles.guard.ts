import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '.prisma/client';
import type { RequestWithUser } from '../types/session-user.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;

    if (!user) {
      return false;
    }

    if (user.role === undefined) {
      return false;
    }

    return required.includes(user.role);
  }
}
