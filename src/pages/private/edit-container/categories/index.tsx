import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Category,
  loadCategories,
  setCategories,
  useCategories,
  useCategoryLabel,
} from '../../../../config/categories';
import {
  createCategory,
  deleteCategory,
  reorderCategories,
  updateCategory,
} from '../../../../services/categories/api-request';
import { invalidateProjects } from '../../../../lib/projects-cache';
import { useToast } from '../../../../components/toast';
import { ConfirmDialog } from '../../../../components/studio';
import Spinner from '../../../../components/spinner';
import {
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconPlus,
  IconTrash,
} from '../../../../components/icons';
import '../../billing/list.scss';
import './index.scss';

const LANGS = ['es', 'ca', 'en'] as const;

function CategoryDialog({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  const [names, setNames] = useState<Record<string, string>>({ es: '', ca: '', en: '' });
  const [color, setColor] = useState('#bc0e4d');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (open) {
      setNames({ es: '', ca: '', en: '', ...(category?.name_i18n || {}) });
      setColor(category?.ink || '#bc0e4d');
    }
  }, [open, category]);

  const validColor = /^#[0-9a-f]{6}$/i.test(color);
  const canSave = validColor && LANGS.some((l) => names[l]?.trim());

  const submit = async () => {
    setSaving(true);
    try {
      const body = { name_i18n: names, color: color.toLowerCase() };
      if (category?.id) await updateCategory(category.id, body);
      else await createCategory(body);
      await loadCategories(true);
      toast.success(t('PRIVATE.CATEGORY_SAVED'));
      onSaved();
    } catch {
      toast.error(t('PRIVATE.SAVE_FAILED'));
    } finally {
      setSaving(false);
    }
  };

  const preview = names.es || names.ca || names.en || t('PRIVATE.CATEGORY_PREVIEW');

  return (
    <dialog
      ref={ref}
      className="confirm form-dialog"
      aria-labelledby="category-dialog-title"
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
          if (canSave && !saving) submit();
        }}
        noValidate
      >
        <h2 id="category-dialog-title" className="confirm__title">
          {category ? t('PRIVATE.EDIT_CATEGORY') : t('PRIVATE.NEW_CATEGORY')}
        </h2>
        <div className="form-dialog__body">
          {LANGS.map((l, i) => (
            <div key={l} className="field">
              <label className="field__label" htmlFor={`cat-name-${l}`}>
                {t('PRIVATE.CATEGORY_NAME')} · {l.toUpperCase()}
              </label>
              <input
                id={`cat-name-${l}`}
                className="input"
                value={names[l] || ''}
                autoFocus={i === 0}
                onChange={(e) => setNames((n) => ({ ...n, [l]: e.target.value }))}
              />
            </div>
          ))}
          <div className="field">
            <label className="field__label" htmlFor="cat-color">
              {t('PRIVATE.CATEGORY_COLOR')}
            </label>
            <div className="color-field">
              <input
                type="color"
                className="color-field__swatch"
                value={validColor ? color : '#000000'}
                onChange={(e) => setColor(e.target.value)}
                aria-label={t('PRIVATE.CATEGORY_COLOR')}
              />
              <input
                id="cat-color"
                className="input"
                value={color}
                onChange={(e) => setColor(e.target.value.trim())}
                aria-invalid={!validColor || undefined}
                spellCheck={false}
              />
              <span
                className="category-preview"
                style={{ background: validColor ? color : undefined }}
              >
                <span className="category-preview__star" />
                {preview}
              </span>
            </div>
          </div>
        </div>
        <div className="confirm__actions">
          <button type="button" className="btn btn--quiet" onClick={onClose} disabled={saving}>
            {t('PRIVATE.CANCEL')}
          </button>
          <button type="submit" className="btn" disabled={!canSave || saving}>
            {saving && <Spinner size={16} />}
            {category ? t('PRIVATE.SAVE_CHANGES') : t('PRIVATE.CREATE_CATEGORY')}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function EditCategoriesContainer() {
  const { t } = useTranslation();
  const toast = useToast();
  const categories = useCategories();
  const label = useCategoryLabel();
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadCategories(true);
  }, []);

  const move = async (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= categories.length) return;
    const previous = categories;
    const next = [...categories];
    [next[index], next[to]] = [next[to], next[index]];
    setCategories(next.map((c, i) => ({ ...c, order: i })));
    try {
      await reorderCategories(next.map((c) => c.id!).filter(Boolean));
    } catch {
      setCategories(previous);
      toast.error(t('PRIVATE.ORDER_FAILED'));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    setBusy(true);
    try {
      await deleteCategory(toDelete.id);
      await loadCategories(true);
      invalidateProjects();
      toast.success(t('PRIVATE.CATEGORY_DELETED'));
      setToDelete(null);
    } catch {
      toast.error(t('PRIVATE.DELETE_FAILED'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="billing-list">
      <div className="billing-list__toolbar">
        <p className="billing-list__intro">{t('PRIVATE.CATEGORIES_INTRO')}</p>
        <button type="button" className="btn" onClick={() => setEditing(null)}>
          <IconPlus size={18} /> {t('PRIVATE.NEW_CATEGORY')}
        </button>
      </div>

      <ul className="doc-rows">
        {categories.map((c, i) => (
          <li key={c.slug} className="doc-row">
            <span
              className="category-row__swatch"
              style={{ background: c.ink }}
              aria-hidden="true"
            />
            <button
              type="button"
              className="doc-row__main doc-row__main--button"
              onClick={() => setEditing(c)}
            >
              <span className="doc-row__client">{label(c)}</span>
              <span className="doc-row__meta">
                {(['es', 'ca', 'en'] as const)
                  .filter((l) => c.name_i18n[l])
                  .map((l) => (
                    <span key={l}>
                      {l.toUpperCase()} · {c.name_i18n[l]}
                    </span>
                  ))}
                <span className="tabular">{c.ink}</span>
              </span>
            </button>
            <div className="doc-row__actions">
              <button
                type="button"
                className="icon-btn"
                onClick={() => move(i, -1)}
                disabled={i === 0 || !c.id}
                aria-label={`${t('PRIVATE.MOVE_UP')}: ${label(c)}`}
                title={t('PRIVATE.MOVE_UP')}
              >
                <IconChevronUp size={18} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => move(i, 1)}
                disabled={i === categories.length - 1 || !c.id}
                aria-label={`${t('PRIVATE.MOVE_DOWN')}: ${label(c)}`}
                title={t('PRIVATE.MOVE_DOWN')}
              >
                <IconChevronDown size={18} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setEditing(c)}
                aria-label={`${t('PRIVATE.EDIT')}: ${label(c)}`}
                title={t('PRIVATE.EDIT')}
              >
                <IconEdit size={18} />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                onClick={() => setToDelete(c)}
                disabled={!c.id}
                aria-label={`${t('PRIVATE.DELETE')}: ${label(c)}`}
                title={t('PRIVATE.DELETE')}
              >
                <IconTrash size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <CategoryDialog
        open={editing !== undefined}
        category={editing || null}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          invalidateProjects();
        }}
      />
      <ConfirmDialog
        open={!!toDelete}
        title={t('PRIVATE.DELETE_CATEGORY_TITLE')}
        confirmLabel={t('PRIVATE.DELETE')}
        cancelLabel={t('PRIVATE.CANCEL')}
        onConfirm={confirmDelete}
        onCancel={() => !busy && setToDelete(null)}
        busy={busy}
      >
        <p>{toDelete && t('PRIVATE.DELETE_CATEGORY_TEXT', { name: label(toDelete) })}</p>
      </ConfirmDialog>
    </div>
  );
}

export default EditCategoriesContainer;
