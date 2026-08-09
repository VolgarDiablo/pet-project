import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';
import { VerifiedJwtPayload } from '../types/session-user.types';

export function generateToken(
  payload: object,
  options?: SignOptions,
): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: '15m',
    ...options,
  });
}

export function verifyToken(token: string): VerifiedJwtPayload {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as VerifiedJwtPayload;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}
