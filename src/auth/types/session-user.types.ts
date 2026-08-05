import type { Request } from 'express';

export interface VerifiedJwtPayload {
  id: number;
}

export interface RequestUser {
  id: number;
}

export interface RequestWithUser extends Request {
  user?: RequestUser;
}
