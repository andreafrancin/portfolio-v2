import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LangSelector from '../../../../components/lang-selector';
import {
  fetchAboutFromAPI,
  fetchCreateAboutFromAPI,
  fetchEditAboutFromAPI,
  fetchPatchAboutFromAPI,
} from '../../../../services/about/api-request';
import MarkdownEditor from '../../../../components/markdown';
import ImageManager, {
  ExistingImage,
  ImageChangePayload,
} from '../../../../components/image-manager';
import { Panel, SaveBar } from '../../../../components/studio';
import { useToast } from '../../../../components/toast';
import { useLoading } from '../../../../context/loading-context';
import { fileToBase64 } from '../../../../lib/project';
import useUnsavedWarning from '../../../../hooks/useUnsavedWarning';
import { langLabel } from '../../../../config/site';

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
  const saved = useRef('');

  const imagePayloadRef = useRef<ImageChangePayload>({
    existingImages: [],
    newFiles: [],
    removedIds: [],
  });

  const fetchAboutData = useCallback(async (resetText = true) => {
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
        saved.current = serialize(titles, contents);
      }
      setExistingImages(rec.images || []);
      imagePayloadRef.current = { existingImages: rec.images || [], newFiles: [], removedIds: [] };
    }
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

  const handleNewFilesAdded = useCallback(
    async (files: File[]) => {
      if (!record?.id) return;
      showLoading();
      try {
        const base = existingImages.length;
        const images = await Promise.all(
          files.map(async (file, idx) => ({
            caption: file.name,
            image: await fileToBase64(file),
            order: base + idx + 1,
            is_cover: base === 0 && idx === 0,
          }))
        );
        await fetchPatchAboutFromAPI(record.id, { images });
        await fetchAboutData(false);
        toast.success(t('IMAGES.UPLOADED'));
      } catch {
        toast.error(t('IMAGES.UPLOAD_FAILED'));
      } finally {
        hideLoading();
      }
    },
    [record, existingImages, fetchAboutData, toast, t, showLoading, hideLoading]
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
    <form className="editor" onSubmit={onSubmit} noValidate>
      <div className="editor__main">
        <Panel
          title={t('PRIVATE.PAGE_TITLE')}
          hint={t('PRIVATE.LANG_HINT')}
          aside={
            <LangSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              filled={filled}
            />
          }
        >
          <label className="visually-hidden" htmlFor="about-title">
            {t('PRIVATE.PAGE_TITLE')}
          </label>
          <input
            id="about-title"
            className="input input--lg"
            lang={selectedLanguage}
            value={titleByLang[selectedLanguage] || ''}
            onChange={(e) => setTitleByLang((p) => ({ ...p, [selectedLanguage]: e.target.value }))}
          />
        </Panel>

        <Panel title={`${t('PRIVATE.CONTENT')} · ${langLabel(selectedLanguage)}`}>
          <MarkdownEditor
            value={contentByLang[selectedLanguage] || ''}
            onChange={(value) => setContentByLang((p) => ({ ...p, [selectedLanguage]: value }))}
            height={520}
          />
        </Panel>
      </div>

      <aside className="editor__side">
        <Panel title={t('PRIVATE.IMAGES')}>
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
        <SaveBar dirty={dirty} saving={saving} label={t('PRIVATE.SAVE_CHANGES')} />
      </aside>
    </form>
  );
}

export default EditAboutContainer;
