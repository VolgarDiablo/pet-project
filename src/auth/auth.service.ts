import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignupInterface } from './interfaces/signup.interface';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { User } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { TokenResponse } from './interfaces/token.interface';
import { LoginInterface } from './interfaces/login.interface';
import { VerifiedJwtPayload } from './types/session-user.types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async signup(payload: SignupInterface, origin: string): Promise<void> {
    const { name, email, password, confirmPassword } = payload;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hash = await this.encryptPassword(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hash,
      },
    });

    await this.sendVerificationEmail(user, origin);
  }

  async encryptPassword(
    password: string,
    saltOrRounds: number,
  ): Promise<string> {
    return await bcrypt.hash(password, saltOrRounds);
  }

  async decryptPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private async sendVerificationEmail(user: User, origin: string) {
    const tokenEmailVerify = this.generateToken({ id: user.id }, {
      expiresIn: '15m',
    });
    const url = new URL('auth/verify', origin);

    url.searchParams.set('token', tokenEmailVerify);

    console.log(url.toString());
  }

  generateToken(payload: object, options?: SignOptions): string {
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: '15m',
      ...options,
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const payload = this.verifyToken(token);

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

  verifyToken(token: string): VerifiedJwtPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET as string) as VerifiedJwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async login(payload: LoginInterface, origin: string): Promise<TokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatchedPassword = await this.decryptPassword(
      payload.password,
      user.password,
    );

    if (!isMatchedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      await this.sendVerificationEmail(user, origin);
    }

    const token = this.generateToken({ id: user.id }, { expiresIn: '10080m' });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { metaData: { token } },
    });

    return { token };
  }

  async findIdRaw(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
