"use client";

import { BookOpen } from "lucide-react";
import { StorySceneImage } from "@/components/story-scene-image";
import { hasGeneratedStoryImageUrl } from "@/lib/story-image-utils";
import type { NarrationLine, Scene } from "@/lib/story-schema";

export type StorybookSpreadProps = {
  scene: Scene;
  activeLine: NarrationLine | null;
  favoriteActive?: boolean;
  onFavoriteClick?: () => void;
};

export function StorybookSpread({
  scene,
  activeLine,
  favoriteActive = false,
  onFavoriteClick,
}: StorybookSpreadProps) {
  const bubbleText = activeLine ? activeLine.text : scene.summary;

  return (
    <section className="book-spread">
      {onFavoriteClick ? (
        <button
          type="button"
          className={`book-favorite-btn ${favoriteActive ? "active" : ""}`}
          onClick={onFavoriteClick}
          aria-label={favoriteActive ? "Remove from favorites" : "Add to favorites"}
        >
          ★
        </button>
      ) : null}

      <div className="book-page book-page-left">
        <div className="book-page-inner">
          {hasGeneratedStoryImageUrl(scene.imageUrl) ? (
            <div className="book-illustration">
              <StorySceneImage src={scene.imageUrl!} alt={scene.title} width={1024} height={1024} />
            </div>
          ) : (
            <div className="book-illustration book-illustration-waiting">
              <BookOpen size={80} strokeWidth={1.2} />
            </div>
          )}
          <div className="book-speech-bubble">
            <p>{bubbleText}</p>
            <span className="book-speech-heart">♥</span>
          </div>
        </div>
      </div>

      <div className="book-spine" aria-hidden="true" />

      <div className="book-page book-page-right">
        <div className="book-page-inner book-text-content">
          {scene.lines.map((line, idx) => (
            <p
              key={`${scene.id}-${idx}`}
              className={`book-line ${activeLine === line ? "book-line-active" : ""}`}
            >
              {line.speakerId === "narrator" ? (
                line.text
              ) : (
                <>
                  &ldquo;{line.text}&rdquo;{" "}
                  <span className="book-line-speaker">{line.speakerName} said.</span>
                </>
              )}
            </p>
          ))}
          <span className="book-page-heart" aria-hidden="true">
            ♡
          </span>
        </div>
        <span className="book-page-sun" aria-hidden="true">
          ☀
        </span>
      </div>
    </section>
  );
}
