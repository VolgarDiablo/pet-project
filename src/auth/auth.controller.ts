import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupEmailDto } from './dto/sighup-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @HttpCode(201)
  async signup(@Body() signupEmailDto: SignupEmailDto): Promise<void> {
    return this.authService.signup(signupEmailDto);
  }
}
