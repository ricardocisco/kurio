import { env } from '@/shared/config/env';

const API_BASE = env.VITE_API_BASE_URL.replace(/\/$/, '');

export function apiPath(path: `/${string}`): string {
  return `${API_BASE}${path}`;
}

export function toApiPathname(requestUrl: string): string {
  const { pathname } = new URL(requestUrl);
  const basePathname = new URL(API_BASE, window.location.origin).pathname.replace(/\/$/, '');
  return pathname.startsWith(basePathname) ? pathname.slice(basePathname.length) || '/' : pathname;
}
