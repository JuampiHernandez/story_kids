"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Mic, Sparkles } from "lucide-react";
import { StorySceneImage } from "@/components/story-scene-image";
import { getStoriesFromBrowser } from "@/lib/story-storage";
import { type StoryLibraryCard, storySessionToLibraryCard } from "@/lib/story-library";
import { migrateBrowserStorageStories } from "@/lib/story-migration";

interface BrowserStoriesLoaderProps {
  serverStories: StoryLibraryCard[];
}

export function BrowserStoriesLoader({ serverStories }: BrowserStoriesLoaderProps) {
  const [allStories, setAllStories] = useState<StoryLibraryCard[]>(serverStories);
  const [isLoading, setIsLoading] = useState(serverStories.length === 0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      // Run migration first to ensure compatibility
      migrateBrowserStorageStories();
      
      // Load stories from browser storage on client side
      const browserStories = getStoriesFromBrowser().map(storySessionToLibraryCard);
      
      // Combine server stories with browser stories, removing duplicates
      const storiesById = new Map<string, StoryLibraryCard>();
      
      // Add server stories first
      serverStories.forEach(story => {
        storiesById.set(story.id, story);
      });
      
      // Add browser stories, which will override server stories if they're newer
      browserStories.forEach(story => {
        const existing = storiesById.get(story.id);
        if (!existing || Date.parse(story.updatedAt) > Date.parse(existing.updatedAt)) {
          storiesById.set(story.id, story);
        }
      });
      
      const combinedStories = Array.from(storiesById.values()).sort(
        (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      );
      
      setAllStories(combinedStories);
      setIsLoading(false);
      
      console.log('Combined stories:', combinedStories.length, 'total');
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [serverStories]);

  if (isLoading) {
    return (
      <section className="empty-library">
        <BookOpen size={58} />
        <h2>Loading stories...</h2>
      </section>
    );
  }

  return allStories.length > 0 ? (
    <section className="story-library-grid">
      {allStories.map((story) => (
          <Link className="story-library-card" href={`/story/${story.id}`} key={story.id}>
            <div className="scene-cover">
              {story.coverImageUrl ? (
                <StorySceneImage
                  src={story.coverImageUrl}
                  alt={story.coverTitle}
                  width={512}
                  height={512}
                />
              ) : (
                <div className="scene-art scene-art-waiting">
                  <BookOpen size={72} strokeWidth={1.4} />
                </div>
              )}
              <span>
                <Sparkles size={16} /> play again
              </span>
            </div>
            <div>
              <h2>{story.title}</h2>
              <p>{story.premise}</p>
              <div className="library-meta">
                <span>
                  <Clock size={16} /> 4 min
                </span>
                <span>
                  <BookOpen size={16} /> {story.pageCount} pages
                </span>
              </div>
            </div>
          </Link>
        ))}
    </section>
  ) : (
    <section className="empty-library">
      <BookOpen size={58} />
      <h2>No saved stories yet</h2>
      <p>Start a story first, then it will show up here.</p>
      <Link href="/play">
        <Mic size={20} />
        start
      </Link>
    </section>
  );
}