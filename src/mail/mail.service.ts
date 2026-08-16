import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  async sendVeryfiedEmail(to: string, name: string, url: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Veryfied your email',
      template: 'veryfied-email',
      context: { name, veryfiedUrl: url }, 
    });
  }
}