import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
