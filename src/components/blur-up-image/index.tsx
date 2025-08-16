import React, { useEffect, useRef, useState } from 'react';
import './index.scss';

export interface BlurUpImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  low: string;
  src: string;
  alt: string;
}

const BlurUpImage: React.FC<BlurUpImageProps> = ({ low, src, alt, ...imgProps }) => {
  const [loaded, setLoaded] = useState(false);
  const highRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = highRef.current;
    if (!img) return;

    const finish = () => setLoaded(true);

    if (img.complete && img.naturalWidth > 0) {
      const anyImg = img as any;
      if (typeof anyImg.decode === 'function') {
        anyImg
          .decode()
          .catch(() => {})
          .finally(finish);
      } else {
        finish();
      }
      return;
    }

    img.addEventListener('load', finish, { once: true });
    img.addEventListener('error', finish, { once: true });

    return () => {
      img.removeEventListener('load', finish);
      img.removeEventListener('error', finish);
    };
  }, [src]);

  return (
    <div className={`blurup ${loaded ? 'is-loaded' : ''}`}>
      <img className="blurup__img blurup__img--low" src={low} alt="" aria-hidden="true" />
      <img
        ref={highRef}
        className="blurup__img blurup__img--high"
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        {...imgProps}
      />
    </div>
  );
};

export default BlurUpImage;
