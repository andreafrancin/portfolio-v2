import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Category, useCategoryLabel } from '../../../../config/categories';
import { Project } from '../../../../lib/project';
import { bulkProjectCategories } from '../../../../services/work/api-request';
import { useToast } from '../../../../components/toast';
import Spinner from '../../../../components/spinner';
import { IconCheck } from '../../../../components/icons';

type State = 'all' | 'some' | 'none';

interface Props {
  open: boolean;
  projects: Project[];
  categories: Category[];
  onClose: () => void;
  onApplied: (result: Record<string, string[]>) => void;
}

function BulkCategoriesDialog({ open, projects, categories, onClose, onApplied }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const label = useCategoryLabel();
  const ref = useRef<HTMLDialogElement>(null);
  const [states, setStates] = useState<Record<string, State>>({});
  const [saving, setSaving] = useState(false);

  const initial = useMemo(() => {
    const result: Record<string, State> = {};
    for (const c of categories) {
      const count = projects.filter((p) => p.categories?.includes(c.slug)).length;
      result[c.slug] = count === 0 ? 'none' : count === projects.length ? 'all' : 'some';
    }
    return result;
  }, [categories, projects]);

  useEffect(() => {
    if (open) setStates(initial);
  }, [open, initial]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const add = categories.filter((c) => states[c.slug] === 'all' && initial[c.slug] !== 'all');
  const remove = categories.filter((c) => states[c.slug] === 'none' && initial[c.slug] !== 'none');
  const changed = add.length + remove.length > 0;

  const toggle = (slug: string) =>
    setStates((s) => ({ ...s, [slug]: s[slug] === 'all' ? 'none' : 'all' }));

  const apply = async () => {
    setSaving(true);
    try {
      const result = await bulkProjectCategories({
        ids: projects.map((p) => p.id),
        add: add.map((c) => c.slug),
        remove: remove.map((c) => c.slug),
      });
      toast.success(t('PRIVATE.BULK_DONE', { count: projects.length }));
      onApplied(result);
    } catch {
      toast.error(t('PRIVATE.BULK_FAILED'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={ref}
      className="confirm bulk-dialog"
      aria-labelledby="bulk-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !saving) onClose();
      }}
    >
      <div className="confirm__sheet">
        <h2 id="bulk-title" className="confirm__title">
          {t('PRIVATE.BULK_TITLE', { count: projects.length })}
        </h2>
        <p className="bulk-dialog__hint">{t('PRIVATE.BULK_HINT')}</p>

        <ul className="bulk-dialog__list">
          {categories.map((c) => {
            const state = states[c.slug] || 'none';
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={state === 'all' ? 'true' : state === 'some' ? 'mixed' : 'false'}
                  className={`bulk-option bulk-option--${state}`}
                  style={{ '--chip-ink': c.ink } as React.CSSProperties}
                  onClick={() => toggle(c.slug)}
                  disabled={saving}
                >
                  <span className="bulk-option__box" aria-hidden="true">
                    {state === 'all' && <IconCheck size={14} />}
                    {state === 'some' && <span className="bulk-option__dash" />}
                  </span>
                  <span className="swatch" style={{ '--swatch': c.ink } as React.CSSProperties} />
                  <span className="bulk-option__label">{label(c)}</span>
                  {state === 'some' && (
                    <span className="bulk-option__note">{t('PRIVATE.BULK_SOME')}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="bulk-dialog__secondary">
          <button
            type="button"
            className="text-link"
            onClick={() =>
              setStates(Object.fromEntries(categories.map((c) => [c.slug, 'none' as State])))
            }
            disabled={saving}
          >
            {t('PRIVATE.BULK_CLEAR')}
          </button>
          {changed && (
            <button
              type="button"
              className="text-link"
              onClick={() => setStates(initial)}
              disabled={saving}
            >
              {t('PRIVATE.BULK_RESET')}
            </button>
          )}
        </div>

        <div className="confirm__actions">
          <button type="button" className="btn btn--quiet" onClick={onClose} disabled={saving}>
            {t('PRIVATE.CANCEL')}
          </button>
          <button type="button" className="btn" onClick={apply} disabled={!changed || saving}>
            {saving && <Spinner size={16} />}
            {t('PRIVATE.BULK_APPLY')}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default BulkCategoriesDialog;
