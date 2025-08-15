import {
  fetchEditProjectFromAPI,
  fetchProjectFromNewAPI,
} from '../../../../../services/work/api-request';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FormProject from '../form-project';
import './index.scss';

function EditProject() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentData, setCurrentData] = useState<any>(null);
  const [existingImages, setExistingImages] = useState<any[]>(currentData?.images || []);
  const [imagesToRemove, setImagesToRemove] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [httpCallLoading, setHttpCallLoading] = useState(true);
  const [markdownContent, setMarkdownContent] = useState('');
  const [language, setLanguage] = useState('en');

  const { id } = location.state || {};

  useEffect(() => {
    if (currentData?.images) setExistingImages(currentData.images);
    setImagesToRemove([]);
  }, [currentData]);

  const handleRemoveExistingImage = (id: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
    setImagesToRemove((prev) => [...prev, id]);
  };

  useEffect(() => {
    setHttpCallLoading(true);
    fetchProject();
  }, []);

  const fetchProject = useCallback(async () => {
    if (!!id) {
      const response = await fetchProjectFromNewAPI(id);
      setCurrentData(response);
      setHttpCallLoading(false);
    }
  }, [id]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages([...newImages, ...Array.from(e.target.files)]);
    }
  };

  const onFormSubmit = useCallback(
    async (data: any) => {
      const existingPayload = existingImages.map((img) => ({
        id: img.id,
        caption: img.caption,
        order: img.order,
      }));

      const newPayload = await Promise.all(
        newImages.map(async (file) => ({
          caption: file.name,
          image: await fileToBase64(file),
          order: 0,
        }))
      );

      const payload = {
        ...data,
        title: currentData?.title,
        content: language === 'en' ? markdownContent : currentData?.content,
        title_i18n: {
          [language]: data.title || currentData?.title_i18n?.[language],
        },
        content_i18n: {
          [language]: {
            md: markdownContent || currentData?.content_i18n?.[language]?.md,
          },
        },
        images: [...existingPayload, ...newPayload],
        images_to_remove: imagesToRemove,
      };

      await fetchEditProjectFromAPI(id, payload);
      navigate('/private', {
        replace: true,
      });
    },
    [id, newImages, existingImages, imagesToRemove, markdownContent, language, currentData]
  );

  const handleMarkdownChange = useCallback((value: any) => {
    setMarkdownContent(value);
  }, []);

  const handleCopyImageLink = useCallback(
    (id: number) => {
      const imageLink = currentData?.images?.find((img: any) => img.id === id)?.image_url;
      if (imageLink) navigator.clipboard.writeText(imageLink);
    },
    [currentData]
  );

  const handleLanguageSelect = useCallback((event: any) => {
    setLanguage(event?.currentTarget?.value);
  }, []);

  useEffect(() => {
    console.log(currentData);
  }, [currentData]);

  useEffect(() => {
    setHttpCallLoading(true);
    setTimeout(() => {
      setHttpCallLoading(false);
    }, 500);
  }, [language]);

  return (
    <div className="edit-project-container">
      <h1>Edit project</h1>
      <FormProject
        onFormSubmit={onFormSubmit}
        currentData={currentData}
        existingImages={existingImages}
        handleNewImages={handleNewImages}
        handleRemoveExistingImage={handleRemoveExistingImage}
        isEditProject={true}
        handleMarkdownChange={handleMarkdownChange}
        httpCallLoading={httpCallLoading}
        handleCopyImageLink={handleCopyImageLink}
        handleLanguageSelect={handleLanguageSelect}
        selectedLanguage={language}
      />
    </div>
  );
}

export default EditProject;
