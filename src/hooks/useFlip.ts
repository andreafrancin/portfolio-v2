import { useLayoutEffect, useRef } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function useFlip<T extends HTMLElement>(deps: unknown[]) {
  const containerRef = useRef<T | null>(null);
  const rects = useRef<Map<string, DOMRect>>(new Map());
  const first = useRef(true);

  const measure = () => {
    const map = new Map<string, DOMRect>();
    containerRef.current
      ?.querySelectorAll<HTMLElement>(':scope > [data-flip-key]')
      .forEach((el) => map.set(el.dataset.flipKey!, el.getBoundingClientRect()));
    return map;
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (first.current || prefersReducedMotion()) {
      first.current = false;
      rects.current = measure();
      return;
    }

    const previous = rects.current;
    const children = container.querySelectorAll<HTMLElement>(':scope > [data-flip-key]');
    let enterIndex = 0;

    children.forEach((el) => {
      const key = el.dataset.flipKey!;
      const next = el.getBoundingClientRect();
      const prev = previous.get(key);
      el.getAnimations().forEach((a) => a.cancel());

      if (prev) {
        const dx = prev.left - next.left;
        const dy = prev.top - next.top;
        const sx = next.width ? prev.width / next.width : 1;
        const sy = next.height ? prev.height / next.height : 1;
        const resized = Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || resized) {
          el.animate(
            [
              {
                transformOrigin: '0 0',
                transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
              },
              { transformOrigin: '0 0', transform: 'translate(0, 0) scale(1, 1)' },
            ],
            { duration: 620, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
          );
        }
      } else {
        el.classList.add('is-revealed');
        const visible = next.top < window.innerHeight && next.bottom > 0;
        el.animate(
          [
            { opacity: 0, transform: 'translateY(24px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          {
            duration: 560,
            delay: visible ? Math.min(enterIndex++, 8) * 45 : 0,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'backwards',
          }
        );
      }
    });

    rects.current = measure();
  }, deps);

  const snapshot = () => {
    rects.current = measure();
  };

  return { containerRef, snapshot };
}
