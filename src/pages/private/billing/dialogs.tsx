import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Client, Condition } from '../../../lib/billing';
import {
  createClient,
  createCondition,
  updateClient,
  updateCondition,
} from '../../../services/billing/api-request';
import { useToast } from '../../../components/toast';
import Spinner from '../../../components/spinner';

function FormDialog({
  open,
  title,
  onClose,
  onSubmit,
  saving,
  canSave,
  submitLabel,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
  canSave: boolean;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
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
      className="confirm form-dialog"
      aria-labelledby="form-dialog-title"
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
          if (canSave && !saving) onSubmit();
        }}
        noValidate
      >
        <h2 id="form-dialog-title" className="confirm__title">
          {title}
        </h2>
        <div className="form-dialog__body">{children}</div>
        <div className="confirm__actions">
          <button type="button" className="btn btn--quiet" onClick={onClose} disabled={saving}>
            {t('PRIVATE.CANCEL')}
          </button>
          <button type="submit" className="btn" disabled={!canSave || saving}>
            {saving && <Spinner size={16} />}
            {submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}

const EMPTY_CLIENT = {
  name: '',
  tax_id: '',
  address: '',
  email: '',
  authorization_text: '',
  notes: '',
};

export function ClientDialog({
  open,
  client,
  onClose,
  onSaved,
}: {
  open: boolean;
  client?: Client | null;
  onClose: () => void;
  onSaved: (client: Client) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(client ? { ...EMPTY_CLIENT, ...client } : EMPTY_CLIENT);
  }, [open, client]);

  const set =
    (key: keyof typeof EMPTY_CLIENT) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        tax_id: form.tax_id,
        address: form.address,
        email: form.email,
        authorization_text: form.authorization_text,
        notes: form.notes,
      };
      const saved = client ? await updateClient(client.id, body) : await createClient(body);
      toast.success(t('BILLING.CLIENT_SAVED_TOAST'));
      onSaved(saved);
    } catch {
      toast.error(t('BILLING.SAVE_FAILED'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title={client ? t('BILLING.EDIT_CLIENT') : t('BILLING.NEW_CLIENT')}
      onClose={onClose}
      onSubmit={submit}
      saving={saving}
      canSave={!!form.name.trim()}
      submitLabel={client ? t('PRIVATE.SAVE_CHANGES') : t('BILLING.CREATE_CLIENT')}
    >
      <div className="form-grid">
        <div className="field form-grid__wide">
          <label className="field__label" htmlFor="client-name">
            {t('BILLING.CLIENT_NAME')}
          </label>
          <input
            id="client-name"
            className="input"
            value={form.name}
            onChange={set('name')}
            autoFocus
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="client-tax">
            {t('BILLING.CLIENT_TAX_ID')}
          </label>
          <input id="client-tax" className="input" value={form.tax_id} onChange={set('tax_id')} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="client-email">
            {t('BILLING.EMAIL')}
          </label>
          <input
            id="client-email"
            className="input"
            type="email"
            value={form.email}
            onChange={set('email')}
          />
        </div>
        <div className="field form-grid__wide">
          <label className="field__label" htmlFor="client-address">
            {t('BILLING.CLIENT_ADDRESS')}
          </label>
          <textarea
            id="client-address"
            className="input"
            rows={3}
            value={form.address}
            onChange={set('address')}
          />
          <span className="field__hint">{t('BILLING.CLIENT_ADDRESS_HINT')}</span>
        </div>
        <div className="field form-grid__wide">
          <label className="field__label" htmlFor="client-auth">
            {t('BILLING.AUTHORIZATION')}
          </label>
          <textarea
            id="client-auth"
            className="input"
            rows={3}
            value={form.authorization_text}
            onChange={set('authorization_text')}
          />
          <span className="field__hint">{t('BILLING.AUTHORIZATION_HINT')}</span>
        </div>
        <div className="field form-grid__wide">
          <label className="field__label" htmlFor="client-notes">
            {t('BILLING.CLIENT_NOTES')}
          </label>
          <textarea
            id="client-notes"
            className="input"
            rows={2}
            value={form.notes}
            onChange={set('notes')}
          />
        </div>
      </div>
    </FormDialog>
  );
}

export function ConditionDialog({
  open,
  condition,
  onClose,
  onSaved,
}: {
  open: boolean;
  condition?: Condition | null;
  onClose: () => void;
  onSaved: (condition: Condition) => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(condition?.title || '');
      setText(condition?.text || '');
    }
  }, [open, condition]);

  const submit = async () => {
    setSaving(true);
    try {
      const body = { title: title.trim(), text };
      const saved = condition
        ? await updateCondition(condition.id, body)
        : await createCondition(body);
      toast.success(t('BILLING.CONDITION_SAVED'));
      onSaved(saved);
    } catch {
      toast.error(t('BILLING.SAVE_FAILED'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={open}
      title={condition ? t('BILLING.EDIT_CONDITION') : t('BILLING.NEW_CONDITION')}
      onClose={onClose}
      onSubmit={submit}
      saving={saving}
      canSave={!!title.trim() && !!text.trim()}
      submitLabel={condition ? t('PRIVATE.SAVE_CHANGES') : t('BILLING.CREATE_CONDITION')}
    >
      <div className="field">
        <label className="field__label" htmlFor="condition-title">
          {t('BILLING.CONDITION_TITLE')}
        </label>
        <input
          id="condition-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('BILLING.CONDITION_TITLE_PLACEHOLDER')}
          autoFocus
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="condition-text">
          {t('BILLING.CONDITION_TEXT')}
        </label>
        <textarea
          id="condition-text"
          className="input"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
    </FormDialog>
  );
}
