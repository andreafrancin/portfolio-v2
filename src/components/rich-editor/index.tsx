import { getSchema } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import ColorPanel from './color-panel';
import { createContentExtensions, TEXT_COLOR_MARK } from './extensions';
import ImagePanel from './image-panel';
import ImagePicker from './image-picker';
import type { EditorImage, PickedImage } from './image-picker';
import LinkPanel from './link-panel';
import { createMarkdownParser, serializeMarkdown } from './markdown';
import { SlashCommandExtension } from './slash-extension';
import SlashMenu from './slash-menu';
import Toolbar from './toolbar';
import { EditorUiStore } from './ui-store';
import './index.scss';

export type { EditorImage } from './image-picker';

const markdownParser = createMarkdownParser(getSchema(createContentExtensions()));

interface RichEditorProps {
  label: string;
  value: string;
  onChange: (markdown: string) => void;
  images?: EditorImage[];
  onUploadImages?: (files: File[]) => Promise<EditorImage[]>;
}

function imageParagraphs(images: PickedImage[]): object[] {
  return images.map((image) => ({
    type: 'paragraph',
    content: [{ type: 'image', attrs: { src: image.src, alt: image.alt || null } }],
  }));
}

function insertImages(editor: Editor, images: PickedImage[]): void {
  if (editor.isActive('image') && images.length === 1) {
    editor.chain().focus().updateAttributes('image', { src: images[0].src }).run();
    return;
  }

  editor.chain().focus().insertContent(imageParagraphs(images)).run();
}

function RichEditor({ label, value, onChange, images = [], onUploadImages }: RichEditorProps) {
  const { t } = useTranslation();
  const [uiStore] = useState(() => new EditorUiStore());
  const uiState = useSyncExternalStore(uiStore.subscribe, uiStore.getState);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onUploadRef = useRef(onUploadImages);
  onUploadRef.current = onUploadImages;

  // Text that was not written here keeps its exact original form until its content really changes.
  const initial = useMemo(() => {
    const document = markdownParser.parse(value);

    return { markdown: value, document, normalized: serializeMarkdown(document) };
  }, []);

  const editor = useEditor({
    extensions: [
      ...createContentExtensions(),
      Placeholder.configure({
        placeholder: ({ editor: current }) => (current.isEmpty ? t('EDITOR.PLACEHOLDER') : ''),
      }),
      SlashCommandExtension.configure({ uiStore, translate: (key: string) => t(key) }),
    ],
    content: initial.document.toJSON(),
    editorProps: {
      attributes: {
        class: 'prose rich-editor__content',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
      },
      handleDrop: (_view, event) => uploadDroppedFiles(event.dataTransfer?.files),
      handlePaste: (_view, event) => uploadDroppedFiles(event.clipboardData?.files),
    },
    onUpdate: ({ editor: updated }) => {
      const markdown = serializeMarkdown(updated.state.doc);

      onChangeRef.current(markdown === initial.normalized ? initial.markdown : markdown);
    },
  });

  function uploadDroppedFiles(files: FileList | null | undefined): boolean {
    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith('image/'));
    const upload = onUploadRef.current;

    if (imageFiles.length === 0 || !upload) {
      return false;
    }

    void upload(imageFiles).then((uploaded) => {
      if (uploaded.length > 0) {
        insertImages(
          editor,
          uploaded.map((image) => ({ src: image.url, alt: '' }))
        );
      }
    });

    return true;
  }

  const selectedImage = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current.isActive('image')
        ? { alt: (current.getAttributes('image').alt as string) ?? '' }
        : null,
  });

  const currentColor = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      (current.getAttributes(TEXT_COLOR_MARK).color as string | undefined) ?? null,
  });

  return (
    <div className="rich-editor">
      <div className="rich-editor__chrome">
        <Toolbar editor={editor} onOpenPanel={uiStore.openPanel} />
        {uiState.panel === 'link' && <LinkPanel editor={editor} onClose={uiStore.closePanel} />}
        {uiState.panel === 'color' && (
          <ColorPanel editor={editor} currentColor={currentColor} onClose={uiStore.closePanel} />
        )}
        {selectedImage && uiState.panel !== 'link' && uiState.panel !== 'color' && (
          <ImagePanel
            editor={editor}
            alt={selectedImage.alt}
            onReplace={() => uiStore.openPanel('image-picker')}
          />
        )}
      </div>
      <EditorContent editor={editor} className="rich-editor__scroll" />
      <p className="rich-editor__tip">{t('EDITOR.TIP')}</p>
      {uiState.slashMenu && (
        <SlashMenu menu={uiState.slashMenu} onSelect={(index) => uiStore.runSlashItem(index)} />
      )}
      {uiState.panel === 'image-picker' && (
        <ImagePicker
          images={images}
          allowsMultiple={!selectedImage}
          onUpload={onUploadImages}
          onPick={(picked) => {
            insertImages(editor, picked);
            uiStore.closePanel();
          }}
          onClose={() => {
            uiStore.closePanel();
            editor.commands.focus();
          }}
        />
      )}
    </div>
  );
}

export default RichEditor;
