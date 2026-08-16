import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { SignupInterface } from './interfaces/signup.interface';
import { TokenResponse } from './interfaces/token.interface';
import { LoginInterface } from './interfaces/login.interface';
import { generateToken, verifyToken } from './utils/jwt.util';
import { hashPassword, comparePassword } from './utils/password.util';
import { buildVerificationUrl } from './utils/verification-url.util';
import { UsersDataService } from './users.data.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersData: UsersDataService,
    private readonly mailService: MailService,
  ) {}

  async signup(payload: SignupInterface, origin: string): Promise<void> {
    const { name, email, password, confirmPassword } = payload;

    const existingUser = await this.usersData.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hash = await hashPassword(password, 10);

    const user = await this.usersData.create({
      name,
      email,
      password: hash,
    });

    await this.sendVerificationEmail(user, origin);
  }

  private async sendVerificationEmail(
    user: { id: number; email: string; name: string },
    origin: string,
  ) {
    const tokenEmailVerify = generateToken({ id: user.id }, {
      expiresIn: '15m',
    });
    const url = buildVerificationUrl(origin, tokenEmailVerify);
    await this.mailService.sendVeryfiedEmail(user.email, user.name, url);
  }

  async verifyEmail(token: string): Promise<void> {
    const payload = verifyToken(token);

    const user = await this.usersData.findById(payload.id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email already verified');
    }

    await this.usersData.update(user.id, { emailVerified: true });
  }

  async login(payload: LoginInterface, origin: string): Promise<TokenResponse> {
    const user = await this.usersData.findByEmail(payload.email);

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
      await this.sendVerificationEmail(user, origin);
    }

    const token = generateToken({ id: user.id }, { expiresIn: '10080m' });

    await this.usersData.update(user.id, { metaData: { token } });

    return { token };
  }

  async findIdRaw(id: number) {
    return this.usersData.findById(id);
  }
}
