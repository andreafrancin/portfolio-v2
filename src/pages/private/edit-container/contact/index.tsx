import { useCallback, useEffect, useState } from 'react';
import LangSelector from '../../../../components/lang-selector';
import './index.scss';
import {
  fetchContactFromAPI,
  fetchCreateContactFromAPI,
  fetchEditContactFromAPI,
} from '../../../../services/contact/api-request';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../components/toast';
import { useLoading } from '../../../../context/loading-context';

function EditContactContainer() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [currentData, setCurrentData] = useState<any>(null);

  const [titleByLang, setTitleByLang] = useState<Record<string, string>>({});
  const [descriptionByLang, setDescriptionByLang] = useState<Record<string, string>>({});

  const { t } = useTranslation();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  const fetchContactData = useCallback(async () => {
    showLoading();
    try {
      const response = await fetchContactFromAPI();
      setCurrentData(response);

      const record = response?.[0];
      if (record) {
        const titles: Record<string, string> = {};
        const descriptions: Record<string, string> = {};
        if (record.title_i18n) {
          Object.entries(record.title_i18n).forEach(([lang, val]) => {
            titles[lang] = val as string;
          });
        }
        if (record.description_i18n) {
          Object.entries(record.description_i18n).forEach(([lang, val]) => {
            descriptions[lang] = val as string;
          });
        }
        setTitleByLang(titles);
        setDescriptionByLang(descriptions);
      }
    } catch {
      toast.error('Failed to load contact data');
    } finally {
      hideLoading();
    }
  }, []);

  useEffect(() => {
    fetchContactData();
  }, [fetchContactData]);

  const handleLanguageChange = useCallback((lang: string) => {
    setSelectedLanguage(lang);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      showLoading();

      try {
        const record = currentData?.[0];

        const titleI18n: Record<string, string> = {};
        const descriptionI18n: Record<string, string> = {};

        Object.entries(titleByLang).forEach(([lang, val]) => {
          if (val.trim()) titleI18n[lang] = val;
        });
        Object.entries(descriptionByLang).forEach(([lang, val]) => {
          if (val.trim()) descriptionI18n[lang] = val;
        });

        const payload = {
          title_i18n: titleI18n,
          description_i18n: descriptionI18n,
        };

        if (record?.id) {
          await fetchEditContactFromAPI(record.id, payload);
        } else {
          await fetchCreateContactFromAPI(payload);
          await fetchContactData();
        }
        toast.success('Contact page saved');
      } catch {
        toast.error('Something went wrong. Please try again later');
      } finally {
        hideLoading();
      }
    },
    [currentData, titleByLang, descriptionByLang, fetchContactData, toast]
  );

  return (
    <div className="edit-contact-container">
      <LangSelector
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
      />
      <form onSubmit={onSubmit} noValidate>
        <div className="contact-field-container">
          <input
            className="contact-field"
            placeholder="Page title"
            value={titleByLang[selectedLanguage] || ''}
            onChange={(e) =>
              setTitleByLang((prev) => ({ ...prev, [selectedLanguage]: e.target.value }))
            }
          />
        </div>

        <div className="contact-field-container">
          <input
            className="contact-field"
            placeholder="Description"
            value={descriptionByLang[selectedLanguage] || ''}
            onChange={(e) =>
              setDescriptionByLang((prev) => ({ ...prev, [selectedLanguage]: e.target.value }))
            }
          />
        </div>

        <button className="contact-submit-button" type="submit">
          {t('PRIVATE.SAVE')}
        </button>
      </form>
    </div>
  );
}

export default EditContactContainer;
