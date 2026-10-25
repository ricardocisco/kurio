/**
 * Primary navigation from the Figma header. Items without `to` are out of the challenge scope:
 * they render as buttons that explain the area is not available instead of fake pages.
 */
export interface NavigationItem {
  label: string;
  to?: '/' | '/marketplace';
  /** Pathname prefixes that mark this item as active. */
  activeOn?: string[];
}

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  { label: 'Início', to: '/', activeOn: ['/'] },
  {
    label: 'Mercado',
    to: '/marketplace',
    activeOn: ['/marketplace', '/nfts', '/cart', '/checkout'],
  },
  { label: 'Criadores' },
  { label: 'Aprenda' },
];

export function isNavigationItemActive(item: NavigationItem, pathname: string): boolean {
  return (item.activeOn ?? []).some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
