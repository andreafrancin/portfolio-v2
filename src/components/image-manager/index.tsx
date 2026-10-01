import { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useToast } from '../toast';
import ProgressiveImage from '../progressive-image';
import useSortable, { moveItem } from '../../hooks/useSortable';
import { IconClose, IconGrip, IconLink, IconSparkle, IconUpload, IconAlert } from '../icons';
import './index.scss';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface ExistingImage {
  id: number;
  image_url: string;
  image_low_url?: string | null;
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
  lowUrl?: string | null;
  caption: string;
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
  onDirty?: () => void;
}

const hasFiles = (e: DragEvent | React.DragEvent) =>
  Array.from(e.dataTransfer?.types || []).includes('Files');

function ImageManager({
  existingImages,
  onImagesChange,
  onCopyImageLink,
  onNewFilesAdded,
  onExistingImageRemoved,
  onDirty,
}: ImageManagerProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [items, setItems] = useState<ImageItem[]>([]);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [fileDragActive, setFileDragActive] = useState(false);
  const [overZone, setOverZone] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const state = useRef({ items, coverKey, removedIds });
  state.current = { items, coverKey, removedIds };

  useEffect(() => {
    const mapped: ImageItem[] = [...existingImages]
      .sort((a, b) => a.order - b.order)
      .map((img) => ({
        key: `existing-${img.id}`,
        type: 'existing' as const,
        id: img.id,
        previewUrl: img.image_url,
        lowUrl: img.image_low_url,
        caption: img.caption,
      }));
    const cover = existingImages.find((i) => i.is_cover);
    setCoverKey(cover ? `existing-${cover.id}` : mapped[0]?.key || null);
    setItems(mapped);
    setRemovedIds([]);
  }, [existingImages]);

  const notifyChange = useCallback(
    (nextItems: ImageItem[], nextCoverKey: string | null, nextRemovedIds: number[]) => {
      let orderCounter = 1;
      const withOrder = nextItems.map((item) => ({
        ...item,
        order: item.key === nextCoverKey ? 0 : orderCounter++,
        isCover: item.key === nextCoverKey,
      }));

      onImagesChange({
        existingImages: withOrder
          .filter((i) => i.type === 'existing')
          .map((i) => ({
            id: i.id!,
            image_url: i.previewUrl,
            caption: i.caption,
            order: i.order,
            is_cover: i.isCover,
          })),
        newFiles: withOrder
          .filter((i) => i.type === 'new')
          .map((i) => ({ file: i.file!, order: i.order, caption: i.caption, is_cover: i.isCover })),
        removedIds: nextRemovedIds,
      });
    },
    [onImagesChange]
  );

  const validateFiles = (files: File[]): File[] => {
    const valid: File[] = [];
    const problems: string[] = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        problems.push(t('IMAGES.INVALID_TYPE', { name: file.name }));
      } else if (file.size > MAX_FILE_SIZE) {
        problems.push(t('IMAGES.TOO_BIG', { name: file.name }));
      } else {
        valid.push(file);
      }
    }
    setErrors(problems);
    return valid;
  };

  const addFiles = (files: File[]) => {
    const valid = validateFiles(files);
    if (valid.length === 0) return;

    const stamp = Date.now();
    const newItems: ImageItem[] = valid.map((file, idx) => ({
      key: `new-${stamp}-${idx}-${file.name}`,
      type: 'new' as const,
      file,
      previewUrl: URL.createObjectURL(file),
      caption: file.name,
    }));

    const { items: current, coverKey: currentCover, removedIds: removed } = state.current;
    const next = [...current, ...newItems];
    const nextCover = currentCover || next[0]?.key || null;
    setItems(next);
    setCoverKey(nextCover);
    notifyChange(next, nextCover, removed);

    onNewFilesAdded?.(valid);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  useEffect(() => {
    let depth = 0;
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setFileDragActive(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setFileDragActive(false);
    };
    const onEnd = () => {
      depth = 0;
      setFileDragActive(false);
      setOverZone(false);
    };
    const onOver = (e: DragEvent) => hasFiles(e) && e.preventDefault();
    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('dragover', onOver);
    window.addEventListener('drop', onEnd);
    window.addEventListener('dragend', onEnd);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('drop', onEnd);
      window.removeEventListener('dragend', onEnd);
    };
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setOverZone(false);
    setFileDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
  };

  const handleRemove = (key: string) => {
    const { items: current, coverKey: currentCover, removedIds: removed } = state.current;
    const item = current.find((i) => i.key === key);
    if (!item) return;

    let nextRemoved = removed;
    if (item.type === 'existing' && item.id) {
      nextRemoved = [...removed, item.id];
      setRemovedIds(nextRemoved);
      onExistingImageRemoved?.(item.id);
    }
    if (item.type === 'new') URL.revokeObjectURL(item.previewUrl);

    const next = current.filter((i) => i.key !== key);
    const nextCover = currentCover === key ? next[0]?.key || null : currentCover;
    setItems(next);
    setCoverKey(nextCover);
    notifyChange(next, nextCover, nextRemoved);

    if (!onExistingImageRemoved) {
      onDirty?.();
      toast.neutral(t('IMAGES.REMOVED_PENDING'));
    }
  };

  const handleSetCover = (key: string) => {
    setCoverKey(key);
    notifyChange(state.current.items, key, state.current.removedIds);
    onDirty?.();
  };

  const sortable = useSortable<ImageItem>({
    items,
    axis: 'grid',
    getKey: (i) => i.key,
    getLabel: (i) => i.caption,
    onReorder: (from, to) => {
      const next = moveItem(state.current.items, from, to);
      state.current.items = next;
      setItems(next);
      notifyChange(next, state.current.coverKey, state.current.removedIds);
    },
    onCommit: () => onDirty?.(),
    messages: {
      lifted: (_l, pos) => t('IMAGES.LIFTED', { pos }),
      moved: (_l, pos, total) => t('IMAGES.MOVED', { pos, total }),
      dropped: (_l, pos, total) => t('IMAGES.DROPPED', { pos, total }),
      cancelled: () => t('IMAGES.CANCELLED'),
    },
  });

  return (
    <div className="image-manager">
      <div
        className={`drop-zone${fileDragActive ? ' is-armed' : ''}${overZone ? ' is-over' : ''}`}
        onDragEnter={(e) => hasFiles(e) && setOverZone(true)}
        onDragOver={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setOverZone(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverZone(false);
        }}
        onDrop={handleDrop}
      >
        <IconUpload size={28} className="drop-zone__icon" />
        <p className="drop-zone__title">
          {fileDragActive ? (
            t('IMAGES.DROP_ACTIVE')
          ) : (
            <Trans
              i18nKey="IMAGES.DROP"
              components={{
                1: (
                  <button
                    type="button"
                    className="drop-zone__browse"
                    onClick={() => fileInputRef.current?.click()}
                  />
                ),
              }}
            />
          )}
        </p>
        <p className="drop-zone__hint">{t('IMAGES.HINT')}</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileInput}
          className="visually-hidden"
          tabIndex={-1}
        />
      </div>

      {errors.length > 0 && (
        <div className="image-errors" role="alert">
          <IconAlert size={18} />
          <ul>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
          <button
            type="button"
            className="image-errors__close"
            aria-label={t('TOAST.DISMISS')}
            onClick={() => setErrors([])}
          >
            <IconClose size={16} />
          </button>
        </div>
      )}

      {items.length > 0 && (
        <>
          <p className="image-manager__hint">{t('IMAGES.REORDER_HINT')}</p>
          <ul
            className="image-grid"
            ref={sortable.containerRef as React.RefObject<HTMLUListElement>}
          >
            {items.map((item, index) => {
              const isCover = item.key === coverKey;
              const label = t('IMAGES.LABEL', { n: index + 1, caption: item.caption });
              const handleProps = sortable.getHandleProps(index);
              return (
                <li
                  key={item.key}
                  className={`image-tile${isCover ? ' is-cover' : ''}`}
                  {...sortable.getItemProps(item.key)}
                >
                  <button
                    type="button"
                    className="image-tile__handle"
                    aria-label={`${t('IMAGES.DRAG', { n: index + 1 })}. ${label}`}
                    {...handleProps}
                  >
                    {item.lowUrl ? (
                      <ProgressiveImage src={item.previewUrl} low={item.lowUrl} alt="" />
                    ) : (
                      <img src={item.previewUrl} alt="" draggable={false} />
                    )}
                  </button>

                  <span
                    className="image-tile__grip"
                    aria-hidden="true"
                    onPointerDown={handleProps.onPointerDown}
                  >
                    <IconGrip size={18} />
                  </span>

                  <span className="image-tile__index tabular" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {isCover && (
                    <span className="image-tile__cover">
                      <IconSparkle size={14} /> {t('IMAGES.COVER')}
                    </span>
                  )}
                  {item.type === 'new' && (
                    <span className="image-tile__new">{t('IMAGES.NEW')}</span>
                  )}

                  <div className="image-tile__actions">
                    {!isCover && (
                      <button
                        type="button"
                        className="tile-btn"
                        title={t('IMAGES.SET_COVER')}
                        aria-label={`${t('IMAGES.SET_COVER')}: ${label}`}
                        onClick={() => handleSetCover(item.key)}
                      >
                        <IconSparkle size={16} />
                      </button>
                    )}
                    {item.type === 'existing' && onCopyImageLink && item.id && (
                      <button
                        type="button"
                        className="tile-btn"
                        title={t('IMAGES.COPY_LINK')}
                        aria-label={`${t('IMAGES.COPY_LINK')}: ${label}`}
                        onClick={() => onCopyImageLink(item.id!)}
                      >
                        <IconLink size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="tile-btn tile-btn--danger"
                      title={t('IMAGES.REMOVE')}
                      aria-label={`${t('IMAGES.REMOVE')}: ${label}`}
                      onClick={() => handleRemove(item.key)}
                    >
                      <IconClose size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="visually-hidden" aria-live="assertive" aria-atomic="true">
        {sortable.announcement}
      </div>
    </div>
  );
}

export default ImageManager;
