import { useEffect, useReducer, useRef } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { SlashMenuState } from './ui-store';

const MENU_OFFSET = 8;
const MENU_WIDTH = 288;
const MENU_MAX_HEIGHT = 340;

function calculatePosition(anchor: DOMRect): CSSProperties {
  const left = Math.max(
    MENU_OFFSET,
    Math.min(anchor.left, window.innerWidth - MENU_WIDTH - MENU_OFFSET)
  );
  const spaceBelow = window.innerHeight - anchor.bottom;
  const opensUpward = spaceBelow < MENU_MAX_HEIGHT && anchor.top > spaceBelow;

  return opensUpward
    ? { left, bottom: window.innerHeight - anchor.top + MENU_OFFSET }
    : { left, top: anchor.bottom + MENU_OFFSET };
}

interface SlashMenuProps {
  menu: SlashMenuState;
  onSelect: (itemIndex: number) => void;
}

function SlashMenu({ menu, onSelect }: SlashMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [, reposition] = useReducer((count: number) => count + 1, 0);

  // Scrolling the editor or the page moves the text, so the menu is placed again.
  useEffect(() => {
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);

    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, []);

  useEffect(() => {
    menuRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [menu.selectedIndex]);

  const anchor = menu.anchor();

  if (!anchor) {
    return null;
  }

  // The page wrapper is animated, which would otherwise become the reference for fixed positioning.
  return createPortal(
    <div
      ref={menuRef}
      className="slash-menu"
      role="listbox"
      aria-label={t('EDITOR.SLASH_LABEL')}
      style={{
        ...calculatePosition(anchor),
        width: MENU_WIDTH,
        maxHeight: MENU_MAX_HEIGHT,
      }}
    >
      {menu.items.length === 0 && <p className="slash-menu__empty">{t('EDITOR.SLASH_EMPTY')}</p>}
      {menu.items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          role="option"
          aria-selected={index === menu.selectedIndex}
          className="slash-menu__item"
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(index);
          }}
        >
          <span className="slash-menu__title">{t(item.titleKey)}</span>
          <span className="slash-menu__description">{t(item.descriptionKey)}</span>
        </button>
      ))}
    </div>,
    document.body
  );
}

export default SlashMenu;
