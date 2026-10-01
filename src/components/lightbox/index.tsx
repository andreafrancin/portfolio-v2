import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconArrowRight, IconClose } from '../icons';
import useHtmlScrollLock from '../../hooks/useHtmlScrollLock';
import './index.scss';

export interface LightboxImage {
  src: string;
  alt: string;
}

interface Props {
  images: LightboxImage[];
  index: number;
  originRect?: DOMRect | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Lightbox({ images, index, originRect, onIndexChange, onClose }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const zoomed = useRef(false);
  const [closing, setClosing] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const total = images.length;
  const current = images[index];

  useHtmlScrollLock(true);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const zoomIn = () => {
    const img = imgRef.current;
    if (zoomed.current || !img) return;
    zoomed.current = true;
    if (!originRect || reducedMotion()) return;
    const to = img.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const dx = originRect.left + originRect.width / 2 - (to.left + to.width / 2);
    const dy = originRect.top + originRect.height / 2 - (to.top + to.height / 2);
    const scale = Math.min(originRect.width / to.width, originRect.height / to.height);
    img.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, borderRadius: '20px' },
        { transform: 'none', borderRadius: '8px' },
      ],
      { duration: 560, easing: EASE }
    );
  };

  const close = useCallback(() => {
    if (closing) return;
    if (reducedMotion()) {
      onClose();
      return;
    }
    setClosing(true);
    window.setTimeout(onClose, 260);
  }, [closing, onClose]);

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      onIndexChange((index + delta + total) % total);
    },
    [index, total, onIndexChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (!current) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`lightbox${closing ? ' is-closing' : ''}`}
      aria-label={current.alt || t('LIGHTBOX.OPEN')}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (
          e.target === e.currentTarget ||
          (e.target as HTMLElement).classList.contains('lightbox__stage')
        )
          close();
      }}
    >
      <div
        className="lightbox__stage"
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = swipe.current;
          swipe.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
          else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
        }}
      >
        <img
          key={current.src}
          ref={imgRef}
          className="lightbox__img"
          src={current.src}
          alt={current.alt}
          draggable={false}
          onLoad={zoomIn}
        />
      </div>

      <button
        type="button"
        className="lightbox__btn lightbox__close"
        onClick={close}
        aria-label={t('LIGHTBOX.CLOSE')}
      >
        <IconClose size={22} />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            className="lightbox__btn lightbox__nav lightbox__nav--prev"
            onClick={() => go(-1)}
            aria-label={t('LIGHTBOX.PREV')}
          >
            <IconArrowLeft size={22} />
          </button>
          <button
            type="button"
            className="lightbox__btn lightbox__nav lightbox__nav--next"
            onClick={() => go(1)}
            aria-label={t('LIGHTBOX.NEXT')}
          >
            <IconArrowRight size={22} />
          </button>
          <p className="lightbox__count tabular" aria-live="polite">
            {t('LIGHTBOX.COUNT', { n: index + 1, total })}
          </p>
        </>
      )}
    </dialog>
  );
}

export default Lightbox;
