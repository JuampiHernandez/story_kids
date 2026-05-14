import Image from "next/image";

type IllustrationProps = {
  className?: string;
};

/**
 * Step 1 — "Set it up in 30 seconds": a stylized kid profile card.
 */
export function StepProfileCard({ className }: IllustrationProps) {
  return (
    <div className={className} aria-hidden="true">
      <svg
        viewBox="0 0 320 220"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        <defs>
          <linearGradient id="profile-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbf6ff" />
            <stop offset="100%" stopColor="#fdebf3" />
          </linearGradient>
          <linearGradient id="profile-avatar-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="profile-skin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fce0c8" />
            <stop offset="100%" stopColor="#f3c2a0" />
          </linearGradient>
        </defs>

        {/* Card */}
        <rect
          x="12"
          y="14"
          width="296"
          height="192"
          rx="22"
          fill="url(#profile-bg)"
          stroke="#e8d9ff"
          strokeWidth="2"
        />

        {/* Avatar */}
        <g transform="translate(28, 36)">
          <rect width="120" height="148" rx="18" fill="url(#profile-avatar-bg)" />
          {/* Face */}
          <g transform="translate(60, 78)">
            <ellipse cx="0" cy="0" rx="34" ry="38" fill="url(#profile-skin)" />
            {/* Hair */}
            <path
              d="M-34 -8 C -36 -34, -10 -42, 0 -42 C 18 -42, 36 -32, 32 -10 C 26 -22, 12 -28, 0 -26 C -16 -24, -28 -18, -34 -8 Z"
              fill="#5a3a1f"
            />
            <path
              d="M-32 -2 C -36 14, -34 22, -28 28 C -32 18, -32 6, -30 -2 Z"
              fill="#5a3a1f"
            />
            {/* Eyes */}
            <ellipse cx="-12" cy="-2" rx="3" ry="4" fill="#1a1340" />
            <ellipse cx="12" cy="-2" rx="3" ry="4" fill="#1a1340" />
            <circle cx="-11" cy="-3.5" r="1" fill="#fff" />
            <circle cx="13" cy="-3.5" r="1" fill="#fff" />
            {/* Cheeks */}
            <ellipse cx="-18" cy="10" rx="5" ry="3" fill="#f88aae" opacity="0.6" />
            <ellipse cx="18" cy="10" rx="5" ry="3" fill="#f88aae" opacity="0.6" />
            {/* Smile */}
            <path
              d="M-7 14 C -3 18, 3 18, 7 14"
              stroke="#1a1340"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>

        {/* Profile lines */}
        <g transform="translate(166, 50)" fontFamily="ui-rounded, system-ui, sans-serif">
          <g>
            <rect x="0" y="0" width="20" height="20" rx="6" fill="#ede9fe" />
            <text x="10" y="14" fontSize="11" textAnchor="middle">👤</text>
            <text x="28" y="15" fontSize="13" fontWeight="900" fill="#19154c">
              Emma
            </text>
          </g>
          <g transform="translate(0, 36)">
            <rect x="0" y="0" width="20" height="20" rx="6" fill="#ffe4ec" />
            <text x="10" y="14" fontSize="11" textAnchor="middle">🎂</text>
            <text x="28" y="15" fontSize="13" fontWeight="900" fill="#19154c">
              6 years old
            </text>
          </g>
          <g transform="translate(0, 72)">
            <rect x="0" y="0" width="20" height="20" rx="6" fill="#ffe7d4" />
            <text x="10" y="14" fontSize="11" textAnchor="middle">❤️</text>
            <text x="28" y="13" fontSize="11" fontWeight="800" fill="#5b4d8a">
              Loves dinosaurs,
            </text>
            <text x="28" y="26" fontSize="11" fontWeight="800" fill="#5b4d8a">
              space &amp; rainbows
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

/**
 * Step 2 — "Hand it to your kid": glowing microphone with prompt bubbles.
 */
export function StepMicScene({ className }: IllustrationProps) {
  return (
    <div className={className} aria-hidden="true">
      <svg
        viewBox="0 0 320 220"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        <defs>
          <radialGradient id="mic-glow" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="#f5e6ff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#e6d2ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#e6d2ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mic-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="60%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="mic-grill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fde6f1" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Glow halo */}
        <circle cx="160" cy="120" r="100" fill="url(#mic-glow)" />

        {/* Mic stand base */}
        <g transform="translate(160, 130)">
          {/* Body */}
          <ellipse cx="0" cy="0" rx="42" ry="50" fill="url(#mic-body)" />
          {/* Grill highlight */}
          <ellipse cx="-6" cy="-12" rx="22" ry="18" fill="url(#mic-grill)" opacity="0.8" />
          {/* Eyes */}
          <ellipse cx="-12" cy="6" rx="3.4" ry="4.4" fill="#1a1340" />
          <ellipse cx="12" cy="6" rx="3.4" ry="4.4" fill="#1a1340" />
          <circle cx="-11" cy="4" r="1.2" fill="#fff" />
          <circle cx="13" cy="4" r="1.2" fill="#fff" />
          {/* Cheeks */}
          <ellipse cx="-22" cy="18" rx="5" ry="3" fill="#f88aae" opacity="0.7" />
          <ellipse cx="22" cy="18" rx="5" ry="3" fill="#f88aae" opacity="0.7" />
          {/* Smile */}
          <path
            d="M-9 22 C -4 28, 4 28, 9 22"
            stroke="#1a1340"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Stand */}
          <rect x="-3" y="50" width="6" height="14" rx="2" fill="#7c3aed" />
          <ellipse cx="0" cy="66" rx="22" ry="5" fill="#a78bfa" />
        </g>

        {/* Floating prompt bubbles */}
        <g transform="translate(56, 56)">
          <ellipse cx="0" cy="0" rx="28" ry="22" fill="#fff" stroke="#e8d9ff" strokeWidth="2" />
          <text x="0" y="6" fontSize="22" textAnchor="middle">🐉</text>
          <path d="M16 18 L26 26 L18 22 Z" fill="#fff" stroke="#e8d9ff" strokeWidth="2" strokeLinejoin="round" />
        </g>
        <g transform="translate(266, 64)">
          <ellipse cx="0" cy="0" rx="28" ry="22" fill="#fff" stroke="#e8d9ff" strokeWidth="2" />
          <text x="0" y="6" fontSize="22" textAnchor="middle">🐱</text>
          <path d="M-16 18 L-26 26 L-18 22 Z" fill="#fff" stroke="#e8d9ff" strokeWidth="2" strokeLinejoin="round" />
        </g>
        <g transform="translate(266, 168)">
          <ellipse cx="0" cy="0" rx="28" ry="22" fill="#fff" stroke="#e8d9ff" strokeWidth="2" />
          <text x="0" y="6" fontSize="22" textAnchor="middle">🚀</text>
          <path d="M-18 -16 L-26 -22 L-16 -20 Z" fill="#fff" stroke="#e8d9ff" strokeWidth="2" strokeLinejoin="round" />
        </g>

        {/* Sparkles */}
        <g fill="#ffd65c">
          <path d="M48 130 l3 6 6 2 -6 2 -3 6 -3 -6 -6 -2 6 -2z" />
          <path d="M270 124 l3 6 6 2 -6 2 -3 6 -3 -6 -6 -2 6 -2z" />
          <path d="M180 26 l3 6 6 2 -6 2 -3 6 -3 -6 -6 -2 6 -2z" fill="#f9b6c8" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Step 3 — "Snuggle up and read": a fully illustrated open storybook.
 */
export function StepBookScene({ className }: IllustrationProps) {
  return (
    <div className={className} aria-hidden="true">
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "320 / 220",
        }}
      >
        <svg
          viewBox="0 0 320 220"
          xmlns="http://www.w3.org/2000/svg"
          focusable="false"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <defs>
            <linearGradient id="book-cover" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="book-page" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffdf6" />
              <stop offset="100%" stopColor="#fff5fb" />
            </linearGradient>
          </defs>
          {/* Book cover behind */}
          <path
            d="M28 36 Q 160 18, 292 36 L 296 188 Q 160 168, 24 188 Z"
            fill="url(#book-cover)"
          />
          {/* Pages */}
          <path
            d="M40 44 Q 160 30, 280 44 L 280 178 Q 160 162, 40 178 Z"
            fill="url(#book-page)"
            stroke="#e8d9ff"
            strokeWidth="1.5"
          />
          {/* Spine */}
          <path
            d="M160 32 Q 160 110, 160 174"
            stroke="#7c3aed"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>

        {/* Left page: dragon-rider scene image clipped into the page area */}
        <div
          style={{
            position: "absolute",
            left: "14.5%",
            top: "23%",
            width: "33%",
            height: "60%",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6)",
          }}
        >
          <Image
            src="/bedtime-universe/dragon-rider.png"
            alt=""
            fill
            sizes="200px"
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
        </div>

        {/* Right page: faux text lines */}
        <div
          style={{
            position: "absolute",
            right: "14.5%",
            top: "27%",
            width: "33%",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {[100, 92, 86, 78, 88, 70].map((w, i) => (
            <div
              key={i}
              style={{
                width: `${w}%`,
                height: "6px",
                borderRadius: "999px",
                background:
                  i === 0
                    ? "linear-gradient(90deg, #c4b5fd, #f4729a)"
                    : "rgba(91, 77, 138, 0.22)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
