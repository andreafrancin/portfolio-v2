import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LangSelector from '../../../../components/lang-selector';
import {
  fetchContactFromAPI,
  fetchCreateContactFromAPI,
  fetchEditContactFromAPI,
} from '../../../../services/contact/api-request';
import { Panel, SaveBar } from '../../../../components/studio';
import { useToast } from '../../../../components/toast';
import { useLoading } from '../../../../context/loading-context';
import useUnsavedWarning from '../../../../hooks/useUnsavedWarning';

const serialize = (a: Record<string, string>, b: Record<string, string>) => JSON.stringify([a, b]);

function EditContactContainer() {
  const { t } = useTranslation();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [record, setRecord] = useState<any>(null);
  const [titleByLang, setTitleByLang] = useState<Record<string, string>>({});
  const [descriptionByLang, setDescriptionByLang] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const saved = useRef('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetchContactFromAPI();
      const rec = response?.[0] || null;
      setRecord(rec);
      const titles = { ...(rec?.title_i18n || {}) };
      const descriptions = { ...(rec?.description_i18n || {}) };
      setTitleByLang(titles);
      setDescriptionByLang(descriptions);
      saved.current = serialize(titles, descriptions);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = status === 'ready' && serialize(titleByLang, descriptionByLang) !== saved.current;
  useUnsavedWarning(dirty && !saving);

  const filled = useMemo(() => {
    const out: Record<string, boolean> = {};
    ['es', 'ca', 'en'].forEach(
      (l) => (out[l] = !!(titleByLang[l]?.trim() || descriptionByLang[l]?.trim()))
    );
    return out;
  }, [titleByLang, descriptionByLang]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    showLoading();
    try {
      const titleI18n: Record<string, string> = {};
      const descriptionI18n: Record<string, string> = {};
      Object.entries(titleByLang).forEach(([lang, val]) => {
        if (val?.trim()) titleI18n[lang] = val;
      });
      Object.entries(descriptionByLang).forEach(([lang, val]) => {
        if (val?.trim()) descriptionI18n[lang] = val;
      });
      const payload = { title_i18n: titleI18n, description_i18n: descriptionI18n };

      if (record?.id) {
        await fetchEditContactFromAPI(record.id, payload);
        saved.current = serialize(titleByLang, descriptionByLang);
        setTitleByLang((v) => ({ ...v }));
      } else {
        await fetchCreateContactFromAPI(payload);
        await load();
      }
      toast.success(t('PRIVATE.CONTACT_SAVED'));
    } catch {
      toast.error(t('PRIVATE.SAVE_FAILED'));
    } finally {
      setSaving(false);
      hideLoading();
    }
  };

  if (status === 'loading') {
    return <div className="skeleton" style={{ height: 320, maxWidth: 760 }} />;
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

  return (
    <form className="editor" onSubmit={onSubmit} noValidate>
      <div className="editor__main">
        <Panel
          title={t('PRIVATE.TABS.CONTACT')}
          hint={t('PRIVATE.LANG_HINT')}
          aside={
            <LangSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              filled={filled}
            />
          }
        >
          <div className="field">
            <label className="field__label" htmlFor="contact-title">
              {t('PRIVATE.PAGE_TITLE')}
            </label>
            <input
              id="contact-title"
              className="input input--lg"
              lang={selectedLanguage}
              value={titleByLang[selectedLanguage] || ''}
              onChange={(e) =>
                setTitleByLang((p) => ({ ...p, [selectedLanguage]: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="contact-description">
              {t('PRIVATE.DESCRIPTION')}
            </label>
            <textarea
              id="contact-description"
              className="input"
              rows={4}
              lang={selectedLanguage}
              value={descriptionByLang[selectedLanguage] || ''}
              onChange={(e) =>
                setDescriptionByLang((p) => ({ ...p, [selectedLanguage]: e.target.value }))
              }
            />
          </div>
        </Panel>
      </div>
      <aside className="editor__side">
        <SaveBar dirty={dirty} saving={saving} label={t('PRIVATE.SAVE_CHANGES')} />
      </aside>
    </form>
  );
}

export default EditContactContainer;
