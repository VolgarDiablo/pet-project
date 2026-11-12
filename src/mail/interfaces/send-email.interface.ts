export type SendEmailParams = {
  type: 'verification';
  to: string;
  name: string;
  code: string;
};
