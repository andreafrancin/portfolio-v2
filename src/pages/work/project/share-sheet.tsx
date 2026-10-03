import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CardFormat, CardInput, renderShareCard } from '../../../lib/share-card';
import { useToast } from '../../../components/toast';
import { IconClose, IconCopy, IconLink } from '../../../components/icons';
import Spinner from '../../../components/spinner';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
  fileName: string;
  card: CardInput;
}

type Ready = Partial<Record<CardFormat, { file: File; preview: string }>>;

const FORMATS: CardFormat[] = ['story', 'post'];

function ShareSheet({ open, onClose, title, url, fileName, card }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState<Ready>({});
  const [failed, setFailed] = useState(false);
  const cardKey = JSON.stringify(card);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const urls: string[] = [];
    setReady({});
    setFailed(false);
    FORMATS.forEach((format) => {
      renderShareCard(format, card)
        .then((blob) => {
          if (!alive) return;
          const file = new File([blob], `${fileName}-${format}.jpg`, { type: 'image/jpeg' });
          const preview = URL.createObjectURL(blob);
          urls.push(preview);
          setReady((r) => ({ ...r, [format]: { file, preview } }));
        })
        .catch(() => alive && setFailed(true));
    });
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [open, cardKey, fileName]);

  const shareImage = async (format: CardFormat) => {
    const item = ready[format];
    if (!item) return;
    const data: ShareData = { files: [item.file], title, text: `${title} — ${url}` };
    if (navigator.canShare?.(data)) {
      try {
        await navigator.share(data);
        onClose();
      } catch {}
      return;
    }
    const a = document.createElement('a');
    a.href = item.preview;
    a.download = item.file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(t('PROJECT.SHARE_DOWNLOADED'));
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        onClose();
      } catch {}
      return;
    }
    copyLink();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('PROJECT.LINK_COPIED'));
      onClose();
    } catch {
      toast.error(t('PROJECT.SHARE_FAILED'));
    }
  };

  return (
    <dialog
      ref={ref}
      className="share-sheet"
      aria-labelledby="share-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="share-sheet__panel">
        <div className="share-sheet__head">
          <h2 id="share-title">{t('PROJECT.SHARE_TITLE')}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={t('PRIVATE.CANCEL')}
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="share-sheet__cards">
          {FORMATS.map((format) => {
            const item = ready[format];
            return (
              <button
                key={format}
                type="button"
                className={`share-card share-card--${format}`}
                onClick={() => shareImage(format)}
                disabled={!item}
              >
                <span className="share-card__frame">
                  {item ? <img src={item.preview} alt="" /> : failed ? null : <Spinner size={20} />}
                </span>
                <span className="share-card__name">
                  {t(format === 'story' ? 'PROJECT.SHARE_STORY' : 'PROJECT.SHARE_POST')}
                </span>
                <span className="share-card__hint">
                  {t(format === 'story' ? 'PROJECT.SHARE_STORY_HINT' : 'PROJECT.SHARE_POST_HINT')}
                </span>
              </button>
            );
          })}
        </div>

        <div className="share-sheet__links">
          <button type="button" className="share-row" onClick={shareLink}>
            <IconLink size={18} />
            <span>
              <strong>{t('PROJECT.SHARE_LINK')}</strong>
              <small>{t('PROJECT.SHARE_LINK_HINT')}</small>
            </span>
          </button>
          <button type="button" className="share-row" onClick={copyLink}>
            <IconCopy size={18} />
            <span>
              <strong>{t('PROJECT.SHARE_COPY')}</strong>
              <small>{url.replace(/^https?:\/\//, '')}</small>
            </span>
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ShareSheet;
