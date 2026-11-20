import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../components/toast';
import { IconCopy, IconInfo } from '../../../components/icons';

const SITE = 'https://andreafrancin.com';

// A small "i" next to a title that opens a note on what to do for that statistic to work.
export function InfoButton({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [alignEnd, setAlignEnd] = useState(false);
  const wrapper = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className="info" ref={wrapper}>
      <button
        type="button"
        className="info__button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          // Near the right edge the note opens towards the left so it stays on screen.
          const left = wrapper.current?.getBoundingClientRect().left ?? 0;
          setAlignEnd(left + 420 > window.innerWidth);
          setOpen((v) => !v);
        }}
      >
        <IconInfo size={15} />
      </button>
      {open && (
        <div
          className={`info__panel${alignEnd ? ' info__panel--end' : ''}`}
          id={id}
          role="dialog"
          aria-label={label}
        >
          {children}
        </div>
      )}
    </span>
  );
}

function CopyField({ value }: { value: string }) {
  const { t } = useTranslation();
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t('ANALYTICS.LINK_COPIED'));
    } catch {
      toast.error(t('ANALYTICS.COPY_FAILED'));
    }
  };
  return (
    <div className="copy-field">
      <code className="copy-field__value">{value}</code>
      <button
        type="button"
        className="icon-btn"
        onClick={copy}
        aria-label={t('ANALYTICS.COPY_LINK')}
        title={t('ANALYTICS.COPY_LINK')}
      >
        <IconCopy size={16} />
      </button>
    </div>
  );
}

const slug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const PAGES = [
  { path: '/work', key: 'ANALYTICS.PAGE_WORK' },
  { path: '/services', key: 'HEADER.SERVICES' },
  { path: '/about', key: 'HEADER.ABOUT' },
  { path: '/contact', key: 'HEADER.CONTACT' },
];
const SUGGESTED_SOURCES = ['instagram', 'linkedin', 'behance', 'newsletter', 'whatsapp'];

// How to tag the links Andrea shares, with a builder that writes the link for her.
export function SourcesInfo() {
  const { t } = useTranslation();
  const [page, setPage] = useState('/work');
  const [source, setSource] = useState('instagram');
  const [campaign, setCampaign] = useState('');

  const link = useMemo(() => {
    const params = new URLSearchParams();
    if (slug(source)) params.set('utm_source', slug(source));
    if (slug(campaign)) params.set('utm_campaign', slug(campaign));
    const query = params.toString();
    return `${SITE}${page}${query ? `?${query}` : ''}`;
  }, [page, source, campaign]);

  return (
    <>
      <p className="info__title">{t('ANALYTICS.INFO_SOURCES_TITLE')}</p>
      <p>{t('ANALYTICS.INFO_SOURCES_TEXT')}</p>
      <ul className="info__list">
        <li>
          <code>utm_source</code> {t('ANALYTICS.INFO_UTM_SOURCE')}
        </li>
        <li>
          <code>utm_campaign</code> {t('ANALYTICS.INFO_UTM_CAMPAIGN')}
        </li>
      </ul>

      <p className="info__subtitle">{t('ANALYTICS.LINK_BUILDER')}</p>
      <div className="link-builder">
        <label className="link-builder__field">
          <span>{t('ANALYTICS.LINK_PAGE')}</span>
          <select className="input" value={page} onChange={(e) => setPage(e.target.value)}>
            {PAGES.map((p) => (
              <option key={p.path} value={p.path}>
                {t(p.key)}
              </option>
            ))}
          </select>
        </label>
        <label className="link-builder__field">
          <span>{t('ANALYTICS.LINK_SOURCE')}</span>
          <input
            className="input"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="instagram"
          />
        </label>
        <div className="link-builder__chips">
          {SUGGESTED_SOURCES.map((s) => (
            <button
              key={s}
              type="button"
              className="ledger-chip"
              aria-pressed={slug(source) === s}
              onClick={() => setSource(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <label className="link-builder__field">
          <span>
            {t('ANALYTICS.LINK_CAMPAIGN')}{' '}
            <em className="link-builder__optional">{t('CONTACT.FORM.OPTIONAL')}</em>
          </span>
          <input
            className="input"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder={t('ANALYTICS.LINK_CAMPAIGN_PLACEHOLDER')}
          />
        </label>
        <CopyField value={link} />
      </div>
      <p className="info__note">{t('ANALYTICS.INFO_SOURCES_NOTE')}</p>
    </>
  );
}

export function CountriesInfo() {
  const { t } = useTranslation();
  return (
    <>
      <p className="info__title">{t('ANALYTICS.INFO_COUNTRIES_TITLE')}</p>
      <p>{t('ANALYTICS.INFO_COUNTRIES_TEXT')}</p>
      <p className="info__subtitle">{t('ANALYTICS.INFO_COUNTRIES_UNKNOWN')}</p>
      <ul className="info__list">
        <li>{t('ANALYTICS.INFO_COUNTRIES_CASE_1')}</li>
        <li>{t('ANALYTICS.INFO_COUNTRIES_CASE_2')}</li>
        <li>{t('ANALYTICS.INFO_COUNTRIES_CASE_3')}</li>
      </ul>
      <p className="info__note">
        <GeoCredit />
      </p>
    </>
  );
}

// The country data's licence (CC BY 4.0) asks for this credit wherever the data is shown.
export function GeoCredit() {
  const { t } = useTranslation();
  return (
    <>
      {t('ANALYTICS.GEO_CREDIT')}{' '}
      <a href="https://db-ip.com" target="_blank" rel="noreferrer">
        DB-IP.com
      </a>{' '}
      (
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
        CC BY 4.0
      </a>
      )
    </>
  );
}
