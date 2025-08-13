import React from 'react';

interface SvgDotsProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

const DragAndDropIcon: React.FC<SvgDotsProps> = ({
  width = 24,
  height = 24,
  color = '#141516',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="8" cy="4" r="2" />
    <circle cx="8" cy="12" r="2" />
    <circle cx="8" cy="20" r="2" />
    <circle cx="16" cy="4" r="2" />
    <circle cx="16" cy="12" r="2" />
    <circle cx="16" cy="20" r="2" />
  </svg>
);

export default DragAndDropIcon;
