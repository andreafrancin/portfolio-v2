import React, { useEffect, useState } from 'react';

const useProgressiveImg = (lowQualitySrc: string, highQualitySrc: string) => {
  const [src, setSrc] = useState<any>(lowQualitySrc || highQualitySrc || '');
  const [isLow, setIsLow] = useState(!!lowQualitySrc && lowQualitySrc !== highQualitySrc);

  useEffect(() => {
    let cancelled = false;

    if (!highQualitySrc || highQualitySrc === lowQualitySrc) {
      setSrc(lowQualitySrc || highQualitySrc || '');
      setIsLow(!!lowQualitySrc && lowQualitySrc !== highQualitySrc);
      return () => {
        cancelled = true;
      };
    }

    const img = new Image();
    img.src = highQualitySrc;

    const finishToHigh = () => {
      if (cancelled) return;
      setSrc(highQualitySrc);
      setIsLow(false);
    };

    if (img.complete && img.naturalWidth > 0) {
      finishToHigh();
      return () => {
        cancelled = true;
      };
    }

    setSrc(lowQualitySrc || highQualitySrc);
    setIsLow(!!lowQualitySrc && lowQualitySrc !== highQualitySrc);

    if (typeof img.decode === 'function') {
      img.decode().then(finishToHigh).catch(finishToHigh);
    } else {
      img.onload = finishToHigh;
      img.onerror = () => {};
    }

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [lowQualitySrc, highQualitySrc]);

  return [src, { blur: isLow }];
};

export default useProgressiveImg;
