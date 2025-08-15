import { fetchAddProjectFromAPI } from '../../../../../services/work/api-request';
import { useCallback, useState } from 'react';
import FormProject from '../form-project';
import { useNavigate } from 'react-router-dom';
import './index.scss';

function AddProject() {
  const navigate = useNavigate();

  const [newImages, setNewImages] = useState<File[]>([]);

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
      const imagesPayload = await Promise.all(
        newImages.map(async (file) => ({
          caption: file.name,
          image: await fileToBase64(file),
          order: 0,
        }))
      );

      const payload = {
        ...data,
        title_i18n: {
          en: data.title,
        },
        content_i18n: {
          en: {
            md: '',
          },
        },
        images: imagesPayload,
      };

      await fetchAddProjectFromAPI(payload);
      navigate('/private', {
        replace: true,
      });
    },
    [newImages]
  );

  return (
    <div className="add-project-container">
      <h1>Add project</h1>
      <FormProject onFormSubmit={onFormSubmit} handleNewImages={handleNewImages} />
    </div>
  );
}

export default AddProject;
