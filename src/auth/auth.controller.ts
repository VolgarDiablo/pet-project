import {
  Body,
  Controller,
  HttpCode,
  Post,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import type { RequestWithUser } from './types/session-user.types';
import { AuthService } from './auth.service';
import { SignupEmailDto } from './dto/signup-email.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @HttpCode(201)
  async signup(
    @Body() signupEmailDto: SignupEmailDto,
    @Req() req: Request,
  ): Promise<void> {
    const origin = req.headers.origin ?? 'https://localhost:3000';
    return this.authService.signup(signupEmailDto, origin);
  }

  @Get('/verify')
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    await this.authService.verifyEmail(token);
    return { message: 'Email successfully verified' };
  }

  @Post('/login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const origin = req.headers.origin ?? 'https://localhost:3000';
    return this.authService.login(loginDto, origin);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: RequestWithUser) {
    const user = req.user!;
    return { id: user.id };
  }
}
