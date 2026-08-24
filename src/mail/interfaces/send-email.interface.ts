export type SendEmailParams =
  | { type: 'verification'; to: string; name: string; token: string }
  | { type: 'otp'; to: string; name: string; code: string };
