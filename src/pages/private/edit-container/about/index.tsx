import { useCallback, useEffect, useRef, useState } from 'react';
import LangSelector from '../../../../components/lang-selector';
import './index.scss';
import { useTranslation } from 'react-i18next';
import {
  fetchAboutFromAPI,
  fetchCreateAboutFromAPI,
  fetchEditAboutFromAPI,
  fetchPatchAboutFromAPI,
} from '../../../../services/about/api-request';
import MarkdownEditor from '../../../../components/markdown';
import ImageManager, { ExistingImage, ImageChangePayload } from '../../../../components/image-manager';
import { useToast } from '../../../../components/toast';
import { useLoading } from '../../../../context/loading-context';

function EditAboutContainer() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [currentData, setCurrentData] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);

  const [titleByLang, setTitleByLang] = useState<Record<string, string>>({});
  const [contentByLang, setContentByLang] = useState<Record<string, string>>({});

  const { t } = useTranslation();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  const imagePayloadRef = useRef<ImageChangePayload>({
    existingImages: [],
    newFiles: [],
    removedIds: [],
  });

  const fetchAboutData = useCallback(async () => {
    const response = await fetchAboutFromAPI();
    setCurrentData(response);

    const record = response?.[0];
    if (record) {
      const titles: Record<string, string> = {};
      const contents: Record<string, string> = {};
      if (record.title_i18n) {
        Object.entries(record.title_i18n).forEach(([lang, val]) => {
          titles[lang] = val as string;
        });
      }
      if (record.content_i18n) {
        Object.entries(record.content_i18n).forEach(([lang, val]: [string, any]) => {
          contents[lang] = val?.md || '';
        });
      }
      setTitleByLang(titles);
      setContentByLang(contents);

      if (record.images) {
        setExistingImages(record.images);
      }

      imagePayloadRef.current = {
        existingImages: record.images || [],
        newFiles: [],
        removedIds: [],
      };
    }
    return response;
  }, []);

  useEffect(() => {
    showLoading();
    fetchAboutData().finally(() => hideLoading());
  }, []);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitleByLang((prev) => ({ ...prev, [selectedLanguage]: e.target.value }));
    },
    [selectedLanguage]
  );

  const handleMarkdownChange = useCallback(
    (value: string) => {
      setContentByLang((prev) => ({ ...prev, [selectedLanguage]: value }));
    },
    [selectedLanguage]
  );

  const handleLanguageChange = useCallback((lang: string) => {
    setSelectedLanguage(lang);
  }, []);

  const handleImagesChange = useCallback((payload: ImageChangePayload) => {
    imagePayloadRef.current = payload;
  }, []);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleNewFilesAdded = useCallback(
    async (files: File[]) => {
      const record = currentData?.[0];
      if (!record?.id) return;

      showLoading();
      try {
        const newPayload = await Promise.all(
          files.map(async (file, idx) => ({
            caption: file.name,
            image: await fileToBase64(file),
            order: existingImages.length + idx + 1,
            is_cover: existingImages.length === 0 && idx === 0,
          }))
        );

        await fetchPatchAboutFromAPI(record.id, { images: newPayload });
        await fetchAboutData();
        toast.success('Images uploaded');
      } catch {
        toast.error('Failed to upload images');
      } finally {
        hideLoading();
      }
    },
    [currentData, existingImages, fetchAboutData, toast]
  );

  const handleExistingImageRemoved = useCallback(
    async (imageId: number) => {
      const record = currentData?.[0];
      if (!record?.id) return;

      showLoading();
      try {
        await fetchPatchAboutFromAPI(record.id, { images_to_remove: [imageId] });
        await fetchAboutData();
        toast.success('Image removed');
      } catch {
        toast.error('Failed to remove image');
      } finally {
        hideLoading();
      }
    },
    [currentData, fetchAboutData, toast]
  );

  const handleCopyImageLink = useCallback(
    (imageId: number) => {
      const record = currentData?.[0];
      const imageLink = record?.images?.find((img: any) => img.id === imageId)?.image_url;
      if (imageLink) {
        navigator.clipboard.writeText(imageLink);
        toast.success('Image link copied to clipboard');
      }
    },
    [currentData, toast]
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      showLoading();

      try {
        const record = currentData?.[0];

        const titleI18n: Record<string, string> = {};
        const contentI18n: Record<string, { md: string }> = {};

        Object.entries(titleByLang).forEach(([lang, val]) => {
          if (val.trim()) titleI18n[lang] = val;
        });
        Object.entries(contentByLang).forEach(([lang, val]) => {
          if (val.trim()) contentI18n[lang] = { md: val };
        });

        const { existingImages: imgPayloadExisting, newFiles, removedIds } =
          imagePayloadRef.current;

        const existingPayload = imgPayloadExisting.map((img) => ({
          id: img.id,
          caption: img.caption,
          order: img.order,
          is_cover: !!img.is_cover,
        }));

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
          images: [...existingPayload, ...newPayload],
          images_to_remove: removedIds,
        };

        if (record?.id) {
          await fetchEditAboutFromAPI(record.id, payload);
        } else {
          await fetchCreateAboutFromAPI(payload);
        }

        await fetchAboutData();
        toast.success('About page saved');
      } catch {
        toast.error('Something went wrong. Please try again later');
      } finally {
        hideLoading();
      }
    },
    [currentData, titleByLang, contentByLang, fetchAboutData, toast]
  );

  return (
    <div className="edit-about-container">
      <LangSelector
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        contentByLang={contentByLang}
      />
      <form onSubmit={onSubmit} noValidate>
        <div className="about-form-field-container">
          <input
            className="about-form-field"
            placeholder="Page title"
            value={titleByLang[selectedLanguage] || ''}
            onChange={handleTitleChange}
          />
        </div>

        <div className="about-form-markdown-editor-container">
          <MarkdownEditor
            value={contentByLang[selectedLanguage] || ''}
            onChange={handleMarkdownChange}
            height={400}
          />
        </div>

        <div className="about-image-manager-container">
          <ImageManager
            existingImages={existingImages}
            onImagesChange={handleImagesChange}
            onCopyImageLink={handleCopyImageLink}
            onNewFilesAdded={handleNewFilesAdded}
            onExistingImageRemoved={handleExistingImageRemoved}
          />
        </div>

        <button className="about-submit-button" type="submit">
          {t('PRIVATE.SAVE')}
        </button>
      </form>
    </div>
  );
}

export default EditAboutContainer;
