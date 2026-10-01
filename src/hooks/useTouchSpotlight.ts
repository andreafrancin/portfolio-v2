import { useEffect, useState } from 'react';

const touchOnly = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches;

export default function useTouchSpotlight(ref: React.RefObject<HTMLElement | null>) {
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !touchOnly()) return;
    const io = new IntersectionObserver(([entry]) => setLit(entry.isIntersecting), {
      rootMargin: '-40% 0px -40% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  return lit;
}

export function useTouchPress(duration = 700) {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!pressed) return;
    const timer = window.setTimeout(() => setPressed(false), duration);
    return () => window.clearTimeout(timer);
  }, [pressed, duration]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') setPressed(true);
  };

  return { pressed, onPointerDown };
}
