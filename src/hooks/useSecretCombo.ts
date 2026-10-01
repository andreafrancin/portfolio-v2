import { useEffect, useRef } from 'react';

export default function useSecretCombo(onTrigger: () => void, sequence = '12345', windowMs = 2000) {
  const handler = useRef(onTrigger);
  handler.current = onTrigger;

  useEffect(() => {
    let typed = '';
    let startedAt = 0;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        target?.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }
      const now = performance.now();
      if (!typed || now - startedAt > windowMs) {
        typed = '';
        startedAt = now;
      }
      typed += e.key;
      if (!sequence.startsWith(typed)) {
        typed = sequence.startsWith(e.key) ? e.key : '';
        startedAt = now;
        return;
      }
      if (typed === sequence) {
        typed = '';
        handler.current();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sequence, windowMs]);
}
