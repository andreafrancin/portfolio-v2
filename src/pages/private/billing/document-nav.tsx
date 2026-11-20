import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DocumentNavProps {
  sections: { id: string; label: string }[];
  totalLabel: string;
  total: string;
  // Shown only when the preview sits below the form instead of beside it.
  preview?: { id: string; label: string };
}

// Short jump menu for the long document form, with the running total always in view.
function DocumentNav({ sections, totalLabel, total, preview }: DocumentNavProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState(sections[0]?.id ?? '');
  const ids = sections.map((section) => section.id).join(',');

  useEffect(() => {
    const elements = ids
      .split(',')
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    const updateActive = () => {
      // The current section is the last one whose top has passed the upper third of the window.
      const line = window.innerHeight / 3;
      let current = elements[0]?.id ?? '';

      for (const element of elements) {
        if (element.getBoundingClientRect().top <= line) current = element.id;
      }

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atBottom ? (elements[elements.length - 1]?.id ?? current) : current);
    };

    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);

    return () => {
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('resize', updateActive);
    };
  }, [ids]);

  const jump = (id: string) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setActive(id);
  };

  return (
    <nav className="doc-nav" aria-label={t('BILLING.SECTIONS')}>
      <div className="doc-nav__links">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className="doc-nav__link"
            aria-current={active === section.id ? 'true' : undefined}
            onClick={() => jump(section.id)}
          >
            {section.label}
          </button>
        ))}
        {preview && (
          <button
            type="button"
            className="doc-nav__link doc-nav__link--preview"
            onClick={() => jump(preview.id)}
          >
            {preview.label}
          </button>
        )}
      </div>
      <p className="doc-nav__total">
        <span>{totalLabel}</span>
        <strong className="tabular">{total}</strong>
      </p>
    </nav>
  );
}

export default DocumentNav;
