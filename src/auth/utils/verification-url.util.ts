export function buildVerificationUrl(origin: string, token: string): string {
  const url = new URL('auth/verify', origin);
  url.searchParams.set('token', token);
  return url.toString();
}
