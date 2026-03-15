import {
  Body,
  Controller,
  HttpCode,
  Post,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignupEmailDto } from './dto/sighup-email.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @HttpCode(201)
  async signup(
    @Body() signupEmailDto: SignupEmailDto,
    @Req() req: Request,
  ): Promise<void> {
    const origin = req.headers.origin ?? 'https:localhost:3000';
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
    const origin = req.headers.origin ?? 'https:localhost:3000';
    const token = await this.authService.login(loginDto, origin);

    return { token };
  }
}
