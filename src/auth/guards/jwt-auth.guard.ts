import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from '../types/session-user.types';
import { extractBearerToken } from '../utils/bearer-token.util';
import { verifyToken } from '../utils/jwt.util';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const payload = verifyToken(token);
    request.user = { id: payload.id };
    return true;
  }
}
