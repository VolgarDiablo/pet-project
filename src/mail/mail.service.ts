import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { SendEmailParams } from './interfaces/send-email.interface';
import { buildAppUrl } from './utils/app-url.util';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendEmail(params: SendEmailParams): Promise<void> {
    const { subject, template, context } = this.buildEmail(params);

    await this.mailerService.sendMail({
      to: params.to,
      subject,
      template,
      context,
    });
  }

  private buildEmail(params: SendEmailParams) {
    switch (params.type) {
      case 'verification': {
        const appUrl = this.config.getOrThrow<string>('APP_URL');
        return {
          subject: 'Verify your email',
          template: 'veryfied-email',
          context: {
            name: params.name,
            veryfiedUrl: buildAppUrl(appUrl, '/auth/verify', {
              token: params.token,
            }),
          },
        };
      };
    default:
      throw new Error('Invalid email type');
    }
  }
}
