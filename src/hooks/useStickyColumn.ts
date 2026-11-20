import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const TOP_GAP = 24;
const BOTTOM_RESERVE = 104;

// A sticky column taller than the window would hide its end. This measures how much it overflows so
// the stylesheet can let it scroll that far before it sticks.
export default function useStickyColumn<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const column = ref.current;

    if (!column) return;

    const update = () => {
      const bar = column.closest('form')?.querySelector<HTMLElement>('.language-bar');
      const top = (bar ? bar.offsetHeight + TOP_GAP : 0) + TOP_GAP;
      const available = window.innerHeight - top - BOTTOM_RESERVE;
      const overflow = Math.max(0, column.offsetHeight - available);

      column.style.setProperty('--sticky-shift', `${overflow}px`);
    };

    const observer = new ResizeObserver(update);

    observer.observe(column);
    window.addEventListener('resize', update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return ref;
}
