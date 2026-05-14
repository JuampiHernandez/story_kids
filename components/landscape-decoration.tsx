type SvgProps = {
  className?: string;
};

export function Cloud({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 220 110"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cloud-fill" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#f3e9ff" stopOpacity="0.92" />
        </linearGradient>
      </defs>
      <g
        fill="url(#cloud-fill)"
        stroke="#d8c5f5"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <ellipse cx="60" cy="68" rx="36" ry="30" />
        <ellipse cx="100" cy="48" rx="40" ry="34" />
        <ellipse cx="148" cy="58" rx="34" ry="30" />
        <ellipse cx="180" cy="76" rx="28" ry="22" />
        <ellipse cx="42" cy="80" rx="26" ry="18" />
      </g>
    </svg>
  );
}

export function Tree({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 140 200"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tree-leaves" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#9bd9a3" />
          <stop offset="100%" stopColor="#5fbf73" />
        </linearGradient>
        <linearGradient id="tree-trunk" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9b6a3b" />
          <stop offset="100%" stopColor="#6a4623" />
        </linearGradient>
      </defs>
      {/* Trunk */}
      <rect
        x="62"
        y="120"
        width="16"
        height="64"
        rx="6"
        fill="url(#tree-trunk)"
      />
      {/* Foliage clusters */}
      <g
        fill="url(#tree-leaves)"
        stroke="#3d8a52"
        strokeWidth="2.2"
        strokeLinejoin="round"
      >
        <ellipse cx="70" cy="58" rx="42" ry="46" />
        <ellipse cx="40" cy="86" rx="28" ry="28" />
        <ellipse cx="100" cy="86" rx="28" ry="28" />
        <ellipse cx="70" cy="100" rx="34" ry="24" />
      </g>
      {/* Highlight */}
      <ellipse cx="58" cy="44" rx="14" ry="10" fill="#c4eecb" opacity="0.8" />
    </svg>
  );
}

type StarProps = SvgProps & { color?: string };

export function Star({ className, color = "#f9b6c8" }: StarProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 3.5c1.4 0 2.6.9 3 2.2l3 9.2 9.7.1c1.5 0 2.6 1.4 2.1 2.8a3 3 0 0 1-1 1.4l-7.8 5.7 3 9.3a2.6 2.6 0 0 1-3.9 2.9L20 31.6l-7.8 5.6a2.6 2.6 0 0 1-3.9-2.9l3-9.3-7.8-5.7a2.5 2.5 0 0 1 1.5-4.5l9.7-.1 3-9.2c.4-1.3 1.6-2.2 3.3-2.2Z"
        fill={color}
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sparkle({ className, color = "#c4b5fd" }: StarProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 4c.6 6.7 3.3 9.4 12 10-8.7.6-11.4 3.3-12 12-.6-8.7-3.3-11.4-12-12 8.7-.6 11.4-3.3 12-10Z"
        fill={color}
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Flower({ className, color = "#f9b6c8" }: StarProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <circle cx="16" cy="6" r="5" fill={color} />
        <circle cx="26" cy="16" r="5" fill={color} />
        <circle cx="16" cy="26" r="5" fill={color} />
        <circle cx="6" cy="16" r="5" fill={color} />
        <circle cx="16" cy="16" r="4.5" fill="#ffe066" />
      </g>
    </svg>
  );
}

/**
 * Bottom landscape band: layered rolling hills, trees, flowers, and a winding path.
 * Renders as a wide SVG sized to fill the parent's width; positioned at the bottom
 * of the page by the parent container. Decorative only.
 */
export function HillsBand({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 1440 360"
      preserveAspectRatio="xMidYEnd slice"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hill-back" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#cdebcf" />
          <stop offset="100%" stopColor="#a6dcae" />
        </linearGradient>
        <linearGradient id="hill-mid" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#b6e3bb" />
          <stop offset="100%" stopColor="#88cf95" />
        </linearGradient>
        <linearGradient id="hill-front" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#9adba0" />
          <stop offset="100%" stopColor="#6cc079" />
        </linearGradient>
        <linearGradient id="path-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4d68f" />
          <stop offset="100%" stopColor="#e0b864" />
        </linearGradient>
      </defs>

      {/* Back hills */}
      <path
        d="M0 220 C 180 150, 320 250, 520 200 S 880 150, 1080 210 S 1320 240, 1440 200 L1440 360 L0 360 Z"
        fill="url(#hill-back)"
      />
      {/* Mid hills */}
      <path
        d="M0 270 C 220 220, 420 300, 620 250 S 1040 230, 1240 280 S 1380 270, 1440 260 L1440 360 L0 360 Z"
        fill="url(#hill-mid)"
      />
      {/* Path winding through */}
      <path
        d="M1240 360 C 1200 320, 1300 300, 1280 270 C 1260 240, 1340 220, 1300 200"
        fill="none"
        stroke="url(#path-fill)"
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Front hills */}
      <path
        d="M0 320 C 220 280, 380 340, 620 310 S 980 280, 1180 320 S 1380 320, 1440 310 L1440 360 L0 360 Z"
        fill="url(#hill-front)"
      />

      {/* Tiny flowers on front hills */}
      <g>
        {[
          { x: 110, y: 326, c: "#f8a6c2" },
          { x: 240, y: 332, c: "#fff1a6" },
          { x: 360, y: 322, c: "#dcb6ff" },
          { x: 520, y: 330, c: "#f8a6c2" },
          { x: 720, y: 324, c: "#fff1a6" },
          { x: 920, y: 332, c: "#dcb6ff" },
          { x: 1100, y: 326, c: "#f8a6c2" },
          { x: 1280, y: 332, c: "#fff1a6" },
        ].map((f, i) => (
          <g key={i} transform={`translate(${f.x}, ${f.y})`}>
            <circle cx="0" cy="0" r="3.6" fill={f.c} />
            <circle cx="6" cy="-1" r="3.6" fill={f.c} />
            <circle cx="3" cy="-5" r="3.6" fill={f.c} />
            <circle cx="3" cy="-2" r="2" fill="#ffe066" />
          </g>
        ))}
      </g>
    </svg>
  );
}
