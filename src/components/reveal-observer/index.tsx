import { useEffect } from 'react';

function RevealObserver() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const root = document.documentElement;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    const scan = (node: ParentNode) => {
      node.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)').forEach((el) => {
        if (!el.dataset.revealObserved) {
          el.dataset.revealObserved = '1';
          io.observe(el);
        }
      });
    };

    scan(document);
    root.classList.add('reveal-ready');

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          const el = n as HTMLElement;
          if (el.matches?.('[data-reveal]') && !el.dataset.revealObserved) {
            el.dataset.revealObserved = '1';
            io.observe(el);
          }
          scan(el);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove('reveal-ready');
    };
  }, []);

  return null;
}

export default RevealObserver;
