"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Mic, Sparkles } from "lucide-react";
import { StorySceneImage } from "@/components/story-scene-image";
import { getStoriesFromBrowser } from "@/lib/story-storage";
import { hasGeneratedStoryImageUrl } from "@/lib/story-image-utils";
import { migrateBrowserStorageStories } from "@/lib/story-migration";
import type { StorySession } from "@/lib/story-schema";

interface BrowserStoriesLoaderProps {
  serverStories: StorySession[];
}

export function BrowserStoriesLoader({ serverStories }: BrowserStoriesLoaderProps) {
  const [allStories, setAllStories] = useState<StorySession[]>(serverStories);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Run migration first to ensure compatibility
    migrateBrowserStorageStories();
    
    // Load stories from browser storage on client side
    const browserStories = getStoriesFromBrowser();
    
    // Combine server stories with browser stories, removing duplicates
    const storiesById = new Map<string, StorySession>();
    
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
      {allStories.map((story) => {
        const coverScene =
          story.scenes.find(
            (scene) => hasGeneratedStoryImageUrl(scene.imageUrl),
          ) || story.scenes[0];
        const coverUrl = hasGeneratedStoryImageUrl(coverScene?.imageUrl) ? coverScene.imageUrl : undefined;

        return (
          <Link className="story-library-card" href={`/story/${story.id}`} key={story.id}>
            <div className="scene-cover">
              {coverUrl ? (
                <StorySceneImage
                  src={coverUrl}
                  alt={coverScene!.title}
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
              <h2>{story.storyBible.protagonist}&apos;s Story</h2>
              <p>{story.storyBible.premise}</p>
              <div className="library-meta">
                <span>
                  <Clock size={16} /> 4 min
                </span>
                <span>
                  <BookOpen size={16} /> {story.scenes.length} pages
                </span>
              </div>
            </div>
          </Link>
        );
      })}
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