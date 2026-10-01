import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchIssuer, saveIssuer } from '../../../services/billing/api-request';
import type { Issuer } from '../../../lib/billing';
import { Panel, SaveBar } from '../../../components/studio';
import { useToast } from '../../../components/toast';
import useUnsavedWarning from '../../../hooks/useUnsavedWarning';

const EMPTY: Issuer = {
  legal_name: '',
  tax_id: '',
  address: '',
  phone: '',
  website: '',
  email: '',
  city: '',
  iban: '',
  quote_conditions: '',
};

const FIELDS: { key: keyof Issuer; label: string; type?: string; wide?: boolean }[] = [
  { key: 'legal_name', label: 'BILLING.LEGAL_NAME' },
  { key: 'tax_id', label: 'BILLING.TAX_ID' },
  { key: 'address', label: 'BILLING.ADDRESS', wide: true },
  { key: 'phone', label: 'BILLING.PHONE', type: 'tel' },
  { key: 'website', label: 'BILLING.WEBSITE' },
  { key: 'email', label: 'BILLING.EMAIL', type: 'email' },
  { key: 'city', label: 'BILLING.CITY' },
  { key: 'iban', label: 'BILLING.IBAN', wide: true },
];

function IssuerSettings() {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState<Issuer>(EMPTY);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const saved = useRef('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await fetchIssuer();
      const next = { ...EMPTY, ...data };
      setForm(next);
      saved.current = JSON.stringify(next);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = status === 'ready' && JSON.stringify(form) !== saved.current;
  useUnsavedWarning(dirty && !saving);

  const set =
    (key: keyof Issuer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await saveIssuer(form);
      const next = { ...EMPTY, ...data };
      setForm(next);
      saved.current = JSON.stringify(next);
      toast.success(t('BILLING.ISSUER_SAVED'));
    } catch {
      toast.error(t('BILLING.SAVE_FAILED'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="issuer-tab">
      <p className="billing-list__intro">{t('BILLING.ISSUER_HINT')}</p>

      {status === 'loading' && <div className="skeleton" style={{ height: 420, maxWidth: 900 }} />}
      {status === 'error' && (
        <div className="admin-state">
          <p>{t('BILLING.LOAD_FAILED')}</p>
          <button type="button" className="btn btn--ghost" onClick={load}>
            {t('PRIVATE.RETRY')}
          </button>
        </div>
      )}

      {status === 'ready' && (
        <form className="editor" onSubmit={onSubmit} noValidate>
          <div className="editor__main">
            <Panel title={t('BILLING.ISSUER')}>
              <div className="form-grid">
                {FIELDS.map((f) => (
                  <div key={f.key} className={`field${f.wide ? ' form-grid__wide' : ''}`}>
                    <label className="field__label" htmlFor={`issuer-${f.key}`}>
                      {t(f.label)}
                    </label>
                    <input
                      id={`issuer-${f.key}`}
                      className="input"
                      type={f.type || 'text'}
                      value={form[f.key]}
                      onChange={set(f.key)}
                    />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <aside className="editor__side">
            <SaveBar dirty={dirty} saving={saving} label={t('PRIVATE.SAVE_CHANGES')} />
          </aside>
        </form>
      )}
    </div>
  );
}

export default IssuerSettings;
