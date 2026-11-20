import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import RichEditor from '../../../../../components/rich-editor';
import type { EditorImage } from '../../../../../components/rich-editor';
import ImageManager, {
  ExistingImage,
  ImageChangePayload,
} from '../../../../../components/image-manager';
import LanguageBar from '../../../../../components/language-bar';
import { CategoryPicker, Panel, SaveBar, VisibilitySwitch } from '../../../../../components/studio';
import useStickyColumn from '../../../../../hooks/useStickyColumn';
import type { CategorySlug } from '../../../../../config/categories';

function toEditorImage(image: ExistingImage): EditorImage {
  return { id: image.id, url: image.image_url, caption: image.caption };
}

interface FormProjectProps {
  onFormSubmit: () => void;
  existingImages?: ExistingImage[];
  onImagesChange?: (payload: ImageChangePayload) => void;
  onImagesDirty?: () => void;
  onCopyImageLink?: (id: number) => void;
  onNewFilesAdded?: (files: File[]) => void;
  onUploadImages?: (files: File[]) => Promise<ExistingImage[]>;
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
  onUploadImages,
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

  const editorImages = useMemo(() => existingImages.map(toEditorImage), [existingImages]);
  const uploadEditorImages = useMemo(
    () =>
      onUploadImages
        ? async (files: File[]) => (await onUploadImages(files)).map(toEditorImage)
        : undefined,
    [onUploadImages]
  );
  const sideRef = useStickyColumn<HTMLElement>();
  const isTranslated = !!isEditProject && !!onLanguageChange;

  return (
    <form
      className={`editor-form${isTranslated ? ' editor-form--translated' : ''}`}
      onSubmit={handleSubmit}
      noValidate
    >
      {isTranslated && (
        <LanguageBar
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
          written={filledLanguages ?? {}}
        />
      )}
      <div className="editor editor--project">
        <div className="editor__main">
          <Panel
            title={t('PRIVATE.TITLE')}
            hint={isEditProject ? t('ADMIN.SECTION_TEXT_HINT') : t('PRIVATE.CREATE_HINT')}
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
            <Panel title={t('PRIVATE.CONTENT')} hint={t('ADMIN.SECTION_TEXT_HINT')}>
              <RichEditor
                key={selectedLanguage}
                variant="project"
                label={t('PRIVATE.CONTENT')}
                value={markdownValue}
                onChange={onMarkdownChange || (() => {})}
                images={editorImages}
                onUploadImages={uploadEditorImages}
              />
            </Panel>
          )}

          {onImagesChange && (
            <Panel
              title={t('PRIVATE.IMAGES')}
              hint={isEditProject ? t('ADMIN.SECTION_IMAGES_HINT') : undefined}
              collapsible={isEditProject}
            >
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

        <aside className="editor__side" ref={sideRef}>
          {isEditProject && onHiddenChange && (
            <Panel title={t('PRIVATE.VISIBILITY')} collapsible>
              <VisibilitySwitch hidden={!!hidden} onChange={onHiddenChange} />
            </Panel>
          )}

          <Panel
            title={t('PRIVATE.CATEGORIES')}
            hint={t('PRIVATE.CATEGORIES_HINT')}
            collapsible={isEditProject}
          >
            <CategoryPicker value={categories} onChange={onCategoriesChange} />
          </Panel>

          {isEditProject && onSuggestedProjectChange && (
            <Panel
              title={t('PRIVATE.SUGGESTED')}
              hint={t('PRIVATE.SUGGESTED_HINT')}
              collapsible
              defaultOpen={suggestedProject != null}
            >
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
        </aside>
      </div>
      <SaveBar
        dirty={dirty}
        saving={saving}
        disabled={titleMissing}
        disabledReason={t('PRIVATE.TITLE_REQUIRED')}
        label={isEditProject ? t('PRIVATE.SAVE_CHANGES') : t('PRIVATE.CREATE')}
      />
    </form>
  );
}

export default FormProject;
