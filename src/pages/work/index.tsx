import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProjectCard from '../../components/project-card';
import {
  CategorySlug,
  isCategorySlug,
  useCategoriesStatus,
  useCategories,
  useCategoryLabel,
} from '../../config/categories';
import { getCachedProjects, loadPublicProjects } from '../../lib/projects-cache';
import type { Project } from '../../lib/project';
import useFlip from '../../hooks/useFlip';
import { IconGrid, IconRows } from '../../components/icons';
import Vine from '../../components/storybook/vine';
import useSeo from '../../seo/useSeo';
import { PAGE_META } from '../../seo/meta';
import { useLang } from '../../context/lang-context';
import './index.scss';

type Status = 'loading' | 'ready' | 'error';

function Work() {
  const { t } = useTranslation();
  const { lang: seoLang } = useLang();
  useSeo({
    title: PAGE_META.work.title[seoLang],
    description: PAGE_META.work.description[seoLang],
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const categories = useCategories();
  const catLabel = useCategoryLabel();
  const [projects, setProjects] = useState<Project[]>(() => getCachedProjects() || []);
  const [status, setStatus] = useState<Status>(() => (getCachedProjects() ? 'ready' : 'loading'));

  const param = searchParams.get('d');
  const categoriesStatus = useCategoriesStatus();
  const categoriesReady = categoriesStatus === 'ready' || categoriesStatus === 'error';
  const active: CategorySlug | null = categoriesReady
    ? isCategorySlug(param)
      ? param
      : null
    : param || null;

  const load = useCallback(async () => {
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    try {
      const list = await loadPublicProjects();
      setProjects(list);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const map = new Map<CategorySlug, number>();
    categories.forEach((c) => map.set(c.slug, 0));
    projects.forEach((p) =>
      (p.categories || []).forEach((slug) => {
        if (isCategorySlug(slug)) map.set(slug, (map.get(slug) || 0) + 1);
      })
    );
    return map;
  }, [projects, categories]);

  const visible = useMemo(
    () => (active ? projects.filter((p) => p.categories?.includes(active)) : projects),
    [projects, active]
  );

  const [view, setView] = useState<'grid' | 'list'>(() => {
    try {
      return localStorage.getItem('work.view') === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });

  const { containerRef, snapshot } = useFlip<HTMLUListElement>([visible, view]);

  const changeView = (next: 'grid' | 'list') => {
    if (next === view) return;
    snapshot();
    setView(next);
    try {
      localStorage.setItem('work.view', next);
    } catch {}
  };

  const selectFilter = (slug: CategorySlug | null) => {
    if (slug === active) return;
    snapshot();
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('d', slug);
    else next.delete('d');
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };

  const numberById = useMemo(() => {
    const map = new Map<number, number>();
    projects.forEach((p, i) => map.set(p.id, i + 1));
    return map;
  }, [projects]);

  return (
    <div className="work">
      <section className="work-hero" aria-labelledby="work-title">
        <div className="work-hero__inner">
          <h1 id="work-title" className="work-hero__name">
            Andrea Francín
          </h1>
          <p className="work-hero__role">{t('WORK.ROLE')}</p>
          <Vine className="work-hero__vine" />
        </div>
      </section>

      <div className="work-filters">
        <div className="work-filters__inner">
          <div className="work-filters__group" role="group" aria-label={t('WORK.FILTER_LABEL')}>
            <button
              type="button"
              className="ink-filter"
              aria-pressed={!active}
              style={{ '--f-ink': 'var(--text)', '--f-on': '#fff' } as React.CSSProperties}
              onClick={() => selectFilter(null)}
            >
              <span className="ink-filter__swatch" />
              <span className="ink-filter__label">{t('WORK.ALL')}</span>
              <span className="ink-filter__count tabular">{projects.length || ''}</span>
            </button>
            {!categoriesReady &&
              [92, 118, 104, 136].map((width, i) => (
                <span
                  key={i}
                  className="ink-filter ink-filter--placeholder"
                  style={{ width } as React.CSSProperties}
                  aria-hidden="true"
                />
              ))}
            {categories.map((c) => {
              const count = counts.get(c.slug) || 0;
              return (
                <button
                  key={c.slug}
                  type="button"
                  className="ink-filter"
                  aria-pressed={active === c.slug}
                  disabled={status === 'ready' && count === 0 && active !== c.slug}
                  style={{ '--f-ink': c.ink, '--f-on': c.onInk } as React.CSSProperties}
                  onClick={() => selectFilter(c.slug)}
                >
                  <span className="ink-filter__swatch" />
                  <span className="ink-filter__label">{catLabel(c)}</span>
                  <span className="ink-filter__count tabular">
                    {status === 'ready' ? count : ''}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="view-toggle" role="group" aria-label={t('WORK.VIEW_LABEL')}>
            <button
              type="button"
              className="view-toggle__btn"
              aria-pressed={view === 'grid'}
              aria-label={t('WORK.VIEW_GRID')}
              title={t('WORK.VIEW_GRID')}
              onClick={() => changeView('grid')}
            >
              <IconGrid size={18} />
            </button>
            <button
              type="button"
              className="view-toggle__btn"
              aria-pressed={view === 'list'}
              aria-label={t('WORK.VIEW_LIST')}
              title={t('WORK.VIEW_LIST')}
              onClick={() => changeView('list')}
            >
              <IconRows size={18} />
            </button>
          </div>
        </div>
      </div>

      <section className="work-grid-wrap" aria-label={t('HEADER.WORK')}>
        <p className="visually-hidden" aria-live="polite">
          {status === 'ready' &&
            (active
              ? t('WORK.SHOWING', { count: visible.length, total: projects.length })
              : t('WORK.COUNT', { count: projects.length }))}
        </p>
        {status === 'loading' && (
          <ul className="work-grid" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="work-grid__item">
                <div className="plate-skeleton skeleton" />
              </li>
            ))}
          </ul>
        )}

        {status === 'error' && (
          <div className="work-state">
            <p>{t('WORK.ERROR')}</p>
            <button type="button" className="btn btn--ghost" onClick={load}>
              {t('WORK.RETRY')}
            </button>
          </div>
        )}

        {status === 'ready' && projects.length === 0 && (
          <div className="work-state">
            <p>{t('WORK.EMPTY_ALL')}</p>
          </div>
        )}

        {status === 'ready' && projects.length > 0 && (
          <>
            <ul className={`work-grid work-grid--${view}`} ref={containerRef}>
              {visible.map((item, i) => (
                <li
                  key={item.id}
                  data-flip-key={item.id}
                  className="work-grid__item"
                  data-reveal
                  style={{ '--reveal-delay': `${(i % 3) * 90}ms` } as React.CSSProperties}
                >
                  <ProjectCard item={item} number={numberById.get(item.id) || i + 1} />
                </li>
              ))}
            </ul>
            {visible.length === 0 && (
              <div className="work-state">
                <p>{t('WORK.EMPTY')}</p>
                <button type="button" className="btn btn--ghost" onClick={() => selectFilter(null)}>
                  {t('WORK.SHOW_ALL')}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default Work;
