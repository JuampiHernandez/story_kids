type StorypopLogoProps = {
  className?: string;
  title?: string;
};

const letterColors = ["#8b5cf6", "#f7a22d", "#50c5c8", "#f57a9d", "#76c78e", "#8b5cf6", "#f7a22d", "#50c5c8"];

export function StorypopLogo({ className, title }: StorypopLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 82"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="storypop-mic-body" x1="16" x2="60" y1="12" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbcfe8" />
          <stop offset="0.5" stopColor="#f4729a" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="storypop-mic-grill" x1="23" x2="50" y1="17" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff7ed" />
          <stop offset="1" stopColor="#ffe3ad" />
        </linearGradient>
      </defs>

      <g transform="rotate(-8 39 40)">
        <path
          d="M38.5 62.5c13.2 0 23.8-9.9 23.8-22.2v-4.8"
          fill="none"
          stroke="#19154c"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <path
          d="M20.1 35.5v4.8c0 12.3 8.4 22.2 18.8 22.2"
          fill="none"
          stroke="#19154c"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <rect x="22" y="7" width="34" height="48" rx="17" fill="url(#storypop-mic-body)" />
        <rect x="27" y="14" width="24" height="18" rx="9" fill="url(#storypop-mic-grill)" opacity="0.86" />
        <path d="M32 20h14M31 26h16" stroke="#d97706" strokeLinecap="round" strokeWidth="2.4" opacity="0.55" />
        <circle cx="33" cy="39" r="2.5" fill="#211957" />
        <circle cx="45" cy="39" r="2.5" fill="#211957" />
        <path d="M34.5 46c2.9 2.7 6.9 2.7 9.8 0" fill="none" stroke="#211957" strokeLinecap="round" strokeWidth="2.6" />
        <path d="M39 63v9M29 72h20" stroke="#19154c" strokeLinecap="round" strokeWidth="5" />
        <circle cx="55" cy="18" r="4" fill="#ffd65c" />
        <path d="M14 18l2.1 4.4 4.6 1.5-4.6 1.5L14 30l-2.1-4.6-4.6-1.5 4.6-1.5L14 18Z" fill="#42c8c9" />
      </g>

      <g aria-hidden="true" fontFamily="var(--font-geist-sans), Arial Rounded MT Bold, Arial, sans-serif" fontSize="45" fontWeight="1000" letterSpacing="-5">
        {"storypop".split("").map((letter, index) => (
          <text key={`${letter}-${index}`} x={82 + index * 25} y="55" fill={letterColors[index]}>
            {letter}
          </text>
        ))}
      </g>
    </svg>
  );
}
