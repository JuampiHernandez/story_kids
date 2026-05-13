"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  Home,
} from "lucide-react";
import { StoryAudioPlayer } from "@/components/story-audio-player";
import { StorySceneImage } from "@/components/story-scene-image";
import { hasGeneratedStoryImageUrl } from "@/lib/story-image-utils";
import type { NarrationLine, StorySession } from "@/lib/story-schema";

type StorybookViewProps = {
  session: StorySession;
};

export function StorybookView({ session }: StorybookViewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeLine, setActiveLine] = useState<NarrationLine | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const currentScene = session.scenes[currentPageIndex] || session.scenes[0];
  const totalPages = session.scenes.length;

  const goToPage = useCallback((index: number) => {
    if (index >= 0 && index < totalPages) {
      setCurrentPageIndex(index);
    }
  }, [totalPages]);

  const handleSceneChange = useCallback((sceneId: string | null) => {
    if (sceneId) {
      const idx = session.scenes.findIndex((s) => s.id === sceneId);
      if (idx >= 0) setCurrentPageIndex(idx);
    }
  }, [session.scenes]);

  return (
    <main className="book-view">
      {/* Decorative floral elements */}
      <div className="book-decorations" aria-hidden="true">
        <span className="book-flower book-flower-tl" />
        <span className="book-flower book-flower-tr" />
        <span className="book-flower book-flower-bl" />
        <span className="book-flower book-flower-br" />
        <span className="book-leaf book-leaf-l" />
        <span className="book-leaf book-leaf-r" />
      </div>

      {/* Top bar */}
      <header className="book-topbar">
        <div className="book-topbar-left">
          <Link href="/stories" className="book-back-btn" aria-label="Back to stories">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </Link>
          <div className="book-character-badge">
            <span className="book-character-avatar">
              {(session.storyBible.protagonist || "S").charAt(0).toUpperCase()}
            </span>
            <span className="book-character-name">
              {session.storyBible.protagonist}
            </span>
          </div>
        </div>

        <div className="book-topbar-center">
          <h1 className="book-title">{currentScene?.title || "Story"}</h1>
          <p className="book-page-indicator">
            <span className="book-star">★</span> Page {currentPageIndex + 1} of {totalPages} <span className="book-star">★</span>
          </p>
        </div>

        <div className="book-topbar-right">
          <StoryAudioPlayer
            session={session}
            onSceneChange={handleSceneChange}
            onLineChange={(line) => setActiveLine(line?.line || null)}
            onPlaybackChange={() => {}}
          />
        </div>
      </header>

      {/* Book spread */}
      <section className="book-spread">
        {/* Favorite button */}
        <button
          className={`book-favorite-btn ${isFavorite ? "active" : ""}`}
          onClick={() => setIsFavorite(!isFavorite)}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          ★
        </button>

        {/* Left page - Illustration */}
        <div className="book-page book-page-left">
          <div className="book-page-inner">
            {hasGeneratedStoryImageUrl(currentScene?.imageUrl) ? (
              <div className="book-illustration">
                <StorySceneImage
                  src={currentScene.imageUrl!}
                  alt={currentScene.title}
                  width={1024}
                  height={1024}
                />
              </div>
            ) : (
              <div className="book-illustration book-illustration-waiting">
                <BookOpen size={80} strokeWidth={1.2} />
              </div>
            )}
            {/* Speech bubble overlay */}
            <div className="book-speech-bubble">
              <p>
                {activeLine
                  ? activeLine.text
                  : currentScene?.summary || ""}
              </p>
              <span className="book-speech-heart">♥</span>
            </div>
          </div>
        </div>

        {/* Book spine */}
        <div className="book-spine" aria-hidden="true" />

        {/* Right page - Text */}
        <div className="book-page book-page-right">
          <div className="book-page-inner book-text-content">
            {currentScene?.lines.map((line, idx) => (
              <p
                key={`${currentScene.id}-${idx}`}
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
            <span className="book-page-heart" aria-hidden="true">♡</span>
          </div>
          {/* Page corner decoration */}
          <span className="book-page-sun" aria-hidden="true">☀</span>
        </div>
      </section>

      {/* Bottom navigation */}
      <nav className="book-bottom-nav" aria-label="Story navigation">
        <button
          className="book-nav-btn"
          onClick={() => goToPage(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
        >
          <ArrowLeft size={18} />
          <span>Previous</span>
        </button>

        <Link href="/play" className="book-nav-btn">
          <Home size={20} />
          <span>Home</span>
        </Link>

        <Link href="/stories" className="book-nav-btn book-nav-active">
          <BookOpen size={20} fill="currentColor" />
          <span>Storybook</span>
        </Link>

        <button
          className="book-nav-btn"
          onClick={() => goToPage(currentPageIndex + 1)}
          disabled={currentPageIndex >= totalPages - 1}
        >
          <span>Next</span>
          <ArrowRight size={18} />
        </button>
      </nav>
    </main>
  );
}
