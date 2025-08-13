import { useForm } from 'react-hook-form';
import './index.scss';
import { useEffect, useState } from 'react';

interface FormProjectProps {
  onFormSubmit: Function;
  currentData?: any;
  existingImages?: any;
}

function FormProject({ onFormSubmit, currentData }: FormProjectProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(currentData?.images || []);
  const [imagesToRemove, setImagesToRemove] = useState<number[]>([]);

  useEffect(() => {
    if (currentData?.images) setExistingImages(currentData.images);
    setImagesToRemove([]);
  }, [currentData]);

  const handleRemoveExistingImage = (id: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
    setImagesToRemove((prev) => [...prev, id]);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const onSubmit = async (data: any) => {
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
      images: [...existingPayload, ...newPayload],
      images_to_remove: imagesToRemove,
    };

    onFormSubmit && onFormSubmit(payload);
  };

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages([...newImages, ...Array.from(e.target.files)]);
    }
  };

  return (
    <form className="project-form-container" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="project-field-container">
        <input
          className="project-field"
          placeholder="Title"
          defaultValue={currentData?.title || ''}
          id="title"
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 2, message: 'Minimum 2 characters' },
          })}
        />
        {errors.title?.message && typeof errors.title.message === 'string' && (
          <p className="project-error-message">{errors.title.message}</p>
        )}
      </div>

      <div className="project-field-container">
        <textarea
          className="project-field-textarea"
          placeholder="Description"
          defaultValue={currentData?.description || ''}
          id="description"
          {...register('description', {
            required: 'Description is required',
            minLength: { value: 10, message: 'Minimum 10 characters' },
          })}
        />
        {errors.description?.message && typeof errors.description.message === 'string' && (
          <p className="project-error-message">{errors.description.message}</p>
        )}
      </div>

      <div className="project-images-section">
        <h4>Existing Images</h4>
        <div className="project-existing-images-section">
          {existingImages.map((img) => (
            <div key={img.id} className="project-image-item">
              <img src={`${img.image_url}`} alt={img.caption} width={100} />
              <button
                className="project-image-remove"
                type="button"
                onClick={() => handleRemoveExistingImage(img.id)}
              >
                X
              </button>
            </div>
          ))}
        </div>

        <h4>New Images</h4>
        <div className="project-field-container">
          <input type="file" multiple onChange={handleNewImages} />
        </div>
      </div>

      <button className="project-submit-button" type="submit">
        Save
      </button>
    </form>
  );
}

export default FormProject;
