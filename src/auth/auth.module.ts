import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailModule } from 'src/email/email.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
