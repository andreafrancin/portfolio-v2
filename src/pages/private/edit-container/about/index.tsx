import React, { useCallback, useEffect, useState } from 'react';
import LangSelector from '../../../../components/lang-selector';
import './index.scss';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  fetchAboutFromAPI,
  fetchCreateAboutFromAPI,
  fetchEditAboutFromAPI,
} from '../../../../services/about/api-request';
import MarkdownEditor from '../../../../components/markdown';

interface EditAboutContainerProps {}

function EditAboutContainer({}: EditAboutContainerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es' | 'ca'>('en');
  const [currentData, setCurrentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markdownContent, setMarkdownContent] = useState('');

  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: '',
    },
  });

  const fetchAboutData = useCallback(async () => {
    setLoading(true);
    const response = await fetchAboutFromAPI();
    setCurrentData(response);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAboutData();
  }, []);

  useEffect(() => {
    const record = currentData?.[0];
    const title = record?.title_i18n?.[selectedLanguage] ?? '';
    reset({ title });
  }, [currentData, selectedLanguage, reset]);

  const onSubmit = useCallback(
    async (data: any) => {
      const record = currentData?.[0];

      const payload = {
        title_i18n: { [selectedLanguage]: data.title ?? '' },
        content_i18n: {
          [selectedLanguage]: {
            md: markdownContent,
          },
        },
      };

      if (record?.id) {
        await fetchEditAboutFromAPI(record.id, payload);
      } else {
        await fetchCreateAboutFromAPI(payload);
        await fetchAboutData();
      }
    },
    [currentData, selectedLanguage, fetchAboutData, markdownContent]
  );

  const handleLanguageSelect = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedLanguage(event.currentTarget.value as 'en' | 'es' | 'ca');
  }, []);

  const handleMarkdownChange = useCallback((value: any) => {
    setMarkdownContent(value);
  }, []);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [selectedLanguage]);

  return (
    <div className="edit-about-container">
      <LangSelector handleLanguageSelect={handleLanguageSelect} />
      {!loading && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="about-form-field-container">
            <input
              className="about-form-field"
              placeholder="Page title"
              id="title"
              defaultValue={currentData?.[0]?.title_i18n?.[selectedLanguage] || ''}
              {...register('title', {
                minLength: { value: 2, message: 'Minimum 2 characters' },
              })}
            />
            {errors.title?.message && typeof errors.title.message === 'string' && (
              <p className="project-error-message">{errors.title.message}</p>
            )}
          </div>

          {!loading && (
            <div className="about-form-markdown-editor-container">
              <MarkdownEditor
                onChange={handleMarkdownChange}
                className=""
                colorMode="light"
                height={400}
                initialValue={currentData?.[0]?.content_i18n?.[selectedLanguage]?.md || ''}
              />
            </div>
          )}

          <button
            id="submit"
            className="about-submit-button"
            type="submit"
            disabled={selectedLanguage.length === 0 || isSubmitting}
          >
            {isSubmitting ? '...' : t('PRIVATE.SAVE')}
          </button>
        </form>
      )}
    </div>
  );
}

export default EditAboutContainer;
