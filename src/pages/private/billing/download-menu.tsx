import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DOC_LANGUAGES, DocLanguage } from '../../../lib/billing';
import { IconChevronDown, IconDownload } from '../../../components/icons';
import Spinner from '../../../components/spinner';

interface Props {
  current: DocLanguage;
  onDownload: (lang: DocLanguage) => Promise<void> | void;
  disabled?: boolean;
  busy?: boolean;
  compact?: boolean;
  label?: string;
}

function DownloadMenu({ current, onDownload, disabled, busy, compact, label }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [open]);

  const ordered = [current, ...DOC_LANGUAGES.filter((l) => l !== current)];
  const title = label || t('BILLING.DOWNLOAD');

  return (
    <div className="download-menu" ref={ref}>
      <button
        type="button"
        className={compact ? 'icon-btn' : 'btn btn--quiet btn--sm'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={compact ? title : undefined}
        title={compact ? title : undefined}
        disabled={disabled || busy}
        onClick={() => setOpen((v) => !v)}
      >
        {busy ? <Spinner size={16} /> : <IconDownload size={compact ? 18 : 16} />}
        {!compact && (
          <>
            {title}
            <IconChevronDown size={14} />
          </>
        )}
      </button>
      {open && (
        <div className="download-menu__list" role="menu" aria-label={t('BILLING.DOWNLOAD_IN')}>
          <p className="download-menu__title">{t('BILLING.DOWNLOAD_IN')}</p>
          {ordered.map((lang) => (
            <button
              key={lang}
              type="button"
              role="menuitem"
              className="download-menu__item"
              onClick={() => {
                setOpen(false);
                onDownload(lang);
              }}
            >
              <span className="download-menu__code">{lang.toUpperCase()}</span>
              {t(`BILLING.LANG_${lang}`)}
              {lang === current && <span className="download-menu__dot" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DownloadMenu;
