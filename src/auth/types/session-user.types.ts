import { Role } from '.prisma/client';
import type { Request } from 'express';

/** Данные из JWT после `verify` (для письма верификации в токене может быть только `id`). */
export interface VerifiedJwtPayload {
  id: number;
  role?: Role;
}

/**
 * Пользователь на запросе после успешного `JwtAuthGuard`
 * (в прошлом проекте то же место занимал `SessionAuthGuard` + `session_id` cookie).
 */
export interface RequestUser {
  id: number;
  role?: Role;
}

export interface RequestWithUser extends Request {
  user?: RequestUser;
}
