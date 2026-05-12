"use client";

import { useEffect, useMemo, useState } from "react";

type MagicLoadingScreenProps = {
  caption?: string;
};

type LoadingPhrase = {
  emoji: string;
  text: string;
  hue: string;
};

const LOADING_PHRASES: LoadingPhrase[] = [
  { emoji: "🌙", text: "Tucking the moon into the story...", hue: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #6366f1 100%)" },
  { emoji: "🪐", text: "Borrowing wonder from a far-off planet...", hue: "linear-gradient(135deg, #082f49 0%, #0e7490 55%, #22d3ee 100%)" },
  { emoji: "🐉", text: "Waking the friendly dragons...", hue: "linear-gradient(135deg, #052e16 0%, #15803d 55%, #4ade80 100%)" },
  { emoji: "🍯", text: "Brewing a pot of honey ideas...", hue: "linear-gradient(135deg, #422006 0%, #b45309 55%, #fbbf24 100%)" },
  { emoji: "🦋", text: "Asking butterflies to bring colors...", hue: "linear-gradient(135deg, #134e4a 0%, #0d9488 50%, #99f6e4 100%)" },
  { emoji: "🌿", text: "Planting some whispering trees...", hue: "linear-gradient(135deg, #14532d 0%, #4d7c0f 55%, #bef264 100%)" },
  { emoji: "🔮", text: "Peeking through the crystal ball...", hue: "linear-gradient(135deg, #312e81 0%, #6d28d9 55%, #a78bfa 100%)" },
  { emoji: "🧚", text: "Sending tiny fairies to scout the adventure...", hue: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #38bdf8 100%)" },
  { emoji: "🌊", text: "Bottling up a sea breeze for the journey...", hue: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 55%, #7dd3fc 100%)" },
  { emoji: "🛏️", text: "Plumping up the comfy story pillows...", hue: "linear-gradient(135deg, #1e293b 0%, #475569 55%, #94a3b8 100%)" },
  { emoji: "🎭", text: "Picking out costumes for the heroes...", hue: "linear-gradient(135deg, #3b0764 0%, #a21caf 55%, #f0abfc 100%)" },
  { emoji: "🐢", text: "Teaching the turtles a brand new song...", hue: "linear-gradient(135deg, #064e3b 0%, #047857 55%, #6ee7b7 100%)" },
];

const PHRASE_INTERVAL_MS = 2400;

type FloatingItem = {
  id: number;
  symbol: string;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
};

function buildFloatingItems(seed: number): FloatingItem[] {
  const symbols = ["⭐", "✨", "🌟", "💫", "🪄", "💖", "🌙"];
  const items: FloatingItem[] = [];
  let n = seed;
  const rand = () => {
    n = (n * 9301 + 49297) % 233280;
    return n / 233280;
  };
  for (let i = 0; i < 18; i += 1) {
    items.push({
      id: i,
      symbol: symbols[Math.floor(rand() * symbols.length)],
      left: rand() * 100,
      top: rand() * 100,
      size: 16 + rand() * 26,
      duration: 5 + rand() * 6,
      delay: rand() * 6,
    });
  }
  return items;
}

export function MagicLoadingScreen({ caption }: MagicLoadingScreenProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhraseIndex((index) => (index + 1) % LOADING_PHRASES.length);
    }, PHRASE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const items = useMemo(() => buildFloatingItems(42), []);
  const phrase = LOADING_PHRASES[phraseIndex];

  return (
    <div
      className="magic-loading"
      role="status"
      aria-live="polite"
      style={{ backgroundImage: phrase.hue }}
    >
      <div className="magic-loading-stars" aria-hidden="true">
        {items.map((item) => (
          <span
            key={item.id}
            className="magic-loading-star"
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              fontSize: `${item.size}px`,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.symbol}
          </span>
        ))}
      </div>

      <div className="magic-loading-glow magic-loading-glow-one" aria-hidden="true" />
      <div className="magic-loading-glow magic-loading-glow-two" aria-hidden="true" />
      <div className="magic-loading-glow magic-loading-glow-three" aria-hidden="true" />

      <div className="magic-loading-stage">
        <div className="magic-loading-book" aria-hidden="true">
          <div className="magic-loading-book-shadow" />
          <div className="magic-loading-book-cover magic-loading-book-cover-left" />
          <div className="magic-loading-book-cover magic-loading-book-cover-right" />
          <div className="magic-loading-book-page magic-loading-book-page-one" />
          <div className="magic-loading-book-page magic-loading-book-page-two" />
          <div className="magic-loading-book-page magic-loading-book-page-three" />
          <span className="magic-loading-book-sparkle magic-loading-book-sparkle-one">⭐</span>
          <span className="magic-loading-book-sparkle magic-loading-book-sparkle-two">✨</span>
          <span className="magic-loading-book-sparkle magic-loading-book-sparkle-three">🌟</span>
          <span className="magic-loading-book-sparkle magic-loading-book-sparkle-ring">💫</span>
        </div>

        <div className="magic-loading-text-wrap">
          <h1 key={phrase.text} className="magic-loading-title">
            <span className="magic-loading-emoji" aria-hidden="true">
              {phrase.emoji}
            </span>
            <span>{phrase.text}</span>
          </h1>

          <div className="magic-loading-footer">
            <div className="magic-loading-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="magic-loading-pill" aria-hidden="true">
              Conjuring
              <span className="magic-loading-pill-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </div>
          </div>

          {caption ? <p className="magic-loading-caption">{caption}</p> : null}
        </div>
      </div>
    </div>
  );
}
