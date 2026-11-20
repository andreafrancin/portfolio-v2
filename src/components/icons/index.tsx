import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'ref'> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconArrowRight = (p: IconProps) => (
  <Svg {...p} className={`arrow-forward ${p.className || ''}`}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Svg>
);

export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p} className={`arrow-back ${p.className || ''}`}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const IconShare = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12M8 7l4-4 4 4M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" />
  </Svg>
);

export const IconArrowUpRight = (p: IconProps) => (
  <Svg {...p} className={`arrow-forward ${p.className || ''}`}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Svg>
);

export const IconGrip = (p: IconProps) => (
  <Svg {...p} stroke="none" fill="currentColor">
    <circle cx="9.25" cy="6.25" r="1.5" />
    <circle cx="14.75" cy="6.25" r="1.5" />
    <circle cx="9.25" cy="12" r="1.5" />
    <circle cx="14.75" cy="12" r="1.5" />
    <circle cx="9.25" cy="17.75" r="1.5" />
    <circle cx="14.75" cy="17.75" r="1.5" />
  </Svg>
);

export const IconEdit = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4ZM13 7l4 4" />
  </Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
  </Svg>
);

export const IconEye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconEyeOff = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4l16 16M10.2 5.7A10 10 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3 3.7M6.4 7.3A16.6 16.6 0 0 0 2 12s3.6 6.5 10 6.5c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v16M4 12h16" />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 5l14 14M19 5 5 19" />
  </Svg>
);

export const IconMenu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8h18M3 16h18" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12.5 9.5 18 20 6.5" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 2 20h20L12 3ZM12 10v4M12 16.5v1" />
  </Svg>
);

export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v1" />
  </Svg>
);

export const IconLink = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Svg>
);

export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 8h12v12H8zM16 8V4H4v12h4" />
  </Svg>
);

export const IconUpload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4 15v5h16v-5" />
  </Svg>
);

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
  </Svg>
);

export const IconGrid = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Svg>
);

export const IconRows = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="7" rx="1.5" />
    <rect x="4" y="13" width="16" height="7" rx="1.5" />
  </Svg>
);

export const IconMail = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 5h18v14H3zM3 6l9 7 9-7" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </Svg>
);

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4H5v16h9M10 12h11M17 8l4 4-4 4" />
  </Svg>
);

export const IconChevronUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 15 6-6 6 6" />
  </Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconSparkle = (p: IconProps) => (
  <Svg {...p} stroke="none" fill="currentColor">
    <path d="M12 2.5c.5 4.9 2.6 7 7.5 7.5v.1c-4.9.5-7 2.6-7.5 7.5h-.1c-.5-4.9-2.6-7-7.5-7.5V10c4.9-.5 7-2.6 7.5-7.5h.1Z" />
    <path d="M19 15.5c.2 1.9 1 2.8 3 3-2 .2-2.8 1-3 3-.2-2-1.1-2.8-3-3 1.9-.2 2.8-1.1 3-3Z" />
  </Svg>
);

export const IconInstagram = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconLinkedin = ({ size = 20, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...rest}
  >
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75ZM9.5 9.75h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1V21h-4v-4.98c0-1.19-.02-2.72-1.66-2.72-1.66 0-1.91 1.3-1.91 2.63V21h-4V9.75Z" />
  </svg>
);

export const IconBold = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />
  </Svg>
);

export const IconItalic = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 5h7M7 19h7M14 5l-4 14" />
  </Svg>
);

export const IconStrike = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h16M16 7.5C15.5 6 14 5 12 5c-2.5 0-4 1.3-4 3 0 1 .4 1.8 1.5 2.5M8 16.5c.5 1.5 2 2.5 4 2.5 2.5 0 4-1.3 4-3 0-.6-.1-1.1-.5-1.5" />
  </Svg>
);

export const IconList = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth={2.5} />
  </Svg>
);

export const IconListOrdered = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 6h10M10 12h10M10 18h10M4 4.5 5.5 4v4.5M4 14.5c0-1.5 2.5-1.5 2.5 0 0 1-2.5 2-2.5 3h2.5" />
  </Svg>
);

export const IconQuote = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 17V7M9 9h10M9 13h10M9 17h6" />
  </Svg>
);

export const IconDivider = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h16M8 6h8M8 18h8" />
  </Svg>
);

export const IconImage = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
  </Svg>
);

export const IconUndo = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 6 4 10l4 4M4 10h10a5 5 0 0 1 0 10h-3" />
  </Svg>
);

export const IconRedo = (p: IconProps) => (
  <Svg {...p}>
    <path d="m16 6 4 4-4 4M20 10H10a5 5 0 0 0 0 10h3" />
  </Svg>
);

export const IconMore = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="1.25" fill="currentColor" />
    <circle cx="12" cy="12" r="1.25" fill="currentColor" />
    <circle cx="19" cy="12" r="1.25" fill="currentColor" />
  </Svg>
);

export const IconInvoice = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5" />
  </Svg>
);
