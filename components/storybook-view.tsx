"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  Home,
  Settings,
} from "lucide-react";
import { AudioGeneratorButton } from "@/components/audio-generator-button";
import { StoryAudioPlayer, type StoryAudioPlayerHandle } from "@/components/story-audio-player";
import { StorybookSpread } from "@/components/storybook-spread";
import { storyHasFullStoredAudio } from "@/lib/story-completeness";
import type { NarrationLine, StorySession } from "@/lib/story-schema";

type StorybookViewProps = {
  session: StorySession;
};

export function StorybookView({ session }: StorybookViewProps) {
  const router = useRouter();
  const audioPlayerRef = useRef<StoryAudioPlayerHandle | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeLine, setActiveLine] = useState<NarrationLine | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const currentScene = session.scenes[currentPageIndex] || session.scenes[0];
  const totalPages = session.scenes.length;

  const goToPage = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalPages) {
        setCurrentPageIndex(index);
      }
    },
    [totalPages],
  );

  const handleSceneChange = useCallback(
    (sceneId: string | null) => {
      if (sceneId) {
        const idx = session.scenes.findIndex((s) => s.id === sceneId);
        if (idx >= 0) setCurrentPageIndex(idx);
      }
    },
    [session.scenes],
  );

  return (
    <main className="book-view">
      <div className="book-decorations" aria-hidden="true">
        <span className="book-flower book-flower-tl" />
        <span className="book-flower book-flower-tr" />
        <span className="book-flower book-flower-bl" />
        <span className="book-flower book-flower-br" />
        <span className="book-leaf book-leaf-l" />
        <span className="book-leaf book-leaf-r" />
      </div>

      <header className="book-topbar">
        <div className="book-topbar-left">
          <Link href="/stories" className="book-back-btn" aria-label="Back to stories">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </Link>
          <div className="book-character-badge">
            <span className="book-character-avatar">
              {(session.storyBible.protagonist || "S").charAt(0).toUpperCase()}
            </span>
            <span className="book-character-name">{session.storyBible.protagonist}</span>
          </div>
        </div>

        <div className="book-topbar-center">
          <h1 className="book-title">{currentScene?.title || "Story"}</h1>
          <p className="book-page-indicator">
            <span className="book-star">★</span> Page {currentPageIndex + 1} of {totalPages}{" "}
            <span className="book-star">★</span>
          </p>
        </div>

        <div className="book-topbar-right">
          <Link href="/settings" className="book-settings-btn" aria-label="Parent settings">
            <Settings size={20} strokeWidth={2.4} />
          </Link>
          {!storyHasFullStoredAudio(session) ? (
            <AudioGeneratorButton
              storyId={session.id}
              session={session}
              onComplete={() => {
                router.refresh();
              }}
            />
          ) : null}
          <StoryAudioPlayer
            ref={audioPlayerRef}
            session={session}
            onSceneChange={handleSceneChange}
            onLineChange={(payload) => setActiveLine(payload?.line ?? null)}
            onPlaybackChange={() => {}}
          />
        </div>
      </header>

      <StorybookSpread
        scene={currentScene}
        activeLine={activeLine}
        favoriteActive={isFavorite}
        onFavoriteClick={() => setIsFavorite(!isFavorite)}
      />

      <nav className="book-bottom-nav" aria-label="Story navigation">
        <button
          type="button"
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
          type="button"
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
