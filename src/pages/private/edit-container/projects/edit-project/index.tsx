import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  fetchEditProjectFromAPI,
  fetchPatchProjectFromAPI,
  fetchProjectFromNewAPI,
  fetchProjectsFromNewAPI,
} from '../../../../../services/work/api-request';
import FormProject from '../form-project';
import { ExistingImage, ImageChangePayload } from '../../../../../components/image-manager';
import { StudioPageHeader } from '../../../../../components/studio';
import { IconArrowLeft, IconArrowUpRight, IconEyeOff } from '../../../../../components/icons';
import { useToast } from '../../../../../components/toast';
import { useLoading } from '../../../../../context/loading-context';
import { fileToBase64, Project, projectTitle } from '../../../../../lib/project';
import { useLang } from '../../../../../context/lang-context';
import { invalidateProjects } from '../../../../../lib/projects-cache';
import type { CategorySlug } from '../../../../../config/categories';
import useUnsavedWarning from '../../../../../hooks/useUnsavedWarning';

interface Snapshot {
  titleByLang: Record<string, string>;
  contentByLang: Record<string, string>;
  hidden: boolean;
  categories: string[];
  suggested: number | null;
}

const serialize = (s: Snapshot) => JSON.stringify(s);

function EditProject() {
  const { t } = useTranslation();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const params = useParams();
  const id = Number(params.id);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [currentData, setCurrentData] = useState<Project | null>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [language, setLanguage] = useState('es');
  const [hidden, setHidden] = useState(false);
  const [categories, setCategories] = useState<CategorySlug[]>([]);
  const [suggested, setSuggested] = useState<number | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const { lang } = useLang();
  const [titleByLang, setTitleByLang] = useState<Record<string, string>>({});
  const [contentByLang, setContentByLang] = useState<Record<string, string>>({});
  const [imagesDirty, setImagesDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const saved = useRef('');

  const imagePayloadRef = useRef<ImageChangePayload>({
    existingImages: [],
    newFiles: [],
    removedIds: [],
  });

  const applyImages = (project: Project) => {
    setCurrentData(project);
    setExistingImages(project?.images || []);
    imagePayloadRef.current = {
      existingImages: project?.images || [],
      newFiles: [],
      removedIds: [],
    };
  };

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const response: Project = await fetchProjectFromNewAPI(id);
      const titles: Record<string, string> = { ...(response?.title_i18n || {}) };
      const contents: Record<string, string> = {};
      Object.entries(response?.content_i18n || {}).forEach(([lang, val]) => {
        contents[lang] = val?.md || '';
      });
      const cats: CategorySlug[] = [...(response?.categories || [])];
      setTitleByLang(titles);
      setContentByLang(contents);
      setHidden(!!response?.hidden);
      setCategories(cats);
      setSuggested(response?.suggested_project ?? null);
      applyImages(response);
      saved.current = serialize({
        titleByLang: titles,
        contentByLang: contents,
        hidden: !!response?.hidden,
        categories: cats,
        suggested: response?.suggested_project ?? null,
      });
      setImagesDirty(false);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [id]);

  useEffect(() => {
    load();
    fetchProjectsFromNewAPI()
      .then((list: Project[]) => setAllProjects([...list].sort((a, b) => a.order - b.order)))
      .catch(() => {});
  }, [load]);

  const suggestionOptions = useMemo(
    () =>
      allProjects
        .filter((p) => p.id !== id)
        .map((p) => ({
          id: p.id,
          title: projectTitle(p, lang) || t('PRIVATE.UNTITLED'),
          hidden: p.hidden,
        })),
    [allProjects, id, lang, t]
  );

  const refreshImages = useCallback(async () => {
    const refreshed: Project = await fetchProjectFromNewAPI(id);
    applyImages(refreshed);
  }, [id]);

  const dirty =
    status === 'ready' &&
    (imagesDirty ||
      serialize({ titleByLang, contentByLang, hidden, categories, suggested }) !== saved.current);
  useUnsavedWarning(dirty && !saving);

  const filledLanguages = useMemo(() => {
    const out: Record<string, boolean> = {};
    ['es', 'ca', 'en'].forEach((l) => {
      out[l] = !!(titleByLang[l]?.trim() || contentByLang[l]?.trim());
    });
    return out;
  }, [titleByLang, contentByLang]);

  const handleNewFilesAdded = useCallback(
    async (files: File[]) => {
      showLoading();
      try {
        const base = existingImages.length;
        const newPayload = await Promise.all(
          files.map(async (file, idx) => ({
            caption: file.name,
            image: await fileToBase64(file),
            order: base + idx + 1,
            is_cover: base === 0 && idx === 0,
          }))
        );
        await fetchPatchProjectFromAPI(id, { images: newPayload });
        await refreshImages();
        invalidateProjects();
        toast.success(t('IMAGES.UPLOADED'));
      } catch {
        toast.error(t('IMAGES.UPLOAD_FAILED'));
        refreshImages().catch(() => {});
      } finally {
        hideLoading();
      }
    },
    [id, existingImages, refreshImages, toast, t, showLoading, hideLoading]
  );

  const handleExistingImageRemoved = useCallback(
    async (imageId: number) => {
      showLoading();
      try {
        await fetchPatchProjectFromAPI(id, { images_to_remove: [imageId] });
        await refreshImages();
        invalidateProjects();
        toast.success(t('IMAGES.REMOVED'));
      } catch {
        toast.error(t('IMAGES.REMOVE_FAILED'));
        refreshImages().catch(() => {});
      } finally {
        hideLoading();
      }
    },
    [id, refreshImages, toast, t, showLoading, hideLoading]
  );

  const onFormSubmit = useCallback(async () => {
    setSaving(true);
    showLoading();
    try {
      const { existingImages: imgs, newFiles, removedIds } = imagePayloadRef.current;
      const newPayload = await Promise.all(
        newFiles.map(async (nf) => ({
          caption: nf.caption,
          image: await fileToBase64(nf.file),
          order: nf.order,
          is_cover: nf.is_cover,
        }))
      );

      const titleI18n: Record<string, string> = {};
      const contentI18n: Record<string, { md: string }> = {};
      Object.entries(titleByLang).forEach(([lang, val]) => {
        if (val?.trim()) titleI18n[lang] = val;
      });
      Object.entries(contentByLang).forEach(([lang, val]) => {
        if (val?.trim()) contentI18n[lang] = { md: val };
      });

      await fetchEditProjectFromAPI(id, {
        title: titleByLang.en || titleByLang.es || currentData?.title || '',
        content: contentByLang.en || (currentData as any)?.content || '',
        title_i18n: titleI18n,
        content_i18n: contentI18n,
        hidden,
        categories,
        suggested_project: suggested,
        images: [
          ...imgs.map((img) => ({
            id: img.id,
            caption: img.caption,
            order: img.order,
            is_cover: !!img.is_cover,
          })),
          ...newPayload,
        ],
        images_to_remove: removedIds,
      });

      saved.current = serialize({ titleByLang, contentByLang, hidden, categories, suggested });
      setImagesDirty(false);
      invalidateProjects();
      toast.success(t('PRIVATE.PROJECT_SAVED'));
      await refreshImages();
    } catch {
      toast.error(t('PRIVATE.SAVE_FAILED'));
    } finally {
      setSaving(false);
      hideLoading();
    }
  }, [
    id,
    titleByLang,
    contentByLang,
    hidden,
    categories,
    suggested,
    currentData,
    toast,
    t,
    refreshImages,
    showLoading,
    hideLoading,
  ]);

  const handleCopyImageLink = useCallback(
    (imageId: number) => {
      const link = currentData?.images?.find((img) => img.id === imageId)?.image_url;
      if (link) {
        navigator.clipboard.writeText(link).then(
          () => toast.success(t('IMAGES.LINK_COPIED')),
          () => {}
        );
      }
    },
    [currentData, toast, t]
  );

  const back = (
    <Link to="/private" className="text-link">
      <IconArrowLeft size={18} /> {t('PRIVATE.BACK')}
    </Link>
  );

  if (status !== 'ready') {
    return (
      <div className="studio">
        <StudioPageHeader back={back} title={t('PRIVATE.EDIT_PROJECT')} />
        {status === 'loading' ? (
          <div className="editor">
            <div className="editor__main">
              <div className="skeleton" style={{ height: 160 }} />
              <div className="skeleton" style={{ height: 420 }} />
            </div>
            <div className="editor__side">
              <div className="skeleton" style={{ height: 280 }} />
            </div>
          </div>
        ) : (
          <div className="admin-state">
            <p>{t('PRIVATE.LOAD_FAILED')}</p>
            <button type="button" className="btn btn--ghost" onClick={load}>
              {t('PRIVATE.RETRY')}
            </button>
          </div>
        )}
      </div>
    );
  }

  const displayTitle =
    titleByLang[language] ||
    titleByLang.es ||
    titleByLang.en ||
    currentData?.title ||
    t('PRIVATE.UNTITLED');

  return (
    <div className="studio">
      <StudioPageHeader
        back={back}
        title={displayTitle}
        meta={
          <>
            <span>{t('PRIVATE.EDIT_PROJECT')}</span>
            {hidden && (
              <span className="project-row__hidden">
                <IconEyeOff size={14} /> {t('PRIVATE.HIDDEN')}
              </span>
            )}
          </>
        }
        actions={
          !hidden && (
            <Link to={`/work/${id}`} target="_blank" className="btn btn--quiet btn--sm">
              {t('PRIVATE.VIEW_LIVE')} <IconArrowUpRight size={16} />
            </Link>
          )
        }
      />
      <FormProject
        onFormSubmit={onFormSubmit}
        existingImages={existingImages}
        onImagesChange={(payload) => {
          imagePayloadRef.current = payload;
        }}
        onImagesDirty={() => setImagesDirty(true)}
        onCopyImageLink={handleCopyImageLink}
        onNewFilesAdded={handleNewFilesAdded}
        onExistingImageRemoved={handleExistingImageRemoved}
        isEditProject
        markdownValue={contentByLang[language] || ''}
        onMarkdownChange={(value) => setContentByLang((prev) => ({ ...prev, [language]: value }))}
        titleValue={titleByLang[language] || ''}
        onTitleChange={(value) => setTitleByLang((prev) => ({ ...prev, [language]: value }))}
        selectedLanguage={language}
        onLanguageChange={setLanguage}
        filledLanguages={filledLanguages}
        hidden={hidden}
        onHiddenChange={setHidden}
        categories={categories}
        onCategoriesChange={setCategories}
        dirty={dirty}
        saving={saving}
        titleMissing={!Object.values(titleByLang).some((v) => v?.trim())}
        suggestedProject={suggested}
        onSuggestedProjectChange={setSuggested}
        suggestionOptions={suggestionOptions}
      />
    </div>
  );
}

export default EditProject;
