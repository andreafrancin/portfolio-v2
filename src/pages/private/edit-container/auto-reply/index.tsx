import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageBar from '../../../../components/language-bar';
import { Panel, SaveBar } from '../../../../components/studio';
import { useToast } from '../../../../components/toast';
import Spinner from '../../../../components/spinner';
import { IconMail } from '../../../../components/icons';
import useUnsavedWarning from '../../../../hooks/useUnsavedWarning';
import type { AutoReplyField, AutoReplyTexts } from '../../../../services/contact/api-request';
import {
  fetchAutoReply,
  previewAutoReply,
  saveAutoReply,
  sendAutoReplyTest,
} from '../../../../services/contact/api-request';
import './index.scss';

const LANGS = ['es', 'ca', 'en'] as const;

const FIELDS: { key: AutoReplyField; label: string; hint?: string; rows?: number; max: number }[] =
  [
    { key: 'subject_i18n', label: 'AUTO_REPLY.SUBJECT', max: 150 },
    {
      key: 'greeting_i18n',
      label: 'AUTO_REPLY.GREETING',
      hint: 'AUTO_REPLY.GREETING_HINT',
      max: 120,
    },
    {
      key: 'greeting_anonymous_i18n',
      label: 'AUTO_REPLY.GREETING_ANONYMOUS',
      hint: 'AUTO_REPLY.GREETING_ANONYMOUS_HINT',
      max: 120,
    },
    {
      key: 'body_i18n',
      label: 'AUTO_REPLY.BODY',
      hint: 'AUTO_REPLY.BODY_HINT',
      rows: 7,
      max: 3000,
    },
    { key: 'button_i18n', label: 'AUTO_REPLY.BUTTON', hint: 'AUTO_REPLY.BUTTON_HINT', max: 40 },
    {
      key: 'signature_i18n',
      label: 'AUTO_REPLY.SIGNATURE',
      hint: 'AUTO_REPLY.SIGNATURE_HINT',
      rows: 2,
      max: 200,
    },
  ];

const FIELD_KEYS = FIELDS.map((f) => f.key);
const DEFAULT_KEY: Record<AutoReplyField, string> = {
  subject_i18n: 'subject',
  greeting_i18n: 'greeting',
  greeting_anonymous_i18n: 'greeting_anonymous',
  body_i18n: 'body',
  button_i18n: 'button',
  signature_i18n: 'signature',
};

const emptyTexts = (): AutoReplyTexts =>
  Object.fromEntries(FIELD_KEYS.map((k) => [k, {}])) as unknown as AutoReplyTexts;

const pickTexts = (source: Partial<AutoReplyTexts>): AutoReplyTexts =>
  Object.fromEntries(FIELD_KEYS.map((k) => [k, { ...(source[k] || {}) }])) as AutoReplyTexts;

const serialize = (enabled: boolean, texts: AutoReplyTexts) =>
  JSON.stringify([enabled, FIELD_KEYS.map((k) => LANGS.map((l) => (texts[k][l] || '').trim()))]);

function EditAutoReplyContainer() {
  const { t } = useTranslation();
  const toast = useToast();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [language, setLanguage] = useState<string>('es');
  const [enabled, setEnabled] = useState(true);
  const [texts, setTexts] = useState<AutoReplyTexts>(emptyTexts);
  const [defaults, setDefaults] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewHeight, setPreviewHeight] = useState(720);
  const saved = useRef('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await fetchAutoReply();
      const loaded = pickTexts(data);
      setTexts(loaded);
      setEnabled(data.enabled);
      setDefaults(data.defaults || {});
      saved.current = serialize(data.enabled, loaded);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = status === 'ready' && serialize(enabled, texts) !== saved.current;
  useUnsavedWarning(dirty && !saving);

  const written = useMemo(() => {
    const out: Record<string, boolean> = {};
    LANGS.forEach((l) => (out[l] = FIELD_KEYS.some((k) => !!texts[k][l]?.trim())));
    return out;
  }, [texts]);

  // The preview follows every change, a moment after typing stops.
  useEffect(() => {
    if (status !== 'ready') return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await previewAutoReply({ ...texts, language });
        if (!cancelled) setPreview(result);
      } catch {
        if (!cancelled) setPreview(null);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [texts, language, status]);

  const setField = (key: AutoReplyField, value: string) =>
    setTexts((current) => ({ ...current, [key]: { ...current[key], [language]: value } }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await saveAutoReply({ enabled, ...texts });
      const stored = pickTexts(data);
      setTexts(stored);
      saved.current = serialize(data.enabled, stored);
      toast.success(t('AUTO_REPLY.SAVED'));
    } catch {
      toast.error(t('PRIVATE.SAVE_FAILED'));
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const result = await sendAutoReplyTest({ ...texts, language });
      toast.success(t('AUTO_REPLY.TEST_SENT', { email: result.to }));
    } catch {
      toast.error(t('AUTO_REPLY.TEST_FAILED'));
    } finally {
      setTesting(false);
    }
  };

  if (status === 'loading') {
    return <div className="skeleton" style={{ height: 420 }} />;
  }

  if (status === 'error') {
    return (
      <div className="admin-state">
        <p>{t('PRIVATE.LOAD_FAILED')}</p>
        <button type="button" className="btn btn--ghost" onClick={load}>
          {t('PRIVATE.RETRY')}
        </button>
      </div>
    );
  }

  const fallback = defaults[language] || {};

  return (
    <form className="editor-form editor-form--translated" onSubmit={onSubmit} noValidate>
      <LanguageBar selectedLanguage={language} onLanguageChange={setLanguage} written={written} />

      <div className="auto-reply">
        <div className="auto-reply__fields">
          <Panel title={t('AUTO_REPLY.SENDING')} hint={t('AUTO_REPLY.SENDING_HINT')}>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              className="switch"
              onClick={() => setEnabled((v) => !v)}
            >
              <span className="switch__track" aria-hidden="true">
                <span className="switch__thumb" />
              </span>
              <span className="switch__label">
                {t(enabled ? 'AUTO_REPLY.ON' : 'AUTO_REPLY.OFF')}
              </span>
            </button>
          </Panel>

          <Panel title={t('AUTO_REPLY.TEXTS')} hint={t('AUTO_REPLY.TEXTS_HINT')}>
            {FIELDS.map((field) => {
              const id = `auto-reply-${field.key}`;
              const value = texts[field.key][language] || '';
              const placeholder = fallback[DEFAULT_KEY[field.key]] || '';
              const common = {
                id,
                className: 'input',
                lang: language,
                value,
                placeholder,
                maxLength: field.max,
                'aria-describedby': field.hint ? `${id}-hint` : undefined,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setField(field.key, e.target.value),
              };
              return (
                <div key={field.key} className="field">
                  <div className="field__row">
                    <label className="field__label" htmlFor={id}>
                      {t(field.label)}
                    </label>
                    {value.trim() && (
                      <button
                        type="button"
                        className="auto-reply__reset"
                        onClick={() => setField(field.key, '')}
                      >
                        {t('AUTO_REPLY.USE_DEFAULT')}
                      </button>
                    )}
                  </div>
                  {field.rows ? <textarea {...common} rows={field.rows} /> : <input {...common} />}
                  {field.hint && (
                    <p className="field__hint" id={`${id}-hint`}>
                      {t(field.hint)}
                    </p>
                  )}
                </div>
              );
            })}
          </Panel>
        </div>

        <div className="auto-reply__preview">
          <Panel
            title={t('AUTO_REPLY.PREVIEW')}
            hint={t('AUTO_REPLY.PREVIEW_HINT')}
            aside={
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={sendTest}
                disabled={testing}
              >
                {testing ? <Spinner size={16} /> : <IconMail size={16} />}
                {t('AUTO_REPLY.SEND_TEST')}
              </button>
            }
          >
            {!enabled && <p className="auto-reply__off">{t('AUTO_REPLY.OFF_NOTICE')}</p>}
            <p className="auto-reply__subject">
              <span>{t('AUTO_REPLY.SUBJECT')}</span>
              {preview?.subject || '…'}
            </p>
            <div className={`auto-reply__frame${enabled ? '' : ' is-off'}`}>
              {preview ? (
                <iframe
                  title={t('AUTO_REPLY.PREVIEW')}
                  srcDoc={preview.html}
                  sandbox="allow-same-origin"
                  style={{ height: previewHeight }}
                  onLoad={(e) => {
                    const doc = e.currentTarget.contentDocument;
                    if (doc) setPreviewHeight(doc.documentElement.scrollHeight);
                  }}
                />
              ) : (
                <div className="skeleton" style={{ height: 520 }} />
              )}
            </div>
          </Panel>
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} label={t('PRIVATE.SAVE_CHANGES')} />
    </form>
  );
}

export default EditAutoReplyContainer;
