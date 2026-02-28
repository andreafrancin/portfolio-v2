import {
  fetchEditProjectFromAPI,
  fetchPatchProjectFromAPI,
  fetchProjectFromNewAPI,
} from '../../../../../services/work/api-request';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import FormProject from '../form-project';
import { ExistingImage, ImageChangePayload } from '../../../../../components/image-manager';
import './index.scss';
import { useToast } from '../../../../../components/toast';
import { useLoading } from '../../../../../context/loading-context';

function EditProject() {
  const location = useLocation();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [currentData, setCurrentData] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [language, setLanguage] = useState('en');
  const [hidden, setHidden] = useState(false);

  const [titleByLang, setTitleByLang] = useState<Record<string, string>>({});
  const [contentByLang, setContentByLang] = useState<Record<string, string>>({});

  const imagePayloadRef = useRef<ImageChangePayload>({
    existingImages: [],
    newFiles: [],
    removedIds: [],
  });

  const { id } = location.state || {};

  const refreshProjectData = useCallback(async () => {
    const refreshed = await fetchProjectFromNewAPI(id);
    setCurrentData(refreshed);
    if (refreshed?.images) setExistingImages(refreshed.images);
    imagePayloadRef.current = {
      existingImages: refreshed?.images || [],
      newFiles: [],
      removedIds: [],
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    showLoading();
    fetchProjectFromNewAPI(id)
      .then((response) => {
        setCurrentData(response);

        const titles: Record<string, string> = {};
        const contents: Record<string, string> = {};
        if (response?.title_i18n) {
          Object.entries(response.title_i18n).forEach(([lang, val]) => {
            titles[lang] = val as string;
          });
        }
        if (response?.content_i18n) {
          Object.entries(response.content_i18n).forEach(([lang, val]: [string, any]) => {
            contents[lang] = val?.md || '';
          });
        }
        setTitleByLang(titles);
        setContentByLang(contents);
        setHidden(!!response?.hidden);

        if (response?.images) {
          setExistingImages(response.images);
        }
      })
      .catch(() => {
        toast.error('Failed to load project');
      })
      .finally(() => {
        hideLoading();
      });
  }, [id]);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitleByLang((prev) => ({ ...prev, [language]: value }));
    },
    [language]
  );

  const handleMarkdownChange = useCallback(
    (value: string) => {
      setContentByLang((prev) => ({ ...prev, [language]: value }));
    },
    [language]
  );

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang);
  }, []);

  const handleImagesChange = useCallback(
    (payload: typeof imagePayloadRef.current) => {
      imagePayloadRef.current = payload;
    },
    []
  );

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleNewFilesAdded = useCallback(
    async (files: File[]) => {
      if (!id) return;
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

        await fetchPatchProjectFromAPI(id, { images: newPayload });
        await refreshProjectData();
        toast.success('Images uploaded');
      } catch {
        toast.error('Failed to upload images');
      } finally {
        hideLoading();
      }
    },
    [id, existingImages, refreshProjectData, toast]
  );

  const handleExistingImageRemoved = useCallback(
    async (imageId: number) => {
      if (!id) return;
      showLoading();
      try {
        await fetchPatchProjectFromAPI(id, { images_to_remove: [imageId] });
        await refreshProjectData();
        toast.success('Image removed');
      } catch {
        toast.error('Failed to remove image');
      } finally {
        hideLoading();
      }
    },
    [id, refreshProjectData, toast]
  );

  const onFormSubmit = useCallback(async () => {
    showLoading();

    try {
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

      const titleI18n: Record<string, string> = {};
      const contentI18n: Record<string, { md: string }> = {};

      Object.entries(titleByLang).forEach(([lang, val]) => {
        if (val.trim()) titleI18n[lang] = val;
      });
      Object.entries(contentByLang).forEach(([lang, val]) => {
        if (val.trim()) contentI18n[lang] = { md: val };
      });

      const payload = {
        title: titleByLang['en'] || currentData?.title || '',
        content: contentByLang['en'] || currentData?.content || '',
        title_i18n: titleI18n,
        content_i18n: contentI18n,
        hidden,
        images: [...existingPayload, ...newPayload],
        images_to_remove: removedIds,
      };

      await fetchEditProjectFromAPI(id, payload);
      toast.success('Project saved');
      await refreshProjectData();
    } catch {
      toast.error('Something went wrong. Please try again later');
    } finally {
      hideLoading();
    }
  }, [id, titleByLang, contentByLang, hidden, currentData, toast, refreshProjectData, showLoading, hideLoading]);

  const handleCopyImageLink = useCallback(
    (imageId: number) => {
      const imageLink = currentData?.images?.find((img: any) => img.id === imageId)?.image_url;
      if (imageLink) {
        navigator.clipboard.writeText(imageLink);
        toast.success('Image link copied to clipboard');
      }
    },
    [currentData, toast]
  );

  return (
    <div className="edit-project-container">
      <h1>Edit project</h1>
      <FormProject
        onFormSubmit={onFormSubmit}
        existingImages={existingImages}
        onImagesChange={handleImagesChange}
        onCopyImageLink={handleCopyImageLink}
        onNewFilesAdded={handleNewFilesAdded}
        onExistingImageRemoved={handleExistingImageRemoved}
        isEditProject={true}
        markdownValue={contentByLang[language] || ''}
        onMarkdownChange={handleMarkdownChange}
        titleValue={titleByLang[language] || ''}
        onTitleChange={handleTitleChange}
        selectedLanguage={language}
        onLanguageChange={handleLanguageChange}
        contentByLang={contentByLang}
        hidden={hidden}
        onHiddenChange={setHidden}
      />
    </div>
  );
}

export default EditProject;
