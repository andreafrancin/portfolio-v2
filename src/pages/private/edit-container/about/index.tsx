import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageBar from '../../../../components/language-bar';
import {
  fetchAboutFromAPI,
  fetchCreateAboutFromAPI,
  fetchEditAboutFromAPI,
  fetchPatchAboutFromAPI,
} from '../../../../services/about/api-request';
import RichEditor from '../../../../components/rich-editor';
import ImageManager, {
  ExistingImage,
  ImageChangePayload,
} from '../../../../components/image-manager';
import { Panel, SaveBar } from '../../../../components/studio';
import { useToast } from '../../../../components/toast';
import { useLoading } from '../../../../context/loading-context';
import { fileToBase64 } from '../../../../lib/project';
import useStickyColumn from '../../../../hooks/useStickyColumn';
import useUnsavedWarning from '../../../../hooks/useUnsavedWarning';

const serialize = (a: Record<string, string>, b: Record<string, string>) => JSON.stringify([a, b]);

function EditAboutContainer() {
  const { t } = useTranslation();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [record, setRecord] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [titleByLang, setTitleByLang] = useState<Record<string, string>>({});
  const [contentByLang, setContentByLang] = useState<Record<string, string>>({});
  const [imagesDirty, setImagesDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contentRevision, setContentRevision] = useState(0);
  const sideRef = useStickyColumn<HTMLElement>();
  const saved = useRef('');

  const imagePayloadRef = useRef<ImageChangePayload>({
    existingImages: [],
    newFiles: [],
    removedIds: [],
  });

  const fetchAboutData = useCallback(async (resetText = true): Promise<ExistingImage[]> => {
    const response = await fetchAboutFromAPI();
    const rec = response?.[0] || null;
    setRecord(rec);
    if (rec) {
      if (resetText) {
        const titles: Record<string, string> = { ...(rec.title_i18n || {}) };
        const contents: Record<string, string> = {};
        Object.entries(rec.content_i18n || {}).forEach(([lang, val]: [string, any]) => {
          contents[lang] = val?.md || '';
        });
        setTitleByLang(titles);
        setContentByLang(contents);
        setContentRevision((revision) => revision + 1);
        saved.current = serialize(titles, contents);
      }
      setExistingImages(rec.images || []);
      imagePayloadRef.current = { existingImages: rec.images || [], newFiles: [], removedIds: [] };
    }
    return rec?.images || [];
  }, []);

  const load = useCallback(() => {
    setStatus('loading');
    fetchAboutData()
      .then(() => setStatus('ready'))
      .catch(() => setStatus('error'));
  }, [fetchAboutData]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    status === 'ready' && (imagesDirty || serialize(titleByLang, contentByLang) !== saved.current);
  useUnsavedWarning(dirty && !saving);

  const filled = useMemo(() => {
    const out: Record<string, boolean> = {};
    ['es', 'ca', 'en'].forEach(
      (l) => (out[l] = !!(titleByLang[l]?.trim() || contentByLang[l]?.trim()))
    );
    return out;
  }, [titleByLang, contentByLang]);

  const uploadImages = useCallback(
    async (files: File[]): Promise<ExistingImage[]> => {
      if (!record?.id) return [];
      showLoading();
      try {
        const knownIds = new Set(existingImages.map((img) => img.id));
        const base = knownIds.size;
        const images = await Promise.all(
          files.map(async (file, idx) => ({
            caption: file.name,
            image: await fileToBase64(file),
            order: base + idx + 1,
            is_cover: base === 0 && idx === 0,
          }))
        );
        await fetchPatchAboutFromAPI(record.id, { images });
        const refreshed = await fetchAboutData(false);
        toast.success(t('IMAGES.UPLOADED'));
        return refreshed.filter((img) => !knownIds.has(img.id));
      } catch {
        toast.error(t('IMAGES.UPLOAD_FAILED'));
        return [];
      } finally {
        hideLoading();
      }
    },
    [record, existingImages, fetchAboutData, toast, t, showLoading, hideLoading]
  );

  const handleNewFilesAdded = useCallback(
    (files: File[]) => {
      void uploadImages(files);
    },
    [uploadImages]
  );

  const editorImages = useMemo(
    () => existingImages.map((img) => ({ id: img.id, url: img.image_url, caption: img.caption })),
    [existingImages]
  );

  const uploadEditorImages = useCallback(
    async (files: File[]) =>
      (await uploadImages(files)).map((img) => ({
        id: img.id,
        url: img.image_url,
        caption: img.caption,
      })),
    [uploadImages]
  );

  const handleExistingImageRemoved = useCallback(
    async (imageId: number) => {
      if (!record?.id) return;
      showLoading();
      try {
        await fetchPatchAboutFromAPI(record.id, { images_to_remove: [imageId] });
        await fetchAboutData(false);
        toast.success(t('IMAGES.REMOVED'));
      } catch {
        toast.error(t('IMAGES.REMOVE_FAILED'));
      } finally {
        hideLoading();
      }
    },
    [record, fetchAboutData, toast, t, showLoading, hideLoading]
  );

  const handleCopyImageLink = useCallback(
    (imageId: number) => {
      const link = record?.images?.find((img: any) => img.id === imageId)?.image_url;
      if (link) {
        navigator.clipboard.writeText(link).then(
          () => toast.success(t('IMAGES.LINK_COPIED')),
          () => {}
        );
      }
    },
    [record, toast, t]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    showLoading();
    try {
      const titleI18n: Record<string, string> = {};
      const contentI18n: Record<string, { md: string }> = {};
      Object.entries(titleByLang).forEach(([lang, val]) => {
        if (val?.trim()) titleI18n[lang] = val;
      });
      Object.entries(contentByLang).forEach(([lang, val]) => {
        if (val?.trim()) contentI18n[lang] = { md: val };
      });

      const { existingImages: imgs, newFiles, removedIds } = imagePayloadRef.current;
      const newPayload = await Promise.all(
        newFiles.map(async (nf) => ({
          caption: nf.caption,
          image: await fileToBase64(nf.file),
          order: nf.order,
          is_cover: nf.is_cover,
        }))
      );

      const payload = {
        title_i18n: titleI18n,
        content_i18n: contentI18n,
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
      };

      if (record?.id) await fetchEditAboutFromAPI(record.id, payload);
      else await fetchCreateAboutFromAPI(payload);

      await fetchAboutData();
      setImagesDirty(false);
      toast.success(t('PRIVATE.ABOUT_SAVED'));
    } catch {
      toast.error(t('PRIVATE.SAVE_FAILED'));
    } finally {
      setSaving(false);
      hideLoading();
    }
  };

  if (status === 'loading') {
    return (
      <div className="editor">
        <div className="editor__main">
          <div className="skeleton" style={{ height: 160 }} />
          <div className="skeleton" style={{ height: 420 }} />
        </div>
      </div>
    );
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
    <form className="editor-form editor-form--translated" onSubmit={onSubmit} noValidate>
      <LanguageBar
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        written={filled}
      />
      <div className="editor">
        <div className="editor__main">
          <Panel title={t('PRIVATE.PAGE_TITLE')} hint={t('ADMIN.SECTION_TEXT_HINT')}>
            <label className="visually-hidden" htmlFor="about-title">
              {t('PRIVATE.PAGE_TITLE')}
            </label>
            <input
              id="about-title"
              className="input input--lg"
              lang={selectedLanguage}
              value={titleByLang[selectedLanguage] || ''}
              onChange={(e) =>
                setTitleByLang((p) => ({ ...p, [selectedLanguage]: e.target.value }))
              }
            />
          </Panel>

          <Panel title={t('PRIVATE.CONTENT')} hint={t('ADMIN.SECTION_TEXT_HINT')}>
            <RichEditor
              key={`${selectedLanguage}-${contentRevision}`}
              label={t('PRIVATE.CONTENT')}
              value={contentByLang[selectedLanguage] || ''}
              onChange={(value) => setContentByLang((p) => ({ ...p, [selectedLanguage]: value }))}
              images={editorImages}
              onUploadImages={record?.id ? uploadEditorImages : undefined}
            />
          </Panel>
        </div>

        <aside className="editor__side" ref={sideRef}>
          <Panel title={t('PRIVATE.IMAGES')} hint={t('ADMIN.SECTION_IMAGES_HINT')} collapsible>
            <ImageManager
              existingImages={existingImages}
              onImagesChange={(payload) => {
                imagePayloadRef.current = payload;
              }}
              onDirty={() => setImagesDirty(true)}
              onCopyImageLink={handleCopyImageLink}
              onNewFilesAdded={record?.id ? handleNewFilesAdded : undefined}
              onExistingImageRemoved={record?.id ? handleExistingImageRemoved : undefined}
            />
          </Panel>
        </aside>
      </div>
      <SaveBar dirty={dirty} saving={saving} label={t('PRIVATE.SAVE_CHANGES')} />
    </form>
  );
}

export default EditAboutContainer;
