import type { Editor } from '@tiptap/core';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { IconTrash } from '../icons';

interface ImagePanelProps {
  editor: Editor;
  alt: string;
  onReplace: () => void;
}

function ImagePanel({ editor, alt, onReplace }: ImagePanelProps) {
  const { t } = useTranslation();
  const inputId = useId();

  return (
    <div className="rich-editor__panel rich-editor__panel--image">
      <div className="field">
        <label className="field__label" htmlFor={inputId}>
          {t('EDITOR.IMAGE_ALT')}
        </label>
        <input
          id={inputId}
          className="input"
          value={alt}
          placeholder={t('EDITOR.IMAGE_ALT_PLACEHOLDER')}
          onChange={(event) =>
            editor.commands.updateAttributes('image', { alt: event.target.value })
          }
        />
        <p className="field__hint">{t('EDITOR.IMAGE_ALT_HINT')}</p>
      </div>
      <div className="rich-editor__panel-actions">
        <button type="button" className="btn btn--quiet btn--sm" onClick={onReplace}>
          {t('EDITOR.IMAGE_REPLACE')}
        </button>
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          onClick={() => editor.chain().focus().deleteSelection().run()}
        >
          <IconTrash size={16} /> {t('EDITOR.IMAGE_REMOVE')}
        </button>
      </div>
    </div>
  );
}

export default ImagePanel;
