import { useEffect } from 'react';

function useHtmlScrollLock(isMenuOpen: boolean) {
  useEffect(() => {
    const html = document.documentElement;

    if (isMenuOpen) {
      html.classList.add('scroll-lock');
    } else {
      html.classList.remove('scroll-lock');
    }

    return () => {
      html.classList.remove('scroll-lock');
    };
  }, [isMenuOpen]);
}

export default useHtmlScrollLock;
