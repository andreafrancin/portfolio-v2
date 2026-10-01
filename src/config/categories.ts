import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { get } from '../api-client/api-client';
import { useLang } from '../context/lang-context';

export type CategorySlug = string;

export interface Category {
  id?: number;
  slug: CategorySlug;
  name_i18n: Record<string, string>;
  order: number;
  ink: string;
  onInk: string;
}

interface ApiCategory {
  id: number;
  slug: string;
  name_i18n: Record<string, string>;
  color: string;
  order: number;
}

export function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#fff';
  const n = parseInt(m[1], 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return 1.05 / (L + 0.05) >= (L + 0.05) / 0.06 ? '#fff' : 'var(--text)';
}

export const fromApi = (c: ApiCategory): Category => ({
  id: c.id,
  slug: c.slug,
  name_i18n: c.name_i18n || {},
  order: c.order,
  ink: c.color,
  onInk: readableOn(c.color),
});

const FALLBACK: Category[] = [
  {
    slug: 'illustration',
    name_i18n: { es: 'Ilustración', ca: 'Il·lustració', en: 'Illustration' },
    order: 0,
    color: '#3fcfc6',
  },
  {
    slug: 'branding',
    name_i18n: { es: 'Branding', ca: 'Branding', en: 'Branding' },
    order: 1,
    color: '#bc0e4d',
  },
  {
    slug: 'campaigns',
    name_i18n: { es: 'Campañas', ca: 'Campanyes', en: 'Campaigns' },
    order: 2,
    color: '#e98e47',
  },
  {
    slug: 'editorial',
    name_i18n: { es: 'Editorial y digital', ca: 'Editorial i digital', en: 'Editorial & Digital' },
    order: 3,
    color: '#8265a8',
  },
].map((c) => fromApi({ id: 0, ...c }));

let store: Category[] = FALLBACK;
let loading: Promise<void> | null = null;
let loaded = false;
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function setCategories(list: Category[]) {
  store = [...list].sort((a, b) => a.order - b.order);
  loaded = true;
  listeners.forEach((fn) => fn());
}

export function loadCategories(force = false): Promise<void> {
  if (loaded && !force) return Promise.resolve();
  if (loading) return loading;
  loading = get('categories/', false)
    .then((list: ApiCategory[]) => setCategories((list || []).map(fromApi)))
    .catch(() => {})
    .finally(() => {
      loading = null;
    });
  return loading;
}

export function useCategories(): Category[] {
  const list = useSyncExternalStore(subscribe, () => store);
  useEffect(() => {
    loadCategories();
  }, []);
  return list;
}

export function useCategoryLabel() {
  const { lang } = useLang();
  return useCallback(
    (c: Category) =>
      c.name_i18n[lang] || c.name_i18n.es || c.name_i18n.ca || c.name_i18n.en || c.slug,
    [lang]
  );
}

export function getCategory(slug: string | null | undefined): Category | undefined {
  return slug ? store.find((c) => c.slug === slug) : undefined;
}

export function isCategorySlug(value: unknown): value is CategorySlug {
  return typeof value === 'string' && store.some((c) => c.slug === value);
}

export function projectCategories(
  project: { categories?: unknown } | null | undefined
): Category[] {
  const raw = Array.isArray(project?.categories) ? (project!.categories as unknown[]) : [];
  return store.filter((c) => raw.includes(c.slug));
}

export const getCategories = () => store;
