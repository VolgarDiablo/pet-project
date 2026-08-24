export function buildAppUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string>,
): string {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}
