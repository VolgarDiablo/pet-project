import { MailDataRequired } from '@sendgrid/mail';
import { SendGridClient } from './sendGridClient';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly SendGridClient: SendGridClient) {}

  async sendEmail(recipient: string, body: string): Promise<void> {
    const mail: MailDataRequired = {
      to: recipient,
      from: 'anton.didkovskiy@gmail.com',
      subject: 'Test email',
      content: [{ type: 'text/plain', value: body }],
    };
    await this.SendGridClient.send(mail);
  }
}
