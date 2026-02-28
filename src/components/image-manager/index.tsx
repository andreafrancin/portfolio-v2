import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../toast';
import './index.scss';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface ExistingImage {
  id: number;
  image_url: string;
  image_low_url?: string;
  caption: string;
  order: number;
  is_cover?: boolean;
}

export interface NewFileWithOrder {
  file: File;
  order: number;
  caption: string;
  is_cover: boolean;
}

export interface ImageItem {
  key: string;
  type: 'existing' | 'new';
  id?: number;
  file?: File;
  previewUrl: string;
  caption: string;
  isCover: boolean;
}

export interface ImageChangePayload {
  existingImages: ExistingImage[];
  newFiles: NewFileWithOrder[];
  removedIds: number[];
}

interface ImageManagerProps {
  existingImages: ExistingImage[];
  onImagesChange: (payload: ImageChangePayload) => void;
  onCopyImageLink?: (id: number) => void;
  onNewFilesAdded?: (files: File[]) => void;
  onExistingImageRemoved?: (id: number) => void;
}

function ImageManager({
  existingImages,
  onImagesChange,
  onCopyImageLink,
  onNewFilesAdded,
  onExistingImageRemoved,
}: ImageManagerProps) {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItemKey = useRef<string | null>(null);
  const dragOverKey = useRef<string | null>(null);
  const toast = useToast();

  // Initialize from existing images on first load or refresh
  useEffect(() => {
    const mapped: ImageItem[] = existingImages.map((img) => ({
      key: `existing-${img.id}`,
      type: 'existing' as const,
      id: img.id,
      previewUrl: img.image_url,
      caption: img.caption,
      isCover: !!img.is_cover,
    }));

    // Restore cover from backend data, or default to first image
    const existingCover = mapped.find((i) => i.isCover);
    if (existingCover) {
      setCoverKey(existingCover.key);
    } else if (mapped.length > 0) {
      mapped[0].isCover = true;
      setCoverKey(mapped[0].key);
    }
    setItems(mapped);
    setRemovedIds([]);
  }, [existingImages]);

  const notifyChange = useCallback(
    (nextItems: ImageItem[], nextCoverKey: string | null, nextRemovedIds: number[]) => {
      let orderCounter = 1;
      const withOrder = nextItems.map((item) => ({
        ...item,
        computedOrder: item.key === nextCoverKey ? 0 : orderCounter++,
        computedIsCover: item.key === nextCoverKey,
      }));

      const existing = withOrder
        .filter((i) => i.type === 'existing')
        .map((i) => ({
          id: i.id!,
          image_url: i.previewUrl,
          caption: i.caption,
          order: i.computedOrder,
          is_cover: i.computedIsCover,
        }));

      const newFiles = withOrder
        .filter((i) => i.type === 'new')
        .map((i) => ({
          file: i.file!,
          order: i.computedOrder,
          caption: i.caption,
          is_cover: i.computedIsCover,
        }));

      onImagesChange({
        existingImages: existing,
        newFiles,
        removedIds: nextRemovedIds,
      });
    },
    [onImagesChange]
  );

  const validateFiles = (files: File[]): File[] => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" is not a supported format (JPEG, PNG, WebP, GIF)`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds 10MB`);
        continue;
      }
      valid.push(file);
    }

    if (errors.length > 0) {
      setValidationError(errors.join('. '));
      setTimeout(() => setValidationError(''), 5000);
    }

    return valid;
  };

  const addFiles = useCallback(
    (files: File[]) => {
      const valid = validateFiles(files);
      if (valid.length === 0) return;

      const newItems: ImageItem[] = valid.map((file, idx) => ({
        key: `new-${Date.now()}-${idx}-${file.name}`,
        type: 'new' as const,
        file,
        previewUrl: URL.createObjectURL(file),
        caption: file.name,
        isCover: false,
      }));

      setItems((prev) => {
        const next = [...prev, ...newItems];
        if (next.length > 0 && !coverKey) {
          next[0].isCover = true;
          setCoverKey(next[0].key);
        }
        notifyChange(next, coverKey || next[0]?.key || null, removedIds);
        return next;
      });

      if (onNewFilesAdded) {
        onNewFilesAdded(valid);
      }
    },
    [coverKey, removedIds, notifyChange, onNewFilesAdded]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = useCallback(
    (key: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.key === key);
        let nextRemovedIds = removedIds;

        if (item?.type === 'existing' && item.id) {
          nextRemovedIds = [...removedIds, item.id];
          setRemovedIds(nextRemovedIds);

          if (onExistingImageRemoved) {
            onExistingImageRemoved(item.id);
          }
        }

        if (item?.type === 'new' && item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }

        const next = prev.filter((i) => i.key !== key);

        let nextCoverKey = coverKey;
        if (coverKey === key) {
          nextCoverKey = next.length > 0 ? next[0].key : null;
          setCoverKey(nextCoverKey);
          if (next.length > 0) next[0].isCover = true;
        }

        notifyChange(next, nextCoverKey, nextRemovedIds);
        return next;
      });

      if (!onExistingImageRemoved) {
        toast.neutral('Image removed', 'Save to confirm changes.');
      }
    },
    [coverKey, removedIds, notifyChange, toast, onExistingImageRemoved]
  );

  const handleSetCover = useCallback(
    (key: string) => {
      setCoverKey(key);
      setItems((prev) => {
        const next = prev.map((item) => ({
          ...item,
          isCover: item.key === key,
        }));
        notifyChange(next, key, removedIds);
        return next;
      });
    },
    [removedIds, notifyChange]
  );

  // Drag reorder handlers
  const handleItemDragStart = (key: string) => {
    dragItemKey.current = key;
  };

  const handleItemDragEnter = (key: string) => {
    dragOverKey.current = key;
  };

  const handleItemDragEnd = () => {
    const fromKey = dragItemKey.current;
    const toKey = dragOverKey.current;

    dragItemKey.current = null;
    dragOverKey.current = null;

    if (!fromKey || !toKey || fromKey === toKey) return;

    setItems((prev) => {
      const fromIdx = prev.findIndex((i) => i.key === fromKey);
      const toIdx = prev.findIndex((i) => i.key === toKey);
      if (fromIdx === -1 || toIdx === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      notifyChange(next, coverKey, removedIds);
      return next;
    });
  };

  return (
    <div className="image-manager">
      {/* Drop zone */}
      <div
        className={`image-drop-zone ${isDragOver ? 'image-drop-zone--active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="image-drop-zone-content">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p>Drop images here or click to browse</p>
          <span className="image-drop-zone-hint">JPEG, PNG, WebP, GIF — max 10MB each</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {validationError && <p className="image-manager-error">{validationError}</p>}

      {/* Image grid */}
      {items.length > 0 && (
        <div className="image-grid">
          {items.map((item) => (
            <div
              key={item.key}
              className={`image-grid-item ${item.isCover ? 'image-grid-item--cover' : ''}`}
              draggable
              onDragStart={() => handleItemDragStart(item.key)}
              onDragEnter={() => handleItemDragEnter(item.key)}
              onDragEnd={handleItemDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <img src={item.previewUrl} alt={item.caption} />

              {item.isCover && <span className="image-cover-badge">Cover</span>}

              <div className="image-grid-item-actions">
                {!item.isCover && (
                  <button
                    type="button"
                    className="image-action-btn image-action-cover"
                    title="Set as cover"
                    onClick={() => handleSetCover(item.key)}
                  >
                    &#9733;
                  </button>
                )}
                {item.type === 'existing' && onCopyImageLink && item.id && (
                  <button
                    type="button"
                    className="image-action-btn image-action-copy"
                    title="Copy link"
                    onClick={() => onCopyImageLink(item.id!)}
                  >
                    &#128279;
                  </button>
                )}
                <button
                  type="button"
                  className="image-action-btn image-action-remove"
                  title="Remove"
                  onClick={() => handleRemove(item.key)}
                >
                  &times;
                </button>
              </div>

              {item.type === 'new' && <span className="image-new-badge">New</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageManager;
