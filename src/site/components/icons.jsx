const I = ({ children, size = 18, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {children}
  </svg>
);
export const CopyIcon = (p) => (<I {...p}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" /></I>);
export const CheckIcon = (p) => (<I {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></I>);
export const DownloadIcon = (p) => (<I {...p}><path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></I>);
export const ArrowIcon = (p) => (<I {...p}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></I>);
export const BoltIcon = (p) => (<I {...p}><path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" /></I>);
export const LayersIcon = (p) => (<I {...p}><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></I>);
export const GaugeIcon = (p) => (<I {...p}><path d="M4 16a8 8 0 1 1 16 0" /><path d="m12 16 4-5" /><circle cx="12" cy="16" r="1" /></I>);
export const BoxIcon = (p) => (<I {...p}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" /><path d="m4 7.5 8 4.5 8-4.5" /><path d="M12 12v9" /></I>);
export const CodeIcon = (p) => (<I {...p}><path d="m8 8-5 4 5 4" /><path d="m16 8 5 4-5 4" /><path d="m14 5-4 14" /></I>);
export const BookIcon = (p) => (<I {...p}><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" /></I>);
export const SlidersIcon = (p) => (<I {...p}><path d="M4 7h9" /><path d="M17 7h3" /><circle cx="15" cy="7" r="2" /><path d="M4 17h3" /><path d="M11 17h9" /><circle cx="9" cy="17" r="2" /></I>);
export const HomeIcon = (p) => (<I {...p}><path d="m4 11 8-7 8 7" /><path d="M6 10v10h12V10" /></I>);
export const HelpIcon = (p) => (<I {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7" /><circle cx="12" cy="17" r=".6" /></I>);
export const ExternalIcon = (p) => (<I {...p}><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></I>);
export const PlusIcon = (p) => (<I {...p}><path d="M12 5v14" /><path d="M5 12h14" /></I>);
export const SearchIcon = (p) => (<I {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></I>);
export const CheckCircle = (p) => (<I {...p}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></I>);
export const MinusCircle = (p) => (<I {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></I>);
export const Logo = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="lgLogo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6ea8ff" />
        <stop offset="1" stopColor="#b58bff" />
      </linearGradient>
    </defs>
    <rect x="2" y="7" width="20" height="18" rx="9" fill="url(#lgLogo)" opacity=".95" />
    <rect x="11" y="4" width="19" height="18" rx="9" fill="rgba(255,255,255,.28)" stroke="rgba(255,255,255,.7)" strokeWidth="1.2" />
  </svg>
);
