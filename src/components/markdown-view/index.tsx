import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import '@uiw/react-markdown-preview/markdown.css';

interface Props {
  source: string;
  className?: string;
  onImageClick?: (img: HTMLImageElement) => void;
}

function MarkdownView({ source, className = '', onImageClick }: Props) {
  const { t } = useTranslation();
  const handler = useRef(onImageClick);
  handler.current = onImageClick;
  const zoomable = !!onImageClick;
  const openLabel = t('LIGHTBOX.OPEN');

  const components = useMemo(
    () => ({
      img: ({ node, ...props }: any) => {
        const img = <img {...props} loading="lazy" decoding="async" alt={props.alt || ''} />;
        if (!zoomable) return img;
        return (
          <button
            type="button"
            className="zoomable"
            aria-label={props.alt ? `${openLabel}: ${props.alt}` : openLabel}
            onClick={(e) => {
              const el = e.currentTarget.querySelector('img');
              if (el) handler.current?.(el);
            }}
          >
            {img}
          </button>
        );
      },
    }),
    [zoomable, openLabel]
  );

  return (
    <div className={`prose ${className}`} data-color-mode="light">
      <MDEditor.Markdown
        source={source}
        rehypePlugins={[[rehypeSanitize]]}
        components={components}
      />
    </div>
  );
}

export default MarkdownView;
