"use client";

import { BookOpen } from "lucide-react";
import { useState } from "react";

type StorySceneImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  waitingIconSize?: number;
};

/**
 * Uses a plain `<img>` so Supabase Storage (and other CDN) URLs load without Next/Image remotePatterns quirks.
 */
export function StorySceneImage({
  src,
  alt,
  width,
  height,
  waitingIconSize,
}: StorySceneImageProps) {
  const [failed, setFailed] = useState(false);
  const iconSize = waitingIconSize ?? (width >= 900 ? 86 : 72);

  if (failed) {
    return (
      <div className="scene-art scene-art-waiting">
        <BookOpen size={iconSize} strokeWidth={1.4} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- intentional for arbitrary persisted story URLs
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
