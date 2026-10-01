import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export interface SortableMessages {
  lifted: (label: string, position: number, total: number) => string;
  moved: (label: string, position: number, total: number) => string;
  dropped: (label: string, position: number, total: number) => string;
  cancelled: (label: string) => string;
}

interface Options<T> {
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  onReorder: (from: number, to: number) => void;
  onCommit?: () => void;
  disabled?: boolean;
  axis?: 'y' | 'grid';
  messages: SortableMessages;
}

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

const EDGE = 90;
const MAX_SPEED = 18;
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function useSortable<T>({
  items,
  getKey,
  getLabel,
  onReorder,
  onCommit,
  disabled,
  axis = 'y',
  messages,
}: Options<T>) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [liftedKey, setLiftedKey] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const liftOrigin = useRef<number | null>(null);
  const flipRects = useRef<Map<string, DOMRect> | null>(null);

  const drag = useRef<{
    from: number;
    target: number;
    els: HTMLElement[];
    slots: Slot[];
    startX: number;
    startY: number;
    startScrollX: number;
    startScrollY: number;
    clientX: number;
    clientY: number;
    dx: number;
    dy: number;
    raf: number | null;
    moved: boolean;
    cleanup: () => void;
  } | null>(null);

  const getEls = () =>
    Array.from(containerRef.current?.querySelectorAll<HTMLElement>('[data-sort-key]') || []);

  const measureByKey = () => {
    const map = new Map<string, DOMRect>();
    getEls().forEach((el) => map.set(el.dataset.sortKey!, el.getBoundingClientRect()));
    return map;
  };

  useLayoutEffect(() => {
    const prev = flipRects.current;
    if (prev) {
      flipRects.current = null;
      if (!reducedMotion()) {
        getEls().forEach((el) => {
          const before = prev.get(el.dataset.sortKey!);
          if (!before) return;
          const after = el.getBoundingClientRect();
          const dx = before.left - after.left;
          const dy = before.top - after.top;
          if (dx || dy) {
            el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
              duration: 260,
              easing: EASE,
            });
          }
        });
      }
    }
    if (liftedKey) {
      const handle = containerRef.current?.querySelector<HTMLElement>(
        `[data-sort-key="${CSS.escape(liftedKey)}"] [data-sort-handle]`
      );
      if (handle && document.activeElement !== handle) handle.focus({ preventScroll: true });
      handle?.scrollIntoView({ block: 'nearest' });
    }
  }, [items, liftedKey]);

  const announce = (text: string) => {
    setAnnouncement('');
    requestAnimationFrame(() => setAnnouncement(text));
  };

  const computeTarget = (cx: number, cy: number, slots: Slot[]) => {
    let best = 0;
    let bestDist = Infinity;
    slots.forEach((s, i) => {
      const sx = s.x + s.w / 2;
      const sy = s.y + s.h / 2;
      const dist = axis === 'y' ? Math.abs(cy - sy) : Math.hypot(cx - sx, cy - sy);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  const layoutOthers = (from: number, target: number) => {
    const d = drag.current;
    if (!d) return;
    d.els.forEach((el, j) => {
      if (j === from) return;
      let k = j;
      if (from < target && j > from && j <= target) k = j - 1;
      else if (from > target && j >= target && j < from) k = j + 1;
      const tx = d.slots[k].x - d.slots[j].x;
      const ty = d.slots[k].y - d.slots[j].y;
      el.style.transform = tx || ty ? `translate3d(${tx}px, ${ty}px, 0)` : '';
    });
  };

  const updateDrag = () => {
    const d = drag.current;
    if (!d) return;
    const dx = d.clientX - d.startX + (window.scrollX - d.startScrollX);
    const dy = d.clientY - d.startY + (window.scrollY - d.startScrollY);
    d.dx = axis === 'y' ? 0 : dx;
    d.dy = dy;
    if (!d.moved && Math.hypot(dx, dy) > 3) d.moved = true;
    const el = d.els[d.from];
    el.style.transform = `translate3d(${d.dx}px, ${d.dy}px, 0)`;
    const s = d.slots[d.from];
    const target = computeTarget(s.x + s.w / 2 + d.dx, s.y + s.h / 2 + d.dy, d.slots);
    if (target !== d.target) {
      d.target = target;
      layoutOthers(d.from, target);
    }
  };

  const autoScroll = () => {
    const d = drag.current;
    if (!d) return;
    const y = d.clientY;
    const vh = window.innerHeight;
    let speed = 0;
    if (y < EDGE) speed = -((EDGE - y) / EDGE) * MAX_SPEED;
    else if (y > vh - EDGE) speed = ((y - (vh - EDGE)) / EDGE) * MAX_SPEED;
    if (speed) {
      window.scrollBy(0, speed);
      updateDrag();
    }
    d.raf = requestAnimationFrame(autoScroll);
  };

  const finishDrag = (cancel: boolean) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    d.cleanup();
    if (d.raf) cancelAnimationFrame(d.raf);

    const { from, els, slots } = d;
    const target = cancel ? from : d.target;
    const dragged = els[from];
    const visualX = slots[from].x + d.dx;
    const visualY = slots[from].y + d.dy;

    els.forEach((el) => {
      el.style.transition = 'none';
      el.style.transform = '';
    });

    if (target !== from) {
      flushSync(() => onReorder(from, target));
      const label = getLabel(itemsRef.current[target]);
      announce(messages.dropped(label, target + 1, itemsRef.current.length));
      onCommit?.();
    }

    const landed = target !== from ? slots[target] : slots[from];
    if (!reducedMotion()) {
      dragged.animate(
        [
          { transform: `translate(${visualX - landed.x}px, ${visualY - landed.y}px)` },
          { transform: 'none' },
        ],
        { duration: 320, easing: EASE }
      );
    }

    requestAnimationFrame(() => {
      els.forEach((el) => {
        el.style.transition = '';
      });
      setDraggingKey(null);
      containerRef.current?.classList.remove('is-sorting');
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>, index: number) => {
    if (disabled || e.button !== 0 || drag.current || liftedKey) return;
    e.preventDefault();

    const els = getEls();
    if (!els[index]) return;
    const slots = els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    });

    const onMove = (ev: PointerEvent) => {
      if (!drag.current) return;
      drag.current.clientX = ev.clientX;
      drag.current.clientY = ev.clientY;
      updateDrag();
    };
    const onUp = () => finishDrag(false);
    const onCancel = () => finishDrag(true);
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        finishDrag(true);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey);

    drag.current = {
      from: index,
      target: index,
      els,
      slots,
      startX: e.clientX,
      startY: e.clientY,
      startScrollX: window.scrollX,
      startScrollY: window.scrollY,
      clientX: e.clientX,
      clientY: e.clientY,
      dx: 0,
      dy: 0,
      raf: null,
      moved: false,
      cleanup: () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('keydown', onKey);
      },
    };

    els.forEach((el, i) => {
      if (i !== index) el.style.transition = `transform 240ms ${EASE}`;
    });
    containerRef.current?.classList.add('is-sorting');
    setDraggingKey(els[index].dataset.sortKey || null);
    drag.current.raf = requestAnimationFrame(autoScroll);
  };

  useEffect(
    () => () => {
      if (drag.current) {
        drag.current.cleanup();
        if (drag.current.raf) cancelAnimationFrame(drag.current.raf);
        drag.current = null;
      }
    },
    []
  );

  const columns = () => {
    if (axis === 'y') return 1;
    const els = getEls();
    if (els.length < 2) return 1;
    const top = els[0].getBoundingClientRect().top;
    return Math.max(
      1,
      els.filter((el) => Math.abs(el.getBoundingClientRect().top - top) < 2).length
    );
  };

  const moveKeyboard = (from: number, to: number) => {
    const list = itemsRef.current;
    if (to < 0 || to >= list.length || to === from) return;
    flipRects.current = measureByKey();
    onReorder(from, to);
    announce(messages.moved(getLabel(list[from]), to + 1, list.length));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (disabled) return;
    const list = itemsRef.current;
    const key = getKey(list[index]);
    const isLifted = liftedKey === key;

    if (!isLifted) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        liftOrigin.current = index;
        setLiftedKey(key);
        announce(messages.lifted(getLabel(list[index]), index + 1, list.length));
      }
      return;
    }

    const cols = columns();
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveKeyboard(index, index - cols);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveKeyboard(index, index + cols);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveKeyboard(index, index - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveKeyboard(index, index + 1);
        break;
      case 'Home':
        e.preventDefault();
        moveKeyboard(index, 0);
        break;
      case 'End':
        e.preventDefault();
        moveKeyboard(index, list.length - 1);
        break;
      case ' ':
      case 'Enter': {
        e.preventDefault();
        setLiftedKey(null);
        announce(messages.dropped(getLabel(list[index]), index + 1, list.length));
        if (liftOrigin.current !== index) onCommit?.();
        liftOrigin.current = null;
        break;
      }
      case 'Escape': {
        e.preventDefault();
        const origin = liftOrigin.current;
        if (origin !== null && origin !== index) {
          flipRects.current = measureByKey();
          onReorder(index, origin);
        }
        setLiftedKey(null);
        liftOrigin.current = null;
        announce(messages.cancelled(getLabel(list[index])));
        break;
      }
      default:
    }
  };

  const onBlur = (index: number) => {
    const list = itemsRef.current;
    if (liftedKey && list[index] && getKey(list[index]) === liftedKey) {
      requestAnimationFrame(() => {
        const active = document.activeElement as HTMLElement | null;
        if (
          active?.dataset?.sortHandle !== undefined &&
          active.closest(`[data-sort-key="${CSS.escape(liftedKey)}"]`)
        )
          return;
        setLiftedKey(null);
        if (liftOrigin.current !== null && liftOrigin.current !== index) onCommit?.();
        liftOrigin.current = null;
      });
    }
  };

  const getItemProps = useCallback(
    (key: string) => ({
      'data-sort-key': key,
      'data-dragging': draggingKey === key ? '' : undefined,
      'data-lifted': liftedKey === key ? '' : undefined,
    }),
    [draggingKey, liftedKey]
  );

  const getHandleProps = (index: number) => ({
    'data-sort-handle': '',
    'aria-pressed': liftedKey === (itemsRef.current[index] && getKey(itemsRef.current[index])),
    'aria-disabled': disabled || undefined,
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => onPointerDown(e, index),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => onKeyDown(e, index),
    onBlur: () => onBlur(index),
  });

  return {
    containerRef,
    getItemProps,
    getHandleProps,
    draggingKey,
    liftedKey,
    announcement,
  };
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
