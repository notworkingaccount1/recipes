import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true
};

interface IconProps { size?: number; className?: string }

export const IconX = ({ size = 18, className }: IconProps) => (
  <svg className={className} width={size} height={size} {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconChev = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" {...base}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconSearch = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const IconSettings = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" {...base}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
);
export const IconDownload = ({ className }: IconProps) => (
  <svg className={className} width="20" height="20" {...base}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>
);
export const IconPlus = ({ className }: IconProps) => (
  <svg className={className} width="22" height="22" {...base} strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
);
export const IconStar = () => (
  <svg viewBox="-1.5 -1.5 27 27" width="32" height="32" aria-hidden="true">
    <path fill="currentColor" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);
