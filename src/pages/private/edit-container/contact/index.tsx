import React, { useCallback, useEffect, useState } from 'react';
import LangSelector from '../../../../components/lang-selector';
import './index.scss';
import { useForm } from 'react-hook-form';
import {
  fetchContactFromAPI,
  fetchCreateContactFromAPI,
  fetchEditContactFromAPI,
} from '../../../../services/contact/api-request';
import { useTranslation } from 'react-i18next';

interface EditContactContainerProps {}

function EditContactContainer({}: EditContactContainerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es' | 'ca'>('en');
  const [currentData, setCurrentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const fetchContactData = useCallback(async () => {
    setLoading(true);
    const response = await fetchContactFromAPI();
    setCurrentData(response);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContactData();
  }, [fetchContactData]);

  useEffect(() => {
    const record = currentData?.[0];
    const title = record?.title_i18n?.[selectedLanguage] ?? '';
    const description = record?.description_i18n?.[selectedLanguage] ?? '';
    reset({ title, description });
  }, [currentData, selectedLanguage, reset]);

  const onSubmit = useCallback(
    async (data: any) => {
      const record = currentData?.[0];
      const payload = {
        title_i18n: { [selectedLanguage]: data.title ?? '' },
        description_i18n: { [selectedLanguage]: data.description ?? '' },
      };

      if (record?.id) {
        await fetchEditContactFromAPI(record.id, payload);
      } else {
        await fetchCreateContactFromAPI(payload);
        // tras crear, recarga para obtener el id y futuros updates
        await fetchContactData();
      }
    },
    [currentData, selectedLanguage, fetchContactData]
  );

  const handleLanguageSelect = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedLanguage(event.currentTarget.value as 'en' | 'es' | 'ca');
  }, []);

  return (
    <div className="edit-contact-container">
      <LangSelector handleLanguageSelect={handleLanguageSelect} />
      {!loading && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="contact-field-container">
            <input
              className="contact-field"
              placeholder="Page title"
              id="title"
              {...register('title', {
                minLength: { value: 2, message: 'Minimum 2 characters' },
              })}
            />
            {errors.title?.message && typeof errors.title.message === 'string' && (
              <p className="project-error-message">{errors.title.message}</p>
            )}
          </div>

          <div className="contact-field-container">
            <input
              className="contact-field"
              placeholder="Description"
              id="description"
              {...register('description', {
                minLength: { value: 2, message: 'Minimum 5 characters' },
              })}
            />
            {errors.description?.message && typeof errors.description.message === 'string' && (
              <p className="project-error-message">{errors.description.message}</p>
            )}
          </div>

          <button
            id="submit"
            className="project-submit-button"
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

export default EditContactContainer;
