"use client";

import Image from "next/image";
import { BookOpen } from "lucide-react";
import { useState } from "react";

type StorySceneImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  waitingIconSize?: number;
};

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
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
