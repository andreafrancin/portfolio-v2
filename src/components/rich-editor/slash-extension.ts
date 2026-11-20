import { Extension } from '@tiptap/core';
import { Suggestion } from '@tiptap/suggestion';
import type { SuggestionProps } from '@tiptap/suggestion';
import { filterSlashCommandItems } from './slash-items';
import type { SlashCommandItem } from './slash-items';
import type { EditorUiStore } from './ui-store';

export interface SlashCommandOptions {
  uiStore: EditorUiStore | null;
  translate: (key: string) => string;
}

export const SlashCommandExtension = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return { uiStore: null, translate: (key: string) => key };
  },

  addProseMirrorPlugins() {
    const { uiStore, translate } = this.options;

    if (!uiStore) {
      return [];
    }

    const showMenu = (props: SuggestionProps<SlashCommandItem>): void => {
      uiStore.updateSlashMenu({
        editor: props.editor,
        range: props.range,
        items: props.items,
        // Read again on every render so the menu follows the text when the editor scrolls.
        anchor: () => props.clientRect?.() ?? null,
      });
    };

    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: '/',
        decorationClass: 'rich-editor__slash',
        items: ({ query }) => filterSlashCommandItems(query, translate),
        render: () => ({
          onStart: showMenu,
          onUpdate: showMenu,
          onKeyDown: ({ event }) => uiStore.handleSlashMenuKey(event.key),
          onExit: () => uiStore.closeSlashMenu(),
        }),
      }),
    ];
  },
});
