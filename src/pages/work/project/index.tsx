import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../context/lang-context';
import { fetchProjectFromNewAPI } from '../../../services/work/api-request';
import { getCachedProjects, loadPublicProjects } from '../../../lib/projects-cache';
import { coverImage, padNumber, Project, projectTitle } from '../../../lib/project';
import {
  projectCategories,
  useCategories,
  useCategoriesStatus,
  useCategoryLabel,
} from '../../../config/categories';
import MarkdownView from '../../../components/markdown-view';
import Lightbox, { LightboxImage } from '../../../components/lightbox';
import ProgressiveImage from '../../../components/progressive-image';
import { IconArrowLeft, IconArrowRight, IconShare } from '../../../components/icons';
import useSeo from '../../../seo/useSeo';
import {
  artworkJsonLd,
  pageUrl,
  plainExcerpt,
  PROJECT_FALLBACK,
  SITE_NAME,
} from '../../../seo/meta';
import ShareSheet from './share-sheet';
import './index.scss';

type Status = 'loading' | 'ready' | 'error' | 'missing';

function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="reading-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

function ProjectDetail() {
  const { t } = useTranslation();
  const { lang } = useLang();
  useCategories();
  const categoriesStatus = useCategoriesStatus();
  const catLabel = useCategoryLabel();
  const { id } = useParams();
  const projectId = Number(id);

  const [data, setData] = useState<Project | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [status, setStatus] = useState<Status>('loading');
  const [list, setList] = useState<Project[]>(() => getCachedProjects() || []);
  const [viewer, setViewer] = useState<{
    images: LightboxImage[];
    index: number;
    rect: DOMRect | null;
  } | null>(null);

  const openImage = useCallback((clicked: HTMLImageElement) => {
    const all = Array.from(
      clicked.closest('.wmde-markdown')?.querySelectorAll<HTMLImageElement>('img') || [clicked]
    );
    setViewer({
      images: all.map((img) => ({ src: img.currentSrc || img.src, alt: img.alt })),
      index: Math.max(0, all.indexOf(clicked)),
      rect: clicked.getBoundingClientRect(),
    });
  }, []);

  const load = useCallback(async () => {
    if (!Number.isFinite(projectId)) {
      setStatus('missing');
      return;
    }
    setStatus('loading');
    try {
      const response: Project = await fetchProjectFromNewAPI(projectId);
      if (!response || response.hidden) {
        setStatus('missing');
        return;
      }
      setData(response);
      setStatus('ready');
    } catch (err: any) {
      setStatus(String(err?.message || '').includes('404') ? 'missing' : 'error');
    }
  }, [projectId]);

  useEffect(() => {
    load();
    loadPublicProjects()
      .then(setList)
      .catch(() => {});
  }, [load]);

  const index = useMemo(() => list.findIndex((p) => p.id === projectId), [list, projectId]);
  const suggested = useMemo(
    () =>
      data?.suggested_project
        ? list.find((p) => p.id === data.suggested_project && p.id !== projectId) || null
        : null,
    [data, list, projectId]
  );

  const seoTitle = data ? projectTitle(data, lang) : '';
  const seoDescription =
    plainExcerpt(data?.content_i18n?.[lang]?.md || data?.content_i18n?.es?.md) ||
    PROJECT_FALLBACK[lang];
  const seoImage = coverImage(data)?.image_url || null;
  useSeo(
    status === 'ready' && data
      ? {
          title: `${seoTitle} — ${SITE_NAME}`,
          description: seoDescription,
          image: seoImage,
          type: 'article',
          jsonLd: artworkJsonLd({
            title: seoTitle,
            description: seoDescription,
            url: pageUrl(`/work/${projectId}`, lang),
            image: seoImage,
            lang,
          }),
        }
      : status === 'missing'
        ? { title: `404 — ${SITE_NAME}`, description: PROJECT_FALLBACK[lang], noindex: true }
        : null
  );

  if (status === 'loading') {
    return (
      <article className="project" aria-busy="true">
        <div className="project__head">
          <div className="skeleton project-skel__title" />
          <div className="skeleton project-skel__meta" />
        </div>
        <div className="project__body">
          <div className="skeleton project-skel__image" />
        </div>
      </article>
    );
  }

  if (status === 'missing' || status === 'error') {
    return (
      <article className="project">
        <div className="project__head">
          <p className="project__state">
            {status === 'missing' ? t('PROJECT.NOT_FOUND') : t('PROJECT.ERROR')}
          </p>
          <div className="project__state-actions">
            {status === 'error' && (
              <button type="button" className="btn" onClick={load}>
                {t('WORK.RETRY')}
              </button>
            )}
            <Link to="/work" className="btn btn--ghost">
              <IconArrowLeft size={18} /> {t('PROJECT.BACK')}
            </Link>
          </div>
        </div>
      </article>
    );
  }

  const title = projectTitle(data, lang);

  const cats = projectCategories(data);
  const pendingCats =
    categoriesStatus === 'idle' || categoriesStatus === 'loading'
      ? (Array.isArray(data?.categories) ? data.categories : []).length
      : 0;
  const md = data?.content_i18n?.[lang]?.md || data?.content_i18n?.es?.md || '';
  const suggestedCover = coverImage(suggested);

  return (
    <article className="project">
      <ReadingProgress />

      <header className="project__head">
        <nav className="project__nav" aria-label={t('PROJECT.BACK')}>
          <Link to="/work" className="text-link">
            <IconArrowLeft size={18} /> {t('PROJECT.BACK')}
          </Link>
          <button
            type="button"
            className="project__share"
            onClick={() => setShareOpen(true)}
            aria-label={t('PROJECT.SHARE')}
            title={t('PROJECT.SHARE')}
          >
            <IconShare size={20} />
          </button>
        </nav>

        <h1 className="project__title">{title}</h1>

        <dl className="colophon">
          {index >= 0 && (
            <div className="colophon__cell">
              <dt>{t('PROJECT.NUMBER')}</dt>
              <dd className="tabular">
                {padNumber(index + 1)} <span>/ {padNumber(list.length)}</span>
              </dd>
            </div>
          )}
          {(cats.length > 0 || pendingCats > 0) && (
            <div className="colophon__cell colophon__cell--wide">
              <dt>{t('PROJECT.CATEGORY')}</dt>
              <dd className="colophon__inks">
                {Array.from({ length: pendingCats }).map((_, i) => (
                  <span
                    key={`placeholder-${i}`}
                    className="ink-chip ink-chip--placeholder"
                    aria-hidden="true"
                  />
                ))}
                {cats.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/work?d=${c.slug}`}
                    className="ink-chip"
                    style={{ '--chip-ink': c.ink, '--chip-on': c.onInk } as React.CSSProperties}
                  >
                    <span className="swatch" style={{ '--swatch': c.ink } as React.CSSProperties} />
                    {catLabel(c)}
                  </Link>
                ))}
              </dd>
            </div>
          )}
          <div className="colophon__cell">
            <dt>{t('PROJECT.IMAGES')}</dt>
            <dd className="tabular">{padNumber(data?.images?.length || 0)}</dd>
          </div>
        </dl>
      </header>

      <div className="project__body">
        {md && <MarkdownView source={md} className="project__prose" onImageClick={openImage} />}
      </div>

      {suggested && (
        <aside className="suggestion" aria-label={t('PROJECT.SUGGESTED')} data-reveal>
          <p className="suggestion__label">{t('PROJECT.SUGGESTED')}</p>
          <Link to={`/work/${suggested.id}`} className="suggestion__link">
            {suggestedCover && (
              <span className="suggestion__thumb">
                <ProgressiveImage
                  src={suggestedCover.image_url}
                  low={suggestedCover.image_low_url}
                  alt=""
                />
              </span>
            )}
            <span className="suggestion__title">{projectTitle(suggested, lang)}</span>
            <IconArrowRight size={18} className="suggestion__arrow" />
          </Link>
        </aside>
      )}
      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`${title} — ${SITE_NAME}`}
        url={pageUrl(`/work/${projectId}`, lang)}
        fileName={
          title
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'andrea-francin'
        }
        card={{
          title,
          categories: cats.map((c) => catLabel(c)),
          imageUrl: coverImage(data)?.image_url || null,
          site: 'andreafrancin.com',
        }}
      />
      {viewer && (
        <Lightbox
          images={viewer.images}
          index={viewer.index}
          originRect={viewer.rect}
          onIndexChange={(index) => setViewer((v) => (v ? { ...v, index } : v))}
          onClose={() => setViewer(null)}
        />
      )}
    </article>
  );
}

export default ProjectDetail;
