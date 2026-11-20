import type { Editor } from '@tiptap/core';
import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isSafeLink } from './extensions';

interface LinkPanelProps {
  editor: Editor;
  onClose: () => void;
}

function normalizeHref(value: string): string {
  const trimmed = value.trim();

  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }

  return /^[a-z][a-z0-9+.-]*:|^[/#]/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function LinkPanel({ editor, onClose }: LinkPanelProps) {
  const { t } = useTranslation();
  const addressId = useId();
  const textId = useId();
  const isEditing = editor.isActive('link');
  const [initialText] = useState<string>(() => {
    if (isEditing) {
      editor.commands.extendMarkRange('link');
    }

    const { from, to } = editor.state.selection;

    return editor.state.doc.textBetween(from, to, ' ');
  });
  const [text, setText] = useState(initialText);
  const [href, setHref] = useState<string>(() => editor.getAttributes('link').href ?? '');
  const [hasError, setHasError] = useState(false);

  const close = (): void => {
    editor.commands.focus();
    onClose();
  };

  const apply = (): void => {
    const normalized = normalizeHref(href);

    if (!href.trim() || !isSafeLink(normalized)) {
      setHasError(true);
      return;
    }

    const visibleText = text.trim() || href.trim();

    if (initialText && visibleText === initialText) {
      editor.chain().focus().setLink({ href: normalized }).run();
    } else {
      const otherMarks = editor.state.selection.$from
        .marks()
        .filter((mark) => mark.type.name !== 'link')
        .map((mark) => ({ type: mark.type.name, attrs: mark.attrs }));

      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: visibleText,
          marks: [...otherMarks, { type: 'link', attrs: { href: normalized } }],
        })
        .run();
    }

    onClose();
  };

  const remove = (): void => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      apply();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  return (
    <div className="rich-editor__panel rich-editor__panel--link">
      <div className="field">
        <label className="field__label" htmlFor={textId}>
          {t('EDITOR.LINK_TEXT')}
        </label>
        <input
          id={textId}
          className="input"
          autoFocus={!initialText}
          placeholder={t('EDITOR.LINK_TEXT_PLACEHOLDER')}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor={addressId}>
          {t('EDITOR.LINK_ADDRESS')}
        </label>
        <input
          id={addressId}
          className="input"
          inputMode="url"
          autoFocus={!!initialText}
          placeholder="https://"
          value={href}
          aria-invalid={hasError}
          onChange={(event) => {
            setHref(event.target.value);
            setHasError(false);
          }}
          onKeyDown={onKeyDown}
        />
        {hasError && <p className="field__error">{t('EDITOR.LINK_INVALID')}</p>}
      </div>
      <div className="rich-editor__panel-actions">
        <button type="button" className="btn btn--sm" onClick={apply}>
          {t(isEditing ? 'EDITOR.LINK_UPDATE' : 'EDITOR.LINK_ADD')}
        </button>
        {isEditing && (
          <button type="button" className="btn btn--quiet btn--sm" onClick={remove}>
            {t('EDITOR.LINK_REMOVE')}
          </button>
        )}
        <button type="button" className="btn btn--quiet btn--sm" onClick={close}>
          {t('PRIVATE.CANCEL')}
        </button>
      </div>
    </div>
  );
}

export default LinkPanel;
