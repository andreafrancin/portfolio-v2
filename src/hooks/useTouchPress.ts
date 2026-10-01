import { useEffect, useState } from 'react';

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
