import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CategorySlug, useCategories, useCategoryLabel } from '../../config/categories';
import { IconCheck, IconChevronDown, IconEye, IconEyeOff } from '../icons';
import Spinner from '../spinner';
import './index.scss';

export function Panel({
  id,
  title,
  hint,
  aside,
  children,
  className = '',
  collapsible = false,
  defaultOpen = true,
}: {
  id?: string;
  title: string;
  hint?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  if (collapsible) {
    return (
      <details
        id={id}
        className={`panel panel--collapsible ${className}`}
        open={defaultOpen}
        onInvalidCapture={(event) => {
          event.currentTarget.open = true;
        }}
      >
        <summary className="panel__head">
          <h2 className="panel__title">{title}</h2>
          {aside}
          <IconChevronDown size={20} className="panel__chevron" />
        </summary>
        {hint && <p className="panel__hint">{hint}</p>}
        <div className="panel__body">{children}</div>
      </details>
    );
  }

  return (
    <section id={id} className={`panel ${className}`}>
      <header className="panel__head">
        <h2 className="panel__title">{title}</h2>
        {aside}
      </header>
      {hint && <p className="panel__hint">{hint}</p>}
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function CategoryPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: CategorySlug[]) => void;
}) {
  const { t } = useTranslation();
  const categories = useCategories();
  const label = useCategoryLabel();
  const toggle = (slug: CategorySlug) => {
    const set = new Set(value);
    set.has(slug) ? set.delete(slug) : set.add(slug);
    onChange(categories.filter((c) => set.has(c.slug)).map((c) => c.slug));
  };
  return (
    <div className="cat-picker" role="group" aria-label={t('PRIVATE.CATEGORIES')}>
      {categories.map((c) => {
        const checked = value.includes(c.slug);
        return (
          <label
            key={c.slug}
            className={`cat-picker__opt${checked ? ' is-checked' : ''}`}
            style={{ '--c-ink': c.ink, '--c-on': c.onInk } as React.CSSProperties}
          >
            <input type="checkbox" checked={checked} onChange={() => toggle(c.slug)} />
            <span className="cat-picker__box" aria-hidden="true">
              {checked && <IconCheck size={14} />}
            </span>
            <span className="cat-picker__label">{label(c)}</span>
          </label>
        );
      })}
    </div>
  );
}

export function VisibilitySwitch({
  hidden,
  onChange,
}: {
  hidden: boolean;
  onChange: (hidden: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="visibility">
      <button
        type="button"
        role="switch"
        aria-checked={!hidden}
        className="switch"
        onClick={() => onChange(!hidden)}
      >
        <span className="switch__track" aria-hidden="true">
          <span className="switch__thumb" />
        </span>
        <span className="switch__label">
          {hidden ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          {hidden ? t('PRIVATE.HIDDEN') : t('PRIVATE.VISIBLE')}
        </span>
      </button>
      <p className="panel__hint">{hidden ? t('PRIVATE.HIDDEN_HINT') : t('PRIVATE.VISIBLE_HINT')}</p>
    </div>
  );
}

export function SaveBar({
  dirty,
  saving,
  disabled,
  disabledReason,
  label,
}: {
  dirty: boolean;
  saving: boolean;
  disabled?: boolean;
  disabledReason?: string;
  label: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={`save-bar${dirty ? ' is-dirty' : ''}`}>
      <p className="save-bar__status" aria-live="polite">
        <span className="save-bar__dot" aria-hidden="true" />
        {disabled && disabledReason
          ? disabledReason
          : dirty
            ? t('PRIVATE.UNSAVED')
            : t('PRIVATE.ALL_SAVED')}
      </p>
      <button type="submit" className="btn" disabled={saving || disabled}>
        {saving && <Spinner size={16} />}
        {label}
      </button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="confirm"
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
    >
      <div className="confirm__sheet">
        <h2 id="confirm-title" className="confirm__title">
          {title}
        </h2>
        <div className="confirm__body">{children}</div>
        <div className="confirm__actions">
          <button type="button" className="btn btn--quiet" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
            {busy && <Spinner size={16} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function StudioPageHeader({
  back,
  title,
  intro,
  meta,
  actions,
}: {
  back?: React.ReactNode;
  title: string;
  intro?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="studio-head">
      {back && <div className="studio-head__back">{back}</div>}
      <div className="studio-head__row">
        <div>
          <h1 className="studio-head__title">{title}</h1>
          {intro && <p className="studio-head__intro">{intro}</p>}
          {meta && <div className="studio-head__meta">{meta}</div>}
        </div>
        {actions && <div className="studio-head__actions">{actions}</div>}
      </div>
    </header>
  );
}
