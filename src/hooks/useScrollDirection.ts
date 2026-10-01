import { useEffect, useState } from 'react';

export default function useScrollDirection(threshold = 120) {
  const [state, setState] = useState({ hidden: false, scrolled: false });

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;
      setState((prev) => {
        let hidden = prev.hidden;
        if (y < threshold) hidden = false;
        else if (delta > 6) hidden = true;
        else if (delta < -6) hidden = false;
        const scrolled = y > 4;
        return hidden === prev.hidden && scrolled === prev.scrolled ? prev : { hidden, scrolled };
      });
      if (Math.abs(delta) > 6 || y < threshold) lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return state;
}
