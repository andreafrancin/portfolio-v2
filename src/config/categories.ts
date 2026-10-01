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

export type CategoriesStatus = 'idle' | 'loading' | 'ready' | 'error';

let store: Category[] = [];
let status: CategoriesStatus = 'idle';
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const notify = () => listeners.forEach((fn) => fn());

export function setCategories(list: Category[]) {
  store = [...list].sort((a, b) => a.order - b.order);
  status = 'ready';
  notify();
}

export function loadCategories(force = false): Promise<void> {
  if (status === 'ready' && !force) return Promise.resolve();
  if (loading) return loading;
  if (status !== 'ready') {
    status = 'loading';
    notify();
  }
  loading = get('categories/', false)
    .then((list: ApiCategory[]) => setCategories((list || []).map(fromApi)))
    .catch(() => {
      if (status !== 'ready') {
        status = 'error';
        notify();
      }
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

export function useCategoriesStatus(): CategoriesStatus {
  return useSyncExternalStore(subscribe, () => status);
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
