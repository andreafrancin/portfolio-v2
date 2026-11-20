import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../context/lang-context';
import type { ServiceGroup } from '../../services/service-catalog/api-request';
import { fetchServiceGroups, pickText } from '../../services/service-catalog/api-request';
import { IconArrowRight } from '../../components/icons';
import useSeo from '../../seo/useSeo';
import { trackEvent } from '../../lib/analytics';
import { PAGE_META } from '../../seo/meta';
import './index.scss';

let groupsCache: ServiceGroup[] | null = null;

const groupAnchor = (id: number) => `services-${id}`;

// The group whose heading has passed the upper part of the screen is the one being read.
function useActiveGroup(ids: number[]): number | null {
  const [active, setActive] = useState<number | null>(null);
  const key = ids.join(',');

  useEffect(() => {
    const groupIds = key ? key.split(',').map(Number) : [];
    if (!groupIds.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.35;
      let current = groupIds[0];
      for (const id of groupIds) {
        const el = document.getElementById(groupAnchor(id));
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
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
  }, [key]);

  return active;
}

function Services() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const [groups, setGroups] = useState<ServiceGroup[] | null>(groupsCache);
  const [failed, setFailed] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  useSeo({
    title: PAGE_META.services.title[lang],
    description: PAGE_META.services.description[lang],
  });

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const response = await fetchServiceGroups();
      groupsCache = Array.isArray(response) ? response : [];
      setGroups(groupsCache);
    } catch {
      if (!groupsCache) setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = (groups || []).filter((g) => g.services.length > 0);
  const active = useActiveGroup(visible.map((g) => g.id));

  // Keep the highlighted group visible in the index when it scrolls sideways on a phone.
  useEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!nav || !chip) return;
    const left = chip.offsetLeft - (nav.clientWidth - chip.offsetWidth) / 2;
    nav.scrollTo({ left, behavior: 'smooth' });
  }, [active]);

  const goTo = (event: React.MouseEvent<HTMLAnchorElement>, id: number) => {
    const target = document.getElementById(groupAnchor(id));
    if (!target) return;
    event.preventDefault();
    const group = visible.find((g) => g.id === id);
    if (group) trackEvent('services_group', pickText(group.name_i18n, 'es'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <section className="services">
      <header className="services__head">
        <h1 className="services__title">{t('HEADER.SERVICES')}</h1>
        <p className="services__lead">{t('SERVICES.LEAD')}</p>
      </header>

      {visible.length > 1 && (
        <nav className="services-nav" aria-label={t('SERVICES.NAV_LABEL')}>
          <div className="services-nav__track" ref={navRef}>
            {visible.map((group, index) => (
              <a
                key={group.id}
                href={`#${groupAnchor(group.id)}`}
                className="services-nav__link"
                aria-current={active === group.id ? 'true' : undefined}
                onClick={(e) => goTo(e, group.id)}
              >
                <span className="services-nav__index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {pickText(group.name_i18n, lang)}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="services__body">
        {!groups && !failed && (
          <div className="services__loading" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton services__skeleton" />
            ))}
          </div>
        )}

        {failed && (
          <div className="services__state">
            <p>{t('SERVICES.LOAD_FAILED')}</p>
            <button type="button" className="btn btn--ghost" onClick={load}>
              {t('PRIVATE.RETRY')}
            </button>
          </div>
        )}

        {visible.map((group, index) => (
          <section
            key={group.id}
            id={groupAnchor(group.id)}
            className="services-group"
            aria-labelledby={`${groupAnchor(group.id)}-title`}
          >
            <header className="services-group__head">
              <span className="services-group__index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 id={`${groupAnchor(group.id)}-title`} className="services-group__name">
                {pickText(group.name_i18n, lang)}
              </h2>
              <span className="services-group__count">
                {t('SERVICES.COUNT', { count: group.services.length })}
              </span>
            </header>
            <ul className="services-group__list">
              {group.services.map((service) => {
                const description = pickText(service.description_i18n, lang);
                return (
                  <li key={service.id} className="service-card">
                    <h3 className="service-card__name">{pickText(service.name_i18n, lang)}</h3>
                    {description && <p className="service-card__description">{description}</p>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {groups && visible.length > 0 && (
          <aside className="services-cta">
            <p className="services-cta__text">{t('SERVICES.NOTE')}</p>
            <Link to="/contact" className="btn services-cta__button">
              {t('SERVICES.ASK')} <IconArrowRight size={18} />
            </Link>
          </aside>
        )}
      </div>
    </section>
  );
}

export default Services;
