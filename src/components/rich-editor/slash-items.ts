import type { Editor, Range } from '@tiptap/core';
import type { EditorPanel } from './ui-store';

export interface SlashCommandContext {
  editor: Editor;
  range: Range;
  openPanel: (panel: EditorPanel) => void;
}

export interface SlashCommandItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  keywords: string[];
  run: (context: SlashCommandContext) => void;
}

const COMBINING_DIACRITICS_PATTERN = /[̀-ͯ]/g;

function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(COMBINING_DIACRITICS_PATTERN, '').toLowerCase();
}

function headingItem(level: 1 | 2 | 3 | 4, id: string, keywords: string[]): SlashCommandItem {
  return {
    id,
    titleKey: `EDITOR.BLOCK_${id}`,
    descriptionKey: `EDITOR.BLOCK_${id}_HINT`,
    keywords,
    run: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level }).run(),
  };
}

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  {
    id: 'TEXT',
    titleKey: 'EDITOR.BLOCK_TEXT',
    descriptionKey: 'EDITOR.BLOCK_TEXT_HINT',
    keywords: ['texto', 'text', 'parrafo', 'paragraf', 'paragraph'],
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  headingItem(1, 'HEADING_1', [
    'titulo',
    'titol',
    'title',
    'heading',
    'h1',
    'grande',
    'gran',
    'big',
  ]),
  headingItem(2, 'HEADING_2', ['titulo', 'titol', 'title', 'heading', 'h2']),
  headingItem(3, 'HEADING_3', ['subtitulo', 'subtitol', 'subtitle', 'heading', 'h3']),
  headingItem(4, 'HEADING_4', [
    'subtitulo',
    'subtitol',
    'subtitle',
    'pequeño',
    'petit',
    'small',
    'h4',
  ]),
  {
    id: 'IMAGE',
    titleKey: 'EDITOR.BLOCK_IMAGE',
    descriptionKey: 'EDITOR.BLOCK_IMAGE_HINT',
    keywords: ['imagen', 'imatge', 'image', 'foto', 'photo', 'picture'],
    run: ({ editor, range, openPanel }) => {
      editor.chain().focus().deleteRange(range).run();
      openPanel('image-picker');
    },
  },
  {
    id: 'BULLET_LIST',
    titleKey: 'EDITOR.BLOCK_BULLET_LIST',
    descriptionKey: 'EDITOR.BLOCK_BULLET_LIST_HINT',
    keywords: ['lista', 'llista', 'list', 'puntos', 'punts', 'bullet'],
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    id: 'ORDERED_LIST',
    titleKey: 'EDITOR.BLOCK_ORDERED_LIST',
    descriptionKey: 'EDITOR.BLOCK_ORDERED_LIST_HINT',
    keywords: ['lista', 'llista', 'list', 'numerada', 'numeros', 'numbered', 'ordered'],
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    id: 'QUOTE',
    titleKey: 'EDITOR.BLOCK_QUOTE',
    descriptionKey: 'EDITOR.BLOCK_QUOTE_HINT',
    keywords: ['cita', 'quote', 'destacado', 'destacat'],
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    id: 'DIVIDER',
    titleKey: 'EDITOR.BLOCK_DIVIDER',
    descriptionKey: 'EDITOR.BLOCK_DIVIDER_HINT',
    keywords: ['separador', 'linea', 'linia', 'divider', 'line'],
    run: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
];

export function filterSlashCommandItems(
  query: string,
  translate: (key: string) => string
): SlashCommandItem[] {
  const normalizedQuery = normalizeForSearch(query.trim());

  if (!normalizedQuery) {
    return SLASH_COMMAND_ITEMS;
  }

  return SLASH_COMMAND_ITEMS.filter((item) =>
    [translate(item.titleKey), ...item.keywords].some((candidate) =>
      normalizeForSearch(candidate).includes(normalizedQuery)
    )
  );
}
