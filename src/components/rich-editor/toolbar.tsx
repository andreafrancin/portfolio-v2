import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconBold,
  IconDivider,
  IconImage,
  IconItalic,
  IconLink,
  IconList,
  IconListOrdered,
  IconQuote,
  IconRedo,
  IconStrike,
  IconUndo,
} from '../icons';
import { TEXT_COLOR_MARK } from './extensions';
import type { EditorPanel } from './ui-store';

type BlockStyle = 'text' | 'heading-1' | 'heading-2' | 'heading-3' | 'heading-4';

const BLOCK_STYLE_LABELS: Record<BlockStyle, string> = {
  text: 'EDITOR.BLOCK_TEXT',
  'heading-1': 'EDITOR.BLOCK_HEADING_1',
  'heading-2': 'EDITOR.BLOCK_HEADING_2',
  'heading-3': 'EDITOR.BLOCK_HEADING_3',
  'heading-4': 'EDITOR.BLOCK_HEADING_4',
};

const SELECTABLE_BLOCK_STYLES: BlockStyle[] = [
  'text',
  'heading-1',
  'heading-2',
  'heading-3',
  'heading-4',
];

interface ToolbarButton {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

interface ToolbarProps {
  editor: Editor;
  onOpenPanel: (panel: EditorPanel) => void;
}

function readBlockStyle(editor: Editor): BlockStyle {
  const level = [1, 2, 3, 4].find((candidate) => editor.isActive('heading', { level: candidate }));

  return level ? (`heading-${level}` as BlockStyle) : 'text';
}

function Toolbar({ editor, onOpenPanel }: ToolbarProps) {
  const { t } = useTranslation();
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
      blockStyle: readBlockStyle(current),
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      strike: current.isActive('strike'),
      link: current.isActive('link'),
      color: (current.getAttributes(TEXT_COLOR_MARK).color as string | undefined) ?? null,
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      blockquote: current.isActive('blockquote'),
    }),
  });

  const applyBlockStyle = (style: BlockStyle): void => {
    if (style === 'text') {
      editor.chain().focus().setParagraph().run();
      return;
    }

    const level = Number(style.slice(-1)) as 1 | 2 | 3 | 4;

    editor.chain().focus().setHeading({ level }).run();
  };

  const groups: ToolbarButton[][] = [
    [
      {
        icon: <IconBold size={18} />,
        label: t('EDITOR.BOLD'),
        isActive: state.bold,
        onClick: () => editor.chain().focus().toggleBold().run(),
      },
      {
        icon: <IconItalic size={18} />,
        label: t('EDITOR.ITALIC'),
        isActive: state.italic,
        onClick: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        icon: <IconStrike size={18} />,
        label: t('EDITOR.STRIKE'),
        isActive: state.strike,
        onClick: () => editor.chain().focus().toggleStrike().run(),
      },
      {
        icon: (
          <span
            className="rich-editor__color-icon"
            style={{ borderBottomColor: state.color ?? 'var(--accent)' }}
          >
            A
          </span>
        ),
        label: t('EDITOR.COLOR'),
        isActive: !!state.color,
        onClick: () => onOpenPanel('color'),
      },
      {
        icon: <IconLink size={18} />,
        label: t('EDITOR.LINK'),
        isActive: state.link,
        onClick: () => onOpenPanel('link'),
      },
    ],
    [
      {
        icon: <IconList size={18} />,
        label: t('EDITOR.BLOCK_BULLET_LIST'),
        isActive: state.bulletList,
        onClick: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        icon: <IconListOrdered size={18} />,
        label: t('EDITOR.BLOCK_ORDERED_LIST'),
        isActive: state.orderedList,
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        icon: <IconQuote size={18} />,
        label: t('EDITOR.BLOCK_QUOTE'),
        isActive: state.blockquote,
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
      },
      {
        icon: <IconDivider size={18} />,
        label: t('EDITOR.BLOCK_DIVIDER'),
        onClick: () => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
    [
      {
        icon: <IconUndo size={18} />,
        label: t('EDITOR.UNDO'),
        isDisabled: !state.canUndo,
        onClick: () => editor.chain().focus().undo().run(),
      },
      {
        icon: <IconRedo size={18} />,
        label: t('EDITOR.REDO'),
        isDisabled: !state.canRedo,
        onClick: () => editor.chain().focus().redo().run(),
      },
    ],
  ];

  return (
    <div className="rich-editor__toolbar" role="toolbar" aria-label={t('EDITOR.TOOLBAR_LABEL')}>
      <label className="rich-editor__style">
        <span className="visually-hidden">{t('EDITOR.STYLE_LABEL')}</span>
        <select
          className="rich-editor__style-select"
          value={state.blockStyle}
          onChange={(event) => applyBlockStyle(event.target.value as BlockStyle)}
        >
          {SELECTABLE_BLOCK_STYLES.map((style) => (
            <option key={style} value={style}>
              {t(BLOCK_STYLE_LABELS[style])}
            </option>
          ))}
        </select>
      </label>
      {groups.map((buttons, groupIndex) => (
        <div key={groupIndex} className="rich-editor__group">
          {buttons.map((button) => (
            <button
              key={button.label}
              type="button"
              className="rich-editor__tool"
              title={button.label}
              aria-label={button.label}
              aria-pressed={button.isActive ?? false}
              disabled={button.isDisabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={button.onClick}
            >
              {button.icon}
            </button>
          ))}
        </div>
      ))}
      <button
        type="button"
        className="rich-editor__tool rich-editor__tool--labelled"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onOpenPanel('image-picker')}
      >
        <IconImage size={18} /> {t('EDITOR.BLOCK_IMAGE')}
      </button>
    </div>
  );
}

export default Toolbar;
