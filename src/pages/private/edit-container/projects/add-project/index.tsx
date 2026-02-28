import { fetchAddProjectFromAPI } from '../../../../../services/work/api-request';
import { useCallback, useRef, useState } from 'react';
import FormProject from '../form-project';
import { ImageChangePayload } from '../../../../../components/image-manager';
import { useNavigate } from 'react-router-dom';
import './index.scss';
import { useToast } from '../../../../../components/toast';
import { useLoading } from '../../../../../context/loading-context';

function AddProject() {
  const navigate = useNavigate();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [title, setTitle] = useState('');

  const imagePayloadRef = useRef<ImageChangePayload>({
    existingImages: [],
    newFiles: [],
    removedIds: [],
  });

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

  const onFormSubmit = useCallback(async () => {
    showLoading();

    try {
      const { newFiles } = imagePayloadRef.current;

      const imagesPayload = await Promise.all(
        newFiles.map(async (nf) => ({
          caption: nf.caption,
          image: await fileToBase64(nf.file),
          order: nf.order,
          is_cover: nf.is_cover,
        }))
      );

      const payload = {
        title,
        title_i18n: { en: title },
        content_i18n: { en: { md: '' } },
        images: imagesPayload,
      };

      await fetchAddProjectFromAPI(payload);
      toast.success('Project created');
      navigate('/private', { replace: true });
    } catch {
      toast.error('Something went wrong. Please try again later');
    } finally {
      hideLoading();
    }
  }, [title, navigate, toast, showLoading, hideLoading]);

  return (
    <div className="add-project-container">
      <h1>Add project</h1>
      <FormProject
        onFormSubmit={onFormSubmit}
        onImagesChange={handleImagesChange}
        titleValue={title}
        onTitleChange={setTitle}
      />
    </div>
  );
}

export default AddProject;
