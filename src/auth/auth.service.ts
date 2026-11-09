import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EmailService } from '../mail/mail.service';
import { SignupInterface } from './interfaces/signup.interface';
import { TokenResponse } from './interfaces/token.interface';
import { LoginInterface } from './interfaces/login.interface';
import { generateToken, verifyToken } from './utils/jwt.util';
import { hashPassword, comparePassword } from './utils/password.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async signup(payload: SignupInterface): Promise<void> {
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

    const hash = await hashPassword(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hash,
      },
    });

    await this.sendVerificationEmail(user);
  }

  private async sendVerificationEmail(user: {
    id: number;
    email: string;
    name: string;
  }) {
    const token = generateToken({ id: user.id }, { expiresIn: '15m' });
    await this.emailService.sendEmail({
      type: 'verification',
      to: user.email,
      name: user.name,
      token,
    });
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
      where: { email: payload.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatchedPassword = await comparePassword(
      payload.password,
      user.password,
    );

    if (!isMatchedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      await this.sendVerificationEmail(user);
    }

    const token = generateToken({ id: user.id }, { expiresIn: '10080m' });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { metaData: { token } satisfies Prisma.InputJsonValue },
    });

    return { token };
  }

  async findIdRaw(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
