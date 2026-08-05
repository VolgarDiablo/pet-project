import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import type { RequestWithUser } from '../types/session-user.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }
    const token = header.slice(7).trim();
    const payload = this.authService.verifyToken(token);
    request.user = { id: payload.id };
    return true;
  }
}
