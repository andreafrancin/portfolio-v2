import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownEditor from '../../../../../components/markdown';
import ImageManager, {
  ExistingImage,
  ImageChangePayload,
} from '../../../../../components/image-manager';
import LangSelector from '../../../../../components/lang-selector';
import { CategoryPicker, Panel, SaveBar, VisibilitySwitch } from '../../../../../components/studio';
import type { CategorySlug } from '../../../../../config/categories';

interface FormProjectProps {
  onFormSubmit: () => void;
  existingImages?: ExistingImage[];
  onImagesChange?: (payload: ImageChangePayload) => void;
  onImagesDirty?: () => void;
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
  filledLanguages?: Record<string, boolean>;
  hidden?: boolean;
  onHiddenChange?: (val: boolean) => void;
  categories: string[];
  onCategoriesChange: (next: CategorySlug[]) => void;
  dirty: boolean;
  saving: boolean;
  titleMissing: boolean;
  suggestedProject?: number | null;
  onSuggestedProjectChange?: (id: number | null) => void;
  suggestionOptions?: { id: number; title: string; hidden: boolean }[];
}

function FormProject({
  onFormSubmit,
  existingImages = [],
  onImagesChange,
  onImagesDirty,
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
  filledLanguages,
  hidden,
  onHiddenChange,
  categories,
  onCategoriesChange,
  dirty,
  saving,
  titleMissing,
  suggestedProject,
  onSuggestedProjectChange,
  suggestionOptions,
}: FormProjectProps) {
  const { t } = useTranslation();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!titleMissing) onFormSubmit();
    },
    [onFormSubmit, titleMissing]
  );

  return (
    <form className="editor" onSubmit={handleSubmit} noValidate>
      <div className="editor__main">
        <Panel
          title={t('PRIVATE.TITLE')}
          hint={isEditProject ? t('PRIVATE.LANG_HINT') : t('PRIVATE.CREATE_HINT')}
          aside={
            isEditProject &&
            onLanguageChange && (
              <LangSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={onLanguageChange}
                filled={filledLanguages}
              />
            )
          }
        >
          <div className="field">
            <label className="visually-hidden" htmlFor="project-title">
              {t('PRIVATE.TITLE')}
            </label>
            <input
              id="project-title"
              className="input input--lg"
              placeholder={t('PRIVATE.TITLE_PLACEHOLDER')}
              value={titleValue}
              lang={isEditProject ? selectedLanguage : undefined}
              onChange={(e) => onTitleChange?.(e.target.value)}
              autoFocus={!isEditProject}
            />
          </div>
        </Panel>

        {isEditProject && (
          <Panel title={`${t('PRIVATE.CONTENT')} · ${selectedLanguage.toUpperCase()}`}>
            <MarkdownEditor
              value={markdownValue}
              onChange={onMarkdownChange || (() => {})}
              height={560}
            />
          </Panel>
        )}

        {onImagesChange && (
          <Panel title={t('PRIVATE.IMAGES')}>
            <ImageManager
              existingImages={existingImages}
              onImagesChange={onImagesChange}
              onDirty={onImagesDirty}
              onCopyImageLink={onCopyImageLink}
              onNewFilesAdded={onNewFilesAdded}
              onExistingImageRemoved={onExistingImageRemoved}
            />
          </Panel>
        )}
      </div>

      <aside className="editor__side">
        {isEditProject && onHiddenChange && (
          <Panel title={t('PRIVATE.VISIBILITY')}>
            <VisibilitySwitch hidden={!!hidden} onChange={onHiddenChange} />
          </Panel>
        )}
        <Panel title={t('PRIVATE.CATEGORIES')} hint={t('PRIVATE.CATEGORIES_HINT')}>
          <CategoryPicker value={categories} onChange={onCategoriesChange} />
        </Panel>
        {isEditProject && onSuggestedProjectChange && (
          <Panel title={t('PRIVATE.SUGGESTED')} hint={t('PRIVATE.SUGGESTED_HINT')}>
            <label className="visually-hidden" htmlFor="suggested-project">
              {t('PRIVATE.SUGGESTED')}
            </label>
            <select
              id="suggested-project"
              className="input select"
              value={suggestedProject ?? ''}
              onChange={(e) =>
                onSuggestedProjectChange(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">{t('PRIVATE.SUGGESTED_NONE')}</option>
              {suggestionOptions?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.hidden ? `${o.title} (${t('PRIVATE.HIDDEN_LOWER')})` : o.title}
                </option>
              ))}
            </select>
          </Panel>
        )}
        <SaveBar
          dirty={dirty}
          saving={saving}
          disabled={titleMissing}
          disabledReason={t('PRIVATE.TITLE_REQUIRED')}
          label={isEditProject ? t('PRIVATE.SAVE_CHANGES') : t('PRIVATE.CREATE')}
        />
      </aside>
    </form>
  );
}

export default FormProject;
