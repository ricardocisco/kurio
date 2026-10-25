export interface NavigationItem {
  label: string;
  to?: '/' | '/marketplace';
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
