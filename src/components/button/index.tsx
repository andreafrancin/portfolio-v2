import React, { useCallback, useMemo } from 'react';
import './index.scss';

type ButtonType = 'submit' | 'normal';

interface ButtonInterface {
  className?: string;
  type?: ButtonType;
  onClick: Function;
  children: any;
}

const Button = ({ className, onClick, type = 'normal', children }: ButtonInterface) => {
  const handleOnClick = useCallback(() => {
    onClick && onClick();
  }, [onClick]);

  const buttonClassNameByType = useMemo(() => {
    switch (type) {
      case 'normal':
        return 'button';
      case 'submit':
        return 'button-submit';
      default:
        return 'normal';
    }
  }, [type]);

  return (
    <button className={className || buttonClassNameByType} onClick={handleOnClick}>
      {children}
    </button>
  );
};

export default Button;
