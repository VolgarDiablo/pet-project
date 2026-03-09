import { SendGridClient } from './sendGridClient';
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService, SendGridClient],
  exports: [EmailService],
})
export class EmailModule {}
