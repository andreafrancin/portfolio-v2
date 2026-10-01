import { useCategories } from '../../config/categories';
import './index.scss';

function InkStrip({ className = '' }: { className?: string }) {
  const categories = useCategories();
  return (
    <span className={`glow-row ${className}`} aria-hidden="true">
      {categories.map((c, i) => (
        <span
          key={c.slug}
          className="swatch"
          style={{ '--swatch': c.ink, '--i': i } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

export default InkStrip;
