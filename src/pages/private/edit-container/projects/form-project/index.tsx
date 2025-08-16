import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import MarkdownEditor from '../../../../../components/markdown';
import './index.scss';
import LangSelector from '../../../../../components/lang-selector';

interface FormProjectProps {
  onFormSubmit: Function;
  currentData?: any;
  existingImages?: any;
  handleRemoveExistingImage?: any;
  handleNewImages?: any;
  isEditProject?: boolean;
  handleMarkdownChange?: Function;
  httpCallLoading?: boolean;
  handleCopyImageLink?: any;
  handleLanguageSelect?: any;
  selectedLanguage?: string;
}

function FormProject({
  onFormSubmit,
  currentData,
  existingImages,
  handleRemoveExistingImage,
  handleNewImages,
  isEditProject,
  handleMarkdownChange,
  httpCallLoading,
  handleCopyImageLink,
  handleLanguageSelect,
  selectedLanguage = 'en',
}: FormProjectProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = async (data: any) => {
    onFormSubmit && onFormSubmit(data);
  };

  return (
    <form className="project-form-container" onSubmit={handleSubmit(onSubmit)} noValidate>
      {isEditProject && <LangSelector handleLanguageSelect={handleLanguageSelect} />}
      <div className="project-field-container">
        <input
          className="project-field"
          placeholder="Title"
          defaultValue={currentData?.title_i18n?.[selectedLanguage] || ''}
          id="title"
          {...register('title', {
            minLength: { value: 2, message: 'Minimum 2 characters' },
          })}
        />
        {errors.title?.message && typeof errors.title.message === 'string' && (
          <p className="project-error-message">{errors.title.message}</p>
        )}
      </div>

      {isEditProject && !httpCallLoading && (
        <div className="project-form-markdown-editor-container">
          <MarkdownEditor
            onChange={handleMarkdownChange}
            className=""
            colorMode="light"
            height={500}
            initialValue={currentData?.content_i18n?.[selectedLanguage]?.md || ''}
          />
        </div>
      )}

      <div className="project-images-section">
        {!!existingImages && existingImages?.length > 0 && (
          <>
            <h4>Existing Images</h4>
            <div className="project-existing-images-section">
              {existingImages.map((img: any) => (
                <div key={img.id} className="project-image-item">
                  <img src={`${img?.image_url}`} alt={img.caption} width={100} />
                  <button
                    className="project-image-remove"
                    type="button"
                    onClick={() => handleRemoveExistingImage(img.id)}
                  >
                    X
                  </button>
                  <button
                    className="project-image-copy-link"
                    type="button"
                    onClick={() => handleCopyImageLink(img.id)}
                  >
                    Copy link
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <h4>New Images</h4>
        <div className="project-field-container">
          <input type="file" multiple onChange={handleNewImages} />
        </div>
      </div>

      <button className="project-submit-button" type="submit">
        Save
      </button>
    </form>
  );
}

export default FormProject;
