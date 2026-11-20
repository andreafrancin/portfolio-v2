import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from '../../../components/spinner';

export const SECTIONS = [
  { key: 'kpis', label: 'ANALYTICS.SECTION_KPIS' },
  { key: 'timeline', label: 'ANALYTICS.OVER_TIME' },
  { key: 'projects', label: 'ANALYTICS.PROJECTS' },
  { key: 'pages', label: 'ANALYTICS.PAGES' },
  { key: 'sources', label: 'ANALYTICS.SOURCES' },
  { key: 'contact', label: 'ANALYTICS.CONTACT' },
  { key: 'countries', label: 'ANALYTICS.COUNTRIES' },
  { key: 'devices', label: 'ANALYTICS.DEVICES' },
  { key: 'clicks', label: 'ANALYTICS.CLICKS' },
  { key: 'interest', label: 'ANALYTICS.INTEREST' },
  { key: 'entry_exit', label: 'ANALYTICS.ENTRY_EXIT' },
  { key: 'when', label: 'ANALYTICS.WHEN' },
  { key: 'not_found', label: 'ANALYTICS.NOT_FOUND' },
] as const;

export type SectionKey = (typeof SECTIONS)[number]['key'];

// Choose which statistics the page shows. The choice is saved for the whole back office.
export function CustomizeDialog({
  open,
  hidden,
  onClose,
  onSave,
}: {
  open: boolean;
  hidden: SectionKey[];
  onClose: () => void;
  onSave: (hidden: SectionKey[]) => Promise<void>;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<SectionKey[]>(hidden);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setDraft(hidden);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, hidden]);

  const toggle = (key: SectionKey) =>
    setDraft((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    );

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  const shown = SECTIONS.length - draft.length;

  return (
    <dialog
      ref={ref}
      className="confirm form-dialog"
      aria-labelledby="stats-customize-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !saving) onClose();
      }}
    >
      <form
        className="confirm__sheet form-dialog__sheet"
        onSubmit={(e) => {
          e.preventDefault();
          if (!saving) submit();
        }}
      >
        <h2 id="stats-customize-title" className="confirm__title">
          {t('ANALYTICS.CUSTOMIZE_TITLE')}
        </h2>
        <p className="customize__intro">{t('ANALYTICS.CUSTOMIZE_INTRO')}</p>
        <div className="customize__actions">
          <button type="button" className="text-link" onClick={() => setDraft([])}>
            {t('ANALYTICS.SHOW_EVERYTHING')}
          </button>
          <span className="customize__count">
            {t('ANALYTICS.SECTIONS_SHOWN', { shown, total: SECTIONS.length })}
          </span>
        </div>
        <ul className="customize__list">
          {SECTIONS.map((section) => (
            <li key={section.key}>
              <label className="customize__item">
                <input
                  type="checkbox"
                  checked={!draft.includes(section.key)}
                  onChange={() => toggle(section.key)}
                />
                <span>{t(section.label)}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="confirm__actions">
          <button type="button" className="btn btn--quiet" onClick={onClose} disabled={saving}>
            {t('PRIVATE.CANCEL')}
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving && <Spinner size={16} />}
            {t('PRIVATE.SAVE_CHANGES')}
          </button>
        </div>
      </form>
    </dialog>
  );
}
