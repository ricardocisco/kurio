const FALLBACK_REDIRECT = '/';

export function sanitizeRedirect(target: string | undefined): string {
  if (!target?.startsWith('/') || target.startsWith('//')) return FALLBACK_REDIRECT;
  if (target.startsWith('/login') || target.startsWith('/register')) return FALLBACK_REDIRECT;
  return target;
}
