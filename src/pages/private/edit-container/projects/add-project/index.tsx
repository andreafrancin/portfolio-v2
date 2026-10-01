import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchAddProjectFromAPI } from '../../../../../services/work/api-request';
import FormProject from '../form-project';
import { ImageChangePayload } from '../../../../../components/image-manager';
import { StudioPageHeader } from '../../../../../components/studio';
import { IconArrowLeft } from '../../../../../components/icons';
import { useToast } from '../../../../../components/toast';
import { useLoading } from '../../../../../context/loading-context';
import { fileToBase64 } from '../../../../../lib/project';
import { invalidateProjects } from '../../../../../lib/projects-cache';
import type { CategorySlug } from '../../../../../config/categories';
import useUnsavedWarning from '../../../../../hooks/useUnsavedWarning';

function AddProject() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const { showLoading, hideLoading } = useLoading();

  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<CategorySlug[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const imagePayloadRef = useRef<ImageChangePayload>({
    existingImages: [],
    newFiles: [],
    removedIds: [],
  });

  const handleImagesChange = useCallback((payload: ImageChangePayload) => {
    imagePayloadRef.current = payload;
    setImageCount(payload.newFiles.length);
  }, []);

  const dirty = !!title.trim() || categories.length > 0 || imageCount > 0;
  useUnsavedWarning(dirty && !saving);

  const onFormSubmit = useCallback(async () => {
    setSaving(true);
    showLoading();
    try {
      const imagesPayload = await Promise.all(
        imagePayloadRef.current.newFiles.map(async (nf) => ({
          caption: nf.caption,
          image: await fileToBase64(nf.file),
          order: nf.order,
          is_cover: nf.is_cover,
        }))
      );

      await fetchAddProjectFromAPI({
        title: title.trim(),
        title_i18n: { en: title.trim() },
        content_i18n: { en: { md: '' } },
        categories,
        images: imagesPayload,
      });
      invalidateProjects();
      toast.success(t('PRIVATE.PROJECT_CREATED'));
      navigate('/private', { replace: true });
    } catch {
      toast.error(t('PRIVATE.SAVE_FAILED'));
      setSaving(false);
    } finally {
      hideLoading();
    }
  }, [title, categories, navigate, toast, t, showLoading, hideLoading]);

  return (
    <div className="studio">
      <StudioPageHeader
        back={
          <Link to="/private" className="text-link">
            <IconArrowLeft size={18} /> {t('PRIVATE.BACK')}
          </Link>
        }
        title={t('PRIVATE.NEW_PROJECT')}
      />
      <FormProject
        onFormSubmit={onFormSubmit}
        onImagesChange={handleImagesChange}
        titleValue={title}
        onTitleChange={setTitle}
        categories={categories}
        onCategoriesChange={setCategories}
        dirty={dirty}
        saving={saving}
        titleMissing={!title.trim()}
      />
    </div>
  );
}

export default AddProject;
