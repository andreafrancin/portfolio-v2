import { Mark } from '@tiptap/core';
import type { Extensions } from '@tiptap/core';
import { Image } from '@tiptap/extension-image';
import { BulletList, OrderedList } from '@tiptap/extension-list';
import { StarterKit } from '@tiptap/starter-kit';

export const HEADING_LEVELS = [1, 2, 3, 4] as const;

const SAFE_LINK_PATTERN = /^(https?:|mailto:|tel:|\/|#)/i;

export function isSafeLink(href: string): boolean {
  return SAFE_LINK_PATTERN.test(href.trim());
}

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function isTextColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value);
}

export const TEXT_COLOR_MARK = 'textColor';

// Markdown has no colours, so coloured text is stored as <span data-color="#rrggbb">.
const TextColor = Mark.create({
  name: TEXT_COLOR_MARK,

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const color = element.getAttribute('data-color');

          return isTextColor(color) ? color.toLowerCase() : null;
        },
        renderHTML: (attributes: { color?: string | null }) =>
          isTextColor(attributes.color)
            ? { 'data-color': attributes.color, style: `color: ${attributes.color}` }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-color]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

// Markdown tells apart lists whose items are separated by blank lines; keeping that keeps their spacing.
const tightAttribute = {
  tight: {
    default: true,
    parseHTML: (element: HTMLElement) => element.getAttribute('data-tight') !== 'false',
    renderHTML: (attributes: { tight?: boolean }) => ({ 'data-tight': String(attributes.tight) }),
  },
};

const TightBulletList = BulletList.extend({
  addAttributes() {
    return { ...this.parent?.(), ...tightAttribute };
  },
});

const TightOrderedList = OrderedList.extend({
  addAttributes() {
    return { ...this.parent?.(), ...tightAttribute };
  },
});

// Everything here has a Markdown equivalent, so what is written is what gets stored.
export function createContentExtensions(): Extensions {
  return [
    TextColor,
    StarterKit.configure({
      underline: false,
      bulletList: false,
      orderedList: false,
      heading: { levels: [...HEADING_LEVELS] },
      link: {
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { rel: null, target: null },
        isAllowedUri: (url) => isSafeLink(url),
      },
    }),
    TightBulletList,
    TightOrderedList,
    Image.configure({ inline: true }),
  ];
}
