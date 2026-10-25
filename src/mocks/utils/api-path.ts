import { env } from '@/shared/config/env';

const API_BASE = env.VITE_API_BASE_URL.replace(/\/$/, '');

/** Absolute MSW path for an API route, e.g. `apiPath('/nfts/:nftId')`. */
export function apiPath(path: `/${string}`): string {
  return `${API_BASE}${path}`;
}

/** Strips the API base from a request URL: "https://app/api/nfts?x" -> "/nfts". */
export function toApiPathname(requestUrl: string): string {
  const { pathname } = new URL(requestUrl);
  const basePathname = new URL(API_BASE, window.location.origin).pathname.replace(/\/$/, '');
  return pathname.startsWith(basePathname) ? pathname.slice(basePathname.length) || '/' : pathname;
}
