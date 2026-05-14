"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Sparkles } from "lucide-react";
import { StorySceneImage } from "@/components/story-scene-image";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-browser";
import { possessiveStoryHeading } from "@/lib/story-display-title";
import {
  pickRicherPersistedStory,
  storyQualifiesForCommunityShelf,
  storyQualifiesForMyBooksShelf,
} from "@/lib/story-completeness";
import { hasGeneratedStoryImageUrl } from "@/lib/story-image-utils";
import { migrateBrowserStorageStories } from "@/lib/story-migration";
import { getStoriesFromBrowser } from "@/lib/story-storage";
import type { StorySession } from "@/lib/story-schema";

type GalleryScope = "my" | "community";

export function BrowserStoriesLoader() {
  const [scope, setScope] = useState<GalleryScope>("my");
  const [stories, setStories] = useState<StorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const mergeCommunityWithBrowser = useCallback((remote: StorySession[]) => {
    const browserStories = getStoriesFromBrowser();
    const storiesById = new Map(remote.map((story) => [story.id, story]));

    browserStories.forEach((story) => {
      const existing = storiesById.get(story.id);
      if (!existing) {
        storiesById.set(story.id, story);
        return;
      }
      storiesById.set(story.id, pickRicherPersistedStory(existing, story));
    });

    return Array.from(storiesById.values())
      .filter(storyQualifiesForCommunityShelf)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, []);

  /**
   * When signed in: enrich **server-owned** rows with the browser copy (richer media) if the same id exists locally.
   * Do not add browser-only entries — that leaked unrelated cached sessions into "my books".
   */
  const mergeMyWithBrowser = useCallback((remote: StorySession[]) => {
    const browserById = new Map(getStoriesFromBrowser().map((story) => [story.id, story]));

    return remote
      .map((story) => {
        const local = browserById.get(story.id);
        return local ? pickRicherPersistedStory(story, local) : story;
      })
      .filter(storyQualifiesForMyBooksShelf)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, []);

  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      migrateBrowserStorageStories();

      const browserStories = scope === "my" ? getStoriesFromBrowser() : [];
      const browserStoryIds = browserStories.map((s) => s.id);

      if (scope === "my" && browserStoryIds.length > 0) {
        try {
          await fetch("/api/stories/claim", {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ storyIds: browserStoryIds.slice(0, 40) }),
          });
        } catch {
          // Claim is best-effort; listing still merges browser copies.
        }
      }

      const response = await fetch(`/api/stories?scope=${scope}`, { credentials: "same-origin" });
      const payload = (await response.json()) as {
        stories?: StorySession[];
        authenticated?: boolean;
      };

      const remote = payload.stories ?? [];
      setAuthenticated(Boolean(payload.authenticated));

      if (scope === "community") {
        setStories(mergeCommunityWithBrowser(remote));
      } else if (payload.authenticated) {
        setStories(mergeMyWithBrowser(remote));
      } else {
        setStories(remote);
      }
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [mergeCommunityWithBrowser, mergeMyWithBrowser, scope]);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) void loadStories();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadStories]);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    if (!sb) return;

    const { data: sub } = sb.auth.onAuthStateChange(() => {
      void loadStories();
    });

    return () => sub.subscription.unsubscribe();
  }, [loadStories]);

  const eyebrow = scope === "my" ? "my books" : "community bookshelf";

  return (
    <>
      <header className="storybook-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1>Story Library</h1>
        <p>
          {scope === "my"
            ? "Signed‑in tales land here once they’re replayable — at least one saved illustration plus a finished script (live narration streams if you skip “Pre‑generate Audio”)."
            : "Books with saved cover art you can replay — narration streams live or uses saved clips."}
        </p>
      </header>

      <div className="library-filter-tabs" role="tablist" aria-label="Library filters">
        <button
          type="button"
          role="tab"
          aria-selected={scope === "my"}
          className={`library-filter-tab ${scope === "my" ? "library-filter-tab-active" : ""}`}
          onClick={() => setScope("my")}
        >
          My books
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "community"}
          className={`library-filter-tab ${scope === "community" ? "library-filter-tab-active" : ""}`}
          onClick={() => setScope("community")}
        >
          Community books
        </button>
      </div>

      {loading ? (
        <section className="empty-library">
          <BookOpen size={58} />
          <h2>Loading stories...</h2>
        </section>
      ) : scope === "my" && !authenticated ? (
        <section className="empty-library">
          <BookOpen size={58} />
          <h2>Sign in to fill My books</h2>
          <p>
            Without an account your creations stay in the Community shelf so anyone can enjoy them — magic links keep it fast for parents.
          </p>
          <Link href="/settings">
            <Sparkles size={18} aria-hidden />
            Parent sign-in
          </Link>
        </section>
      ) : stories.length > 0 ? (
        <section className="story-library-grid">
          {stories.map((story) => {
            const coverScene =
              story.scenes.find((scene) => hasGeneratedStoryImageUrl(scene.imageUrl)) || story.scenes[0];
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
                  <h2>{possessiveStoryHeading(story.storyBible.protagonist)}</h2>
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
          <h2>{scope === "my" ? "No saved stories yet" : "Community shelf is quiet"}</h2>
          <p>
            {scope === "my"
              ? "Create from play mode while signed in, then finish at least one page image — we hide rows whose art is still placeholders or expired preview links. Tap “Pre‑generate Audio” on a replay if you want every line cached to disk."
              : "We hide rows without at least one durable illustration (expired preview URLs count as missing). Narration usually streams automatically."}
          </p>
          <Link href="/play">
            <Sparkles size={18} aria-hidden />
            start a story
          </Link>
        </section>
      )}
    </>
  );
}
