export interface AdminNavigationItem {
  to: string;
  labelKey: string;
  matches: string[];
}

export interface AdminNavigationGroup {
  titleKey: string;
  items: AdminNavigationItem[];
}

export const ADMIN_NAVIGATION: AdminNavigationGroup[] = [
  {
    titleKey: 'ADMIN.GROUP_INSIGHTS',
    items: [{ to: '/private/analytics', labelKey: 'PRIVATE.TABS.ANALYTICS', matches: [] }],
  },
  {
    titleKey: 'ADMIN.GROUP_PORTFOLIO',
    items: [
      {
        to: '/private',
        labelKey: 'PRIVATE.TABS.WORK',
        matches: ['/private/add-project', '/private/edit-project'],
      },
      { to: '/private/categories', labelKey: 'PRIVATE.TABS.CATEGORIES', matches: [] },
    ],
  },
  {
    titleKey: 'ADMIN.GROUP_PAGES',
    items: [
      { to: '/private/services', labelKey: 'PRIVATE.TABS.SERVICES', matches: [] },
      { to: '/private/about', labelKey: 'PRIVATE.TABS.ABOUT', matches: [] },
      { to: '/private/contact', labelKey: 'PRIVATE.TABS.CONTACT', matches: [] },
      { to: '/private/auto-reply', labelKey: 'PRIVATE.TABS.AUTO_REPLY', matches: [] },
    ],
  },
  {
    titleKey: 'ADMIN.GROUP_BILLING',
    items: [
      { to: '/private/quotes', labelKey: 'BILLING.TABS_QUOTES', matches: [] },
      { to: '/private/invoices', labelKey: 'BILLING.TABS_INVOICES', matches: [] },
      { to: '/private/clients', labelKey: 'BILLING.TABS_CLIENTS', matches: [] },
      { to: '/private/conditions', labelKey: 'BILLING.TABS_CONDITIONS', matches: [] },
      { to: '/private/issuer', labelKey: 'BILLING.TABS_ISSUER', matches: [] },
    ],
  },
];

export function isCurrentItem(item: AdminNavigationItem, path: string): boolean {
  const normalizedPath = path.replace(/\/+$/, '') || '/';

  if (normalizedPath === item.to) {
    return true;
  }

  return [item.to === '/private' ? null : item.to, ...item.matches].some(
    (prefix) => prefix !== null && normalizedPath.startsWith(`${prefix}/`)
  );
}

const LEGACY_TAB_PATHS: Record<string, string> = {
  about: '/private/about',
  services: '/private/services',
  contact: '/private/contact',
  categories: '/private/categories',
  quotes: '/private/quotes',
  invoices: '/private/invoices',
  clients: '/private/clients',
  conditions: '/private/conditions',
  issuer: '/private/issuer',
  analytics: '/private/analytics',
};

export function findLegacyTabPath(search: string): string | null {
  const tab = new URLSearchParams(search).get('tab');

  return tab ? (LEGACY_TAB_PATHS[tab] ?? null) : null;
}
