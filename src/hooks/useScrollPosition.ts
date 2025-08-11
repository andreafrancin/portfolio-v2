import { useState, useEffect } from 'react';

function useScrollPosition(threshold = 0) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    window.addEventListener('scroll', onScroll);
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);

  return scrolled;
}

export default useScrollPosition;
