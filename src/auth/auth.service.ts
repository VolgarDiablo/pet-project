import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { SignupInterface } from './interfaces/signup.inetrface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(payload: SignupInterface): Promise<void> {
    let user;

    const { name, email, password, confirmPassword } = payload;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hash = await this.encryptPassword(password, 10);

    user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hash,
      },
    });

    //can send email verify
    // await this.sendVerificationEmail(user);
  }

  async encryptPassword(
    password: string,
    saltOrRounds: number,
  ): Promise<string> {
    return await bcrypt.hash(password, saltOrRounds);
  }
}
