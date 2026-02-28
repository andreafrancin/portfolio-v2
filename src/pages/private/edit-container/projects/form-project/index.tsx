import { useCallback } from 'react';
import MarkdownEditor from '../../../../../components/markdown';
import ImageManager, { ExistingImage, ImageChangePayload } from '../../../../../components/image-manager';
import './index.scss';
import LangSelector from '../../../../../components/lang-selector';
import { useTranslation } from 'react-i18next';

interface FormProjectProps {
  onFormSubmit: () => void;
  existingImages?: ExistingImage[];
  onImagesChange?: (payload: ImageChangePayload) => void;
  onCopyImageLink?: (id: number) => void;
  onNewFilesAdded?: (files: File[]) => void;
  onExistingImageRemoved?: (id: number) => void;
  isEditProject?: boolean;
  markdownValue?: string;
  onMarkdownChange?: (value: string) => void;
  titleValue?: string;
  onTitleChange?: (value: string) => void;
  selectedLanguage?: string;
  onLanguageChange?: (lang: string) => void;
  contentByLang?: Record<string, string>;
  hidden?: boolean;
  onHiddenChange?: (val: boolean) => void;
}

function FormProject({
  onFormSubmit,
  existingImages = [],
  onImagesChange,
  onCopyImageLink,
  onNewFilesAdded,
  onExistingImageRemoved,
  isEditProject,
  markdownValue = '',
  onMarkdownChange,
  titleValue = '',
  onTitleChange,
  selectedLanguage = 'en',
  onLanguageChange,
  contentByLang,
  hidden,
  onHiddenChange,
}: FormProjectProps) {
  const { t } = useTranslation();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onFormSubmit();
    },
    [onFormSubmit]
  );

  return (
    <form className="project-form-container" onSubmit={handleSubmit} noValidate>
      {isEditProject && onLanguageChange && (
        <LangSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          contentByLang={contentByLang}
        />
      )}

      <div className="project-field-container">
        <input
          className="project-field"
          placeholder="Title"
          value={titleValue}
          onChange={(e) => onTitleChange?.(e.target.value)}
        />
      </div>

      {isEditProject && onHiddenChange && (
        <label className="project-hidden-toggle">
          <input
            type="checkbox"
            checked={!!hidden}
            onChange={(e) => onHiddenChange(e.target.checked)}
          />
          <span>{t('PRIVATE.HIDDEN')}</span>
        </label>
      )}

      {isEditProject && (
        <div className="project-form-markdown-editor-container">
          <MarkdownEditor
            value={markdownValue}
            onChange={onMarkdownChange || (() => {})}
            height={500}
          />
        </div>
      )}

      {onImagesChange && (
        <ImageManager
          existingImages={existingImages}
          onImagesChange={onImagesChange}
          onCopyImageLink={onCopyImageLink}
          onNewFilesAdded={onNewFilesAdded}
          onExistingImageRemoved={onExistingImageRemoved}
        />
      )}

      <button className="project-submit-button" type="submit">
        {t('PRIVATE.SAVE')}
      </button>
    </form>
  );
}

export default FormProject;
