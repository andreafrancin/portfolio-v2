import { useEffect } from 'react';

export function useStickyFixedHeader() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    const update = () => {
      const offset = Math.max(0, vv?.offsetTop ?? 0);
      root.style.setProperty('--fix-top', `${offset}px`);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    vv?.addEventListener('scroll', update, { passive: true });
    vv?.addEventListener('resize', update, { passive: true });

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update as any);
      vv?.removeEventListener('resize', update as any);
    };
  }, []);
}
