import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAboutFromAPI } from '../../services/about/api-request';
import { useLang } from '../../context/lang-context';
import MarkdownView from '../../components/markdown-view';
import ProgressiveImage from '../../components/progressive-image';
import useSeo from '../../seo/useSeo';
import { PAGE_META } from '../../seo/meta';
import './index.scss';

type Status = 'loading' | 'ready' | 'error';

let aboutCache: any = null;

const PINNED_QUERY = '(min-width: 821px)';

function usePhasedScroll(deps: unknown[]) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [pinned, setPinned] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const text = textRef.current;
    if (!section || !viewport || !text) return;

    const mq = window.matchMedia(PINNED_QUERY);
    let overflow = 0;
    let raf = 0;

    const apply = () => {
      raf = 0;
      if (!mq.matches) return;
      const start = section.getBoundingClientRect().top + window.scrollY;
      const p = overflow > 0 ? Math.min(1, Math.max(0, (window.scrollY - start) / overflow)) : 0;
      text.style.transform = `translate3d(0, ${(-p * overflow).toFixed(1)}px, 0)`;
      setProgress(p);
    };

    const measure = () => {
      if (!mq.matches) {
        setPinned(false);
        section.style.height = '';
        text.style.transform = '';
        return;
      }
      setPinned(true);
      overflow = Math.max(0, text.scrollHeight - viewport.clientHeight);
      section.style.height = `calc(100vh + ${overflow}px)`;
      apply();
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(text);
    ro.observe(viewport);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    mq.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      mq.removeEventListener('change', measure);
      cancelAnimationFrame(raf);
      section.style.height = '';
    };
    // eslint-disable-next-line
  }, deps);

  return { sectionRef, viewportRef, textRef, progress, pinned };
}

function About() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const [record, setRecord] = useState<any>(aboutCache);
  const [status, setStatus] = useState<Status>(aboutCache ? 'ready' : 'loading');
  useSeo({
    title: PAGE_META.about.title[lang],
    description: PAGE_META.about.description[lang],
    type: 'profile',
  });

  const load = useCallback(async () => {
    try {
      const response = await fetchAboutFromAPI();
      aboutCache = response?.[0] || null;
      setRecord(aboutCache);
      setStatus('ready');
    } catch {
      setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const images = record?.images || [];
  const cover = images.find((img: any) => img.is_cover) || images[0];
  const portrait = cover?.image_url || record?.image_url;
  const md = record?.content_i18n?.[lang]?.md || '';

  const { sectionRef, viewportRef, textRef, progress, pinned } = usePhasedScroll([status, md]);

  if (status === 'error') {
    return (
      <section className="about-state">
        <p>{t('ABOUT.ERROR')}</p>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setStatus('loading');
            load();
          }}
        >
          {t('WORK.RETRY')}
        </button>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className={`about${pinned ? ' is-pinned' : ''}`}>
      <div className="about__stage">
        <figure className="about__portrait">
          <div className="about__frame">
            {status === 'loading' ? (
              <div className="skeleton about__skeleton" />
            ) : (
              portrait && (
                <ProgressiveImage
                  src={portrait}
                  low={cover?.image_low_url}
                  alt={t('ABOUT.PORTRAIT')}
                  className="about__img"
                  eager
                />
              )
            )}
          </div>
        </figure>

        <div className="about__column">
          <div
            ref={viewportRef}
            className={`about__viewport${progress > 0.001 ? ' has-above' : ''}${
              progress < 0.999 ? ' has-below' : ''
            }`}
          >
            <div ref={textRef} className="about__text">
              {status === 'loading' ? (
                <div className="about__skeleton-text">
                  <div className="skeleton" style={{ height: 56, width: '60%' }} />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="skeleton"
                      style={{ height: 16, width: `${92 - i * 6}%` }}
                    />
                  ))}
                </div>
              ) : (
                md && <MarkdownView source={md} className="about__prose" />
              )}
            </div>
          </div>
          {pinned && (
            <div className="about__progress" aria-hidden="true">
              <span style={{ transform: `scaleY(${progress})` }} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default About;
