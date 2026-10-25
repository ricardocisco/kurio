import { useCallback, useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query. Safe for a client-only SPA (reads synchronously on mount). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener('change', onChange);
      return () => mediaQueryList.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

/** Tailwind `md` breakpoint (48rem). */
export const DESKTOP_MEDIA_QUERY = '(min-width: 48rem)';
