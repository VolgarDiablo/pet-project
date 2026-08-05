import type { Request } from 'express';

/** Данные из JWT после `verify` (verify-письмо и access — оба с `id`). */
export interface VerifiedJwtPayload {
  id: number;
}

/**
 * Пользователь на запросе после успешного `JwtAuthGuard`
 * (в прошлом проекте то же место занимал `SessionAuthGuard` + `session_id` cookie).
 */
export interface RequestUser {
  id: number;
}

export interface RequestWithUser extends Request {
  user?: RequestUser;
}
