export const Skull = ({ className = "" }) => (
  <svg viewBox="0 0 64 72" fill="none" className={className} aria-hidden="true">
    <path
      d="M32 4C17 4 8 15 8 29c0 9 4 16 10 20v9c0 2 1 3 3 3h22c2 0 3-1 3-3v-9c6-4 10-11 10-20C56 15 47 4 32 4Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <circle cx="22" cy="30" r="6" fill="currentColor" />
    <circle cx="42" cy="30" r="6" fill="currentColor" />
    <path d="M32 38l-3 7h6l-3-7Z" fill="currentColor" />
    <path d="M24 54v6M32 54v6M40 54v6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const Bolt = ({ className = "" }) => (
  <svg viewBox="0 0 40 64" fill="none" className={className} aria-hidden="true">
    <path d="M24 2 6 36h11l-3 26 20-36H22l2-24Z" fill="currentColor" stroke="#0D0B0A" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const Star = ({ className = "" }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
    <path
      d="m24 3 6 14 15 1-11 10 3 15-13-8-13 8 3-15L3 18l15-1 6-14Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

export const BarbedWire = ({ className = "" }) => (
  <svg viewBox="0 0 200 24" fill="none" className={className} aria-hidden="true" preserveAspectRatio="none">
    <path d="M0 12h200" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
    {[20, 60, 100, 140, 180].map((x) => (
      <g key={x} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d={`M${x - 5} 5l10 14M${x + 5} 5l-10 14`} />
      </g>
    ))}
  </svg>
);

export const Dagger = ({ className = "" }) => (
  <svg viewBox="0 0 48 72" fill="none" className={className} aria-hidden="true">
    <path d="M24 2 30 40 24 62 18 40 24 2Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M10 42h28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M20 62h8l-2 8h-4l-2-8Z" fill="currentColor" />
  </svg>
);

export const Rose = ({ className = "" }) => (
  <svg viewBox="0 0 64 72" fill="none" className={className} aria-hidden="true">
    <circle cx="32" cy="20" r="14" stroke="currentColor" strokeWidth="3" />
    <path d="M32 10c6 2 8 8 4 12-4 3-10 1-10-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M32 34v34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path
      d="M32 48c-8-2-12-8-12-8s8-2 12 8ZM32 56c8-2 12-8 12-8s-8-2-12 8Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

export const Dice = ({ className = "" }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    <rect x="6" y="6" width="52" height="52" rx="8" stroke="currentColor" strokeWidth="3" />
    <circle cx="20" cy="20" r="4" fill="currentColor" />
    <circle cx="44" cy="20" r="4" fill="currentColor" />
    <circle cx="32" cy="32" r="4" fill="currentColor" />
    <circle cx="20" cy="44" r="4" fill="currentColor" />
    <circle cx="44" cy="44" r="4" fill="currentColor" />
  </svg>
);
