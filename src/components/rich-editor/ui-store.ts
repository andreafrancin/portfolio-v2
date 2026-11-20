import type { Editor, Range } from '@tiptap/core';
import type { SlashCommandItem } from './slash-items';

export type EditorPanel = 'link' | 'color' | 'image-picker';

export interface SlashMenuState {
  items: SlashCommandItem[];
  selectedIndex: number;
  anchor: () => DOMRect | null;
}

export interface EditorUiState {
  slashMenu: SlashMenuState | null;
  panel: EditorPanel | null;
}

export interface SlashMenuUpdate {
  editor: Editor;
  range: Range;
  items: SlashCommandItem[];
  anchor: () => DOMRect | null;
}

const CLOSED_STATE: EditorUiState = { slashMenu: null, panel: null };

export class EditorUiStore {
  private state: EditorUiState = CLOSED_STATE;
  private slashTarget: { editor: Editor; range: Range } | null = null;
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): EditorUiState => this.state;

  updateSlashMenu(update: SlashMenuUpdate): void {
    const previousIndex = this.state.slashMenu?.selectedIndex ?? 0;

    this.slashTarget = { editor: update.editor, range: update.range };
    this.setState({
      ...this.state,
      slashMenu: {
        items: update.items,
        selectedIndex: Math.min(previousIndex, Math.max(update.items.length - 1, 0)),
        anchor: update.anchor,
      },
    });
  }

  closeSlashMenu(): void {
    this.slashTarget = null;

    if (this.state.slashMenu) {
      this.setState({ ...this.state, slashMenu: null });
    }
  }

  handleSlashMenuKey(key: string): boolean {
    const { slashMenu } = this.state;

    if (!slashMenu) {
      return false;
    }

    if (key === 'Escape') {
      this.closeSlashMenu();
      return true;
    }

    if (slashMenu.items.length === 0) {
      return false;
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      const step = key === 'ArrowDown' ? 1 : -1;
      const selectedIndex =
        (slashMenu.selectedIndex + step + slashMenu.items.length) % slashMenu.items.length;

      this.setState({ ...this.state, slashMenu: { ...slashMenu, selectedIndex } });
      return true;
    }

    if (key === 'Enter') {
      this.runSlashItem(slashMenu.selectedIndex);
      return true;
    }

    return false;
  }

  runSlashItem(itemIndex: number): void {
    const item = this.state.slashMenu?.items[itemIndex];
    const target = this.slashTarget;

    if (!item || !target) {
      return;
    }

    this.closeSlashMenu();
    item.run({ editor: target.editor, range: target.range, openPanel: this.openPanel });
  }

  openPanel = (panel: EditorPanel): void => {
    this.setState({ ...this.state, panel });
  };

  closePanel = (): void => {
    if (this.state.panel) {
      this.setState({ ...this.state, panel: null });
    }
  };

  private setState(state: EditorUiState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
}
