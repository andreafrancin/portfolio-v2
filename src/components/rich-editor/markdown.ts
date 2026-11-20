import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import { MarkdownParser, MarkdownSerializer } from 'prosemirror-markdown';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model';
import { TEXT_COLOR_MARK } from './extensions';

const MAX_HEADING_LEVEL = 4;

interface ParseState {
  addText: (text: string) => void;
  openMark: (mark: unknown) => void;
  closeMark: (markType: unknown) => void;
  openNode: (nodeType: unknown, attrs: null) => void;
  closeNode: () => void;
  openColors?: number;
}

type TokenHandler = (state: ParseState, token: Token, tokens: Token[], index: number) => void;

const COLOR_OPEN_PATTERN = /^<span data-color="(#[0-9a-fA-F]{6})">$/;
const COLOR_CLOSE_TAG = '</span>';

const tokenizer = MarkdownIt('commonmark', { html: true }).enable('strikethrough');

function isTightList(tokens: Token[], listIndex: number): boolean {
  for (let index = listIndex + 1; index < tokens.length; index += 1) {
    if (tokens[index].type !== 'list_item_open') {
      return tokens[index].hidden;
    }
  }

  return false;
}

export function createMarkdownParser(schema: Schema): MarkdownParser {
  const parser = new MarkdownParser(schema, tokenizer, {
    blockquote: { block: 'blockquote' },
    paragraph: { block: 'paragraph' },
    list_item: { block: 'listItem' },
    bullet_list: {
      block: 'bulletList',
      getAttrs: (_token, tokens, index) => ({ tight: isTightList(tokens, index) }),
    },
    ordered_list: {
      block: 'orderedList',
      getAttrs: (token, tokens, index) => ({
        start: Number(token.attrGet('start')) || 1,
        tight: isTightList(tokens, index),
      }),
    },
    heading: {
      block: 'heading',
      getAttrs: (token) => ({ level: Math.min(Number(token.tag.slice(1)), MAX_HEADING_LEVEL) }),
    },
    code_block: { block: 'codeBlock', noCloseToken: true },
    fence: {
      block: 'codeBlock',
      getAttrs: (token) => ({ language: token.info.trim() || null }),
      noCloseToken: true,
    },
    hr: { node: 'horizontalRule' },
    image: {
      node: 'image',
      getAttrs: (token) => ({
        src: token.attrGet('src'),
        title: token.attrGet('title') || null,
        alt: token.children?.map((child) => child.content).join('') || null,
      }),
    },
    hardbreak: { node: 'hardBreak' },
    em: { mark: 'italic' },
    strong: { mark: 'bold' },
    s: { mark: 'strike' },
    link: {
      mark: 'link',
      getAttrs: (token) => ({
        href: token.attrGet('href'),
        title: token.attrGet('title') || null,
      }),
    },
    code_inline: { mark: 'code', noCloseToken: true },
  });

  // A line break written next to an image only separates it from the text of its paragraph.
  const handlers = (parser as unknown as { tokenHandlers: Record<string, TokenHandler> })
    .tokenHandlers;

  handlers.softbreak = (state, _token, tokens, index) => {
    const isNextToImage =
      tokens[index - 1]?.type === 'image' || tokens[index + 1]?.type === 'image';

    if (!isNextToImage) {
      state.addText(' ');
    }
  };

  // The only HTML understood is the colour span; anything else stays as the text that was typed.
  const colorMark = schema.marks[TEXT_COLOR_MARK];

  handlers.html_inline = (state, token) => {
    const opening = COLOR_OPEN_PATTERN.exec(token.content);

    if (opening) {
      state.openMark(colorMark.create({ color: opening[1].toLowerCase() }));
      state.openColors = (state.openColors ?? 0) + 1;
    } else if (token.content === COLOR_CLOSE_TAG && state.openColors) {
      state.closeMark(colorMark);
      state.openColors -= 1;
    } else {
      state.addText(token.content);
    }
  };

  handlers.html_block = (state, token) => {
    state.openNode(schema.nodes.paragraph, null);
    state.addText(token.content.trim());
    state.closeNode();
  };

  return parser;
}

function longestBacktickRun(text: string): number {
  return Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
}

function formatLinkDestination(href: string): string {
  return /[\s()<>]/.test(href) ? `<${href.replace(/[<>]/g, '')}>` : href;
}

function formatTitle(title: string | null): string {
  return title ? ` "${title.replace(/"/g, '\\"')}"` : '';
}

function startOwnLine(state: MarkdownSerializerState): void {
  const output = state as unknown as { out: string };

  output.out = output.out.replace(/[ \t]+$/, '');
  state.ensureNewLine();
}

const markdownSerializer = new MarkdownSerializer(
  {
    blockquote(state, node) {
      state.wrapBlock('> ', null, node, () => state.renderContent(node));
    },
    codeBlock(state, node) {
      const fence = '`'.repeat(Math.max(3, longestBacktickRun(node.textContent) + 1));

      state.write(`${fence}${node.attrs.language ?? ''}\n`);
      state.text(node.textContent, false);
      state.ensureNewLine();
      state.write(fence);
      state.closeBlock(node);
    },
    heading(state, node) {
      state.write(`${'#'.repeat(node.attrs.level)} `);
      state.renderInline(node, false);
      state.closeBlock(node);
    },
    horizontalRule(state, node) {
      state.write('---');
      state.closeBlock(node);
    },
    bulletList(state, node) {
      state.renderList(node, '  ', () => '- ');
    },
    orderedList(state, node) {
      const start: number = node.attrs.start ?? 1;
      const widestNumber = String(start + node.childCount - 1).length;
      const indentation = ' '.repeat(widestNumber + 2);

      state.renderList(node, indentation, (index) => {
        const number = String(start + index);

        return `${' '.repeat(widestNumber - number.length)}${number}. `;
      });
    },
    listItem(state, node) {
      state.renderContent(node);
    },
    paragraph(state, node) {
      state.renderInline(node);
      state.closeBlock(node);
    },
    image(state, node, parent, index) {
      if (index > 0) {
        startOwnLine(state);
      }

      const alt = state.esc(node.attrs.alt ?? '');
      const destination = formatLinkDestination(node.attrs.src ?? '');

      state.write(`![${alt}](${destination}${formatTitle(node.attrs.title)})`);

      if (index < parent.childCount - 1) {
        state.ensureNewLine();
      }
    },
    hardBreak(state, node, parent, index) {
      for (let next = index + 1; next < parent.childCount; next += 1) {
        if (parent.child(next).type !== node.type) {
          state.write('\\\n');
          return;
        }
      }
    },
    text(state, node) {
      state.text(node.text ?? '');
    },
  },
  {
    [TEXT_COLOR_MARK]: {
      open: (_state, mark) => `<span data-color="${mark.attrs.color}">`,
      close: COLOR_CLOSE_TAG,
      expelEnclosingWhitespace: true,
    },
    italic: { open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true },
    bold: { open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true },
    strike: { open: '~~', close: '~~', mixable: true, expelEnclosingWhitespace: true },
    link: {
      open: () => '[',
      close: (_state, mark) =>
        `](${formatLinkDestination(mark.attrs.href ?? '')}${formatTitle(mark.attrs.title)})`,
      mixable: true,
    },
    code: {
      open: (_state, _mark, parent, index) => backticksFor(parent.child(index), -1),
      close: (_state, _mark, parent, index) => backticksFor(parent.child(index - 1), 1),
      escape: false,
    },
  }
);

function backticksFor(node: ProseMirrorNode, side: number): string {
  const text = node.isText ? (node.text ?? '') : '';
  const ticks = '`'.repeat(longestBacktickRun(text) + 1);
  const needsPadding = side < 0 ? text.startsWith('`') : text.endsWith('`');

  if (!needsPadding) {
    return ticks;
  }

  return side < 0 ? `${ticks} ` : ` ${ticks}`;
}

export function serializeMarkdown(document: ProseMirrorNode): string {
  return markdownSerializer.serialize(document);
}
