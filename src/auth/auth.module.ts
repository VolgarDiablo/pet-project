import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  providers: [AuthService, PrismaService],
  controllers: [AuthController],
  imports: [EmailModule],
})
export class AuthModule {}
