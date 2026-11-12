import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { EmailService } from '../mail/mail.service';
import { SignupInterface } from './interfaces/signup.interface';
import { TokenResponse } from './interfaces/token.interface';
import { LoginInterface } from './interfaces/login.interface';
import { generateToken, verifyToken } from './utils/jwt.util';
import { hashPassword, comparePassword } from './utils/password.util';
import { PrismaService } from '../prisma/prisma.service';

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_RESENDS = 2;

type CodeUser = {
  id: number;
  email: string;
  name: string;
  emailVerified: boolean;
  emailCode: string | null;
  emailCodeExpiresAt: Date | null;
  emailResendCount: number;
  emailSentAt: Date | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async signup(payload: SignupInterface): Promise<void> {
    const { name, password, confirmPassword } = payload;
    const email = payload.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hash = await hashPassword(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hash,
      },
    });

    try {
      await this.issueEmailCode(user, 0);
    } catch (error) {
      await this.prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
      throw error;
    }
  }

  async verificationStatus(email: string) {
    const user = await this.findUserByEmail(email);
    if (user.emailVerified) {
      return { verified: true, resendsLeft: 0, retryAfterSeconds: 0, expired: false };
    }
    return {
      verified: false,
      resendsLeft: this.resendsLeft(user),
      retryAfterSeconds: this.retryAfter(user.emailSentAt),
      expired: this.isCodeExpired(user),
    };
  }

  async verifyCode(email: string, code: string): Promise<{ message: string }> {
    const user = await this.findUserByEmail(email);
    if (user.emailVerified) {
      throw new ConflictException('Email already verified');
    }
    if (this.isCodeExpired(user)) {
      throw new BadRequestException('Verification code expired');
    }
    if (user.emailCode !== code) {
      throw new BadRequestException('Wrong verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailCode: null,
        emailCodeExpiresAt: null,
      },
    });

    return { message: 'Email successfully verified' };
  }

  async resendVerification(email: string) {
    const user = await this.findUserByEmail(email);
    if (user.emailVerified) {
      throw new ConflictException('Email already verified');
    }
    if (user.emailResendCount >= MAX_RESENDS) {
      throw new HttpException(
        {
          message: 'You can ask for only two more letters',
          retryAfterSeconds: 0,
          resendsLeft: 0,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const retryAfterSeconds = this.retryAfter(user.emailSentAt);
    if (retryAfterSeconds > 0) {
      throw new HttpException(
        {
          message: 'Wait a minute before asking for another letter',
          retryAfterSeconds,
          resendsLeft: this.resendsLeft(user),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.issueEmailCode(user, user.emailResendCount + 1);
    return {
      retryAfterSeconds: 60,
      resendsLeft: MAX_RESENDS - (user.emailResendCount + 1),
    };
  }

  private async issueEmailCode(
    user: { id: number; email: string; name: string },
    resendCount: number,
  ) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const now = new Date();
    try {
      await this.emailService.sendEmail({
        type: 'verification',
        to: user.email,
        name: user.name,
        code,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Could not send the verification letter. Check the mail login on the server.',
      );
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailCode: code,
        emailCodeExpiresAt: new Date(now.getTime() + CODE_TTL_MS),
        emailResendCount: resendCount,
        emailSentAt: now,
      },
    });
  }

  private async findUserByEmail(email: string): Promise<CodeUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private resendsLeft(user: { emailResendCount: number }) {
    return Math.max(0, MAX_RESENDS - user.emailResendCount);
  }

  private retryAfter(sentAt: Date | null) {
    if (!sentAt) return 0;
    const ms = sentAt.getTime() + RESEND_WAIT_MS - Date.now();
    return ms > 0 ? Math.ceil(ms / 1000) : 0;
  }

  private isCodeExpired(user: {
    emailCode: string | null;
    emailCodeExpiresAt: Date | null;
  }) {
    if (!user.emailCode || !user.emailCodeExpiresAt) return true;
    return user.emailCodeExpiresAt.getTime() <= Date.now();
  }

  async verifyEmail(token: string): Promise<void> {
    const payload = verifyToken(token);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email already verified');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
  }

  async login(payload: LoginInterface): Promise<TokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('This account uses Google sign-in');
    }

    const isMatchedPassword = await comparePassword(
      payload.password,
      user.password,
    );

    if (!isMatchedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Confirm your email before signing in');
    }

    return this.issueToken(user.id);
  }

  async loginWithGoogle(idToken: string): Promise<TokenResponse> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new UnauthorizedException('Google sign-in is not configured');
    }

    const client = new OAuth2Client(clientId);
    let email = '';
    let name = '';
    let googleId = '';

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload.sub || payload.email_verified === false) {
        throw new Error('Google account has no verified email');
      }
      email = payload.email.trim().toLowerCase();
      googleId = payload.sub;
      name = payload.name?.trim() || email.split('@')[0];
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    const byGoogle = await this.prisma.user.findUnique({
      where: { googleId },
    });

    let user = byGoogle;
    if (!user) {
      const byEmail = await this.prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: { googleId, emailVerified: true },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email,
            name,
            googleId,
            emailVerified: true,
          },
        });
      }
    }

    return this.issueToken(user.id);
  }

  private async issueToken(userId: number): Promise<TokenResponse> {
    const token = generateToken({ id: userId }, { expiresIn: '10080m' });

    await this.prisma.user.update({
      where: { id: userId },
      data: { metaData: { token } satisfies Prisma.InputJsonValue },
    });

    return { token };
  }

  async findIdRaw(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
