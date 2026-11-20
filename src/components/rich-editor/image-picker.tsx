import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCheck, IconUpload } from '../icons';
import Spinner from '../spinner';
import { isSafeLink } from './extensions';

export interface EditorImage {
  id: number;
  url: string;
  caption: string;
}

export interface PickedImage {
  src: string;
  alt: string;
}

interface ImagePickerProps {
  images: EditorImage[];
  allowsMultiple: boolean;
  onUpload?: (files: File[]) => Promise<EditorImage[]>;
  onPick: (images: PickedImage[]) => void;
  onClose: () => void;
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

function captionToAlt(caption: string): string {
  return caption
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function ImagePicker({ images, allowsMultiple, onUpload, onPick, onClose }: ImagePickerProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const addressId = useId();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [address, setAddress] = useState('');
  const [hasAddressError, setHasAddressError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const toggle = (id: number): void => {
    if (!allowsMultiple) {
      setSelectedIds([id]);
      return;
    }

    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id]
    );
  };

  const insertSelected = (): void => {
    const picked = selectedIds
      .map((id) => images.find((image) => image.id === id))
      .filter((image): image is EditorImage => !!image)
      .map((image) => ({ src: image.url, alt: captionToAlt(image.caption) }));

    if (picked.length > 0) {
      onPick(picked);
    }
  };

  const insertAddress = (): void => {
    const trimmed = address.trim();

    if (!/^https:\/\//i.test(trimmed) || !isSafeLink(trimmed)) {
      setHasAddressError(true);
      return;
    }

    onPick([{ src: trimmed, alt: '' }]);
  };

  const upload = async (files: File[]): Promise<void> => {
    if (!onUpload || files.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      const uploaded = await onUpload(files);

      setSelectedIds((current) =>
        allowsMultiple
          ? [...current, ...uploaded.map((image) => image.id)]
          : uploaded.slice(0, 1).map((image) => image.id)
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="image-picker"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="image-picker__sheet">
        <header className="image-picker__head">
          <div>
            <h2 id={titleId} className="image-picker__title">
              {t('EDITOR.PICKER_TITLE')}
            </h2>
            <p className="image-picker__hint">
              {t(allowsMultiple ? 'EDITOR.PICKER_HINT_MANY' : 'EDITOR.PICKER_HINT_ONE')}
            </p>
          </div>
          {onUpload && (
            <>
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? <Spinner size={16} /> : <IconUpload size={16} />}
                {t('EDITOR.PICKER_UPLOAD')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept={ACCEPTED_TYPES}
                onChange={(event) => {
                  void upload(Array.from(event.target.files ?? []));
                  event.target.value = '';
                }}
              />
            </>
          )}
        </header>

        <div className="image-picker__body">
          {images.length === 0 ? (
            <p className="image-picker__empty">{t('EDITOR.PICKER_EMPTY')}</p>
          ) : (
            <ul className="image-picker__grid">
              {images.map((image) => {
                const position = selectedIds.indexOf(image.id);
                const isSelected = position >= 0;

                return (
                  <li key={image.id}>
                    <button
                      type="button"
                      className="image-picker__option"
                      aria-pressed={isSelected}
                      aria-label={image.caption || t('EDITOR.BLOCK_IMAGE')}
                      onClick={() => toggle(image.id)}
                      onDoubleClick={() =>
                        onPick([{ src: image.url, alt: captionToAlt(image.caption) }])
                      }
                    >
                      <img src={image.url} alt="" loading="lazy" decoding="async" />
                      {isSelected && (
                        <span className="image-picker__mark" aria-hidden="true">
                          {allowsMultiple && selectedIds.length > 1 ? (
                            position + 1
                          ) : (
                            <IconCheck size={14} />
                          )}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <details className="image-picker__address">
            <summary>{t('EDITOR.PICKER_ADDRESS_TOGGLE')}</summary>
            <div className="image-picker__address-row">
              <label className="visually-hidden" htmlFor={addressId}>
                {t('EDITOR.PICKER_ADDRESS')}
              </label>
              <input
                id={addressId}
                className="input"
                inputMode="url"
                placeholder="https://"
                value={address}
                aria-invalid={hasAddressError}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setHasAddressError(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    insertAddress();
                  }
                }}
              />
              <button type="button" className="btn btn--quiet btn--sm" onClick={insertAddress}>
                {t('EDITOR.PICKER_ADDRESS_ADD')}
              </button>
            </div>
            {hasAddressError && (
              <p className="field__error">{t('EDITOR.PICKER_ADDRESS_INVALID')}</p>
            )}
          </details>
        </div>

        <footer className="image-picker__foot">
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            {t('PRIVATE.CANCEL')}
          </button>
          <button
            type="button"
            className="btn"
            disabled={selectedIds.length === 0}
            onClick={insertSelected}
          >
            {t('EDITOR.PICKER_INSERT', { count: Math.max(selectedIds.length, 1) })}
          </button>
        </footer>
      </div>
    </dialog>
  );
}

export default ImagePicker;
