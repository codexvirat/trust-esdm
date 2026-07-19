export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 340">
      <rect x="0" y="0" width="400" height="340" rx="36" fill="#12332A" />
      <g stroke="#2B5B4C" strokeWidth="4" fill="none" opacity="0.9">
        <path d="M30 40 H160 V90 H260" />
        <path d="M30 120 H100 V200 H30" />
        <path d="M370 40 H300 V140 H240" />
        <path d="M370 300 H280 V230 H340" />
        <path d="M60 300 H60 V250 H140 V300" />
        <path d="M200 300 V260 H160" />
      </g>
      <g fill="#B8722F">
        <circle cx="30" cy="40" r="9" />
        <circle cx="260" cy="90" r="9" />
        <circle cx="30" cy="200" r="9" />
        <circle cx="370" cy="40" r="9" />
        <circle cx="240" cy="140" r="9" />
        <circle cx="370" cy="300" r="9" />
        <circle cx="340" cy="230" r="9" />
        <circle cx="60" cy="300" r="9" />
        <circle cx="140" cy="250" r="9" />
        <circle cx="200" cy="300" r="9" />
      </g>
      <rect x="150" y="120" width="100" height="100" rx="14" fill="#1F4B3F" stroke="#E4B94C" strokeWidth="4" />
      <text x="200" y="180" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="24" fill="#E4B94C">
        ESDM
      </text>
      <g stroke="#E4B94C" strokeWidth="4">
        <line x1="150" y1="140" x2="130" y2="140" />
        <line x1="150" y1="170" x2="130" y2="170" />
        <line x1="150" y1="200" x2="130" y2="200" />
        <line x1="250" y1="140" x2="270" y2="140" />
        <line x1="250" y1="170" x2="270" y2="170" />
        <line x1="250" y1="200" x2="270" y2="200" />
      </g>
    </svg>
  );
}
