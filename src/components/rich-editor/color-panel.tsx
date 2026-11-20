import type { Editor } from '@tiptap/core';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategories } from '../../config/categories';
import { IconCheck } from '../icons';
import { TEXT_COLOR_MARK } from './extensions';

const BRAND_COLORS = ['#bc0e4d', '#8265a8', '#2a8ea2', '#3fcfc6', '#e98e47'];

interface ColorPanelProps {
  editor: Editor;
  currentColor: string | null;
  onClose: () => void;
}

function ColorPanel({ editor, currentColor, onClose }: ColorPanelProps) {
  const { t } = useTranslation();
  const customId = useId();
  const categories = useCategories();
  const colors = Array.from(
    new Set([...BRAND_COLORS, ...categories.map((category) => category.ink.toLowerCase())])
  ).filter((color) => /^#[0-9a-f]{6}$/.test(color));

  const apply = (color: string): void => {
    editor.chain().focus().setMark(TEXT_COLOR_MARK, { color: color.toLowerCase() }).run();
  };

  const remove = (): void => {
    editor.chain().focus().unsetMark(TEXT_COLOR_MARK).run();
    onClose();
  };

  return (
    <div className="rich-editor__panel rich-editor__panel--color">
      <div className="field">
        <span className="field__label">{t('EDITOR.COLOR')}</span>
        <div className="rich-editor__swatches">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className="rich-editor__swatch"
              style={{ backgroundColor: color }}
              aria-label={color}
              aria-pressed={currentColor === color}
              title={color}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => apply(color)}
            >
              {currentColor === color && <IconCheck size={14} />}
            </button>
          ))}
          <label className="rich-editor__custom-color" htmlFor={customId}>
            <input
              id={customId}
              type="color"
              value={currentColor ?? '#bc0e4d'}
              onChange={(event) => apply(event.target.value)}
            />
            {t('EDITOR.COLOR_CUSTOM')}
          </label>
        </div>
        <p className="field__hint">{t('EDITOR.COLOR_HINT')}</p>
      </div>
      <div className="rich-editor__panel-actions">
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          disabled={!currentColor}
          onClick={remove}
        >
          {t('EDITOR.COLOR_REMOVE')}
        </button>
        <button type="button" className="btn btn--quiet btn--sm" onClick={onClose}>
          {t('EDITOR.PANEL_CLOSE')}
        </button>
      </div>
    </div>
  );
}

export default ColorPanel;
