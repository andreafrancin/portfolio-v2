import { useEffect, useRef, useState } from 'react';
import './index.scss';

interface Props {
  src: string;
  low?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}

function ProgressiveImage({ src, low, alt, className = '', eager }: Props) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <span className={`pimg ${loaded ? 'is-loaded' : ''} ${className}`}>
      {low && low !== src && <img className="pimg__low" src={low} alt="" aria-hidden="true" />}
      <img
        ref={ref}
        className="pimg__full"
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </span>
  );
}

export default ProgressiveImage;
