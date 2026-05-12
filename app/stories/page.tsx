import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Home, Mic, Sparkles } from "lucide-react";
import { StorypopLogo } from "@/components/storypop-logo";
import { StorySceneImage } from "@/components/story-scene-image";
import { memoryStories } from "@/lib/memory-store";
import { hasGeneratedStoryImageUrl } from "@/lib/story-image-utils";
import { listStorySessions } from "@/lib/supabase";
import { BrowserStoriesLoader } from "@/components/browser-stories-loader";

export default async function StoriesPage() {
  const persistedStories = await listStorySessions();
  const storiesById = new Map(persistedStories.map((story) => [story.id, story]));

  memoryStories.forEach((story) => {
    storiesById.set(story.id, story);
  });

  const stories = Array.from(storiesById.values()).sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );

  return (
    <main className="storybook-view">
      <div className="storybook-shell app-screen library-screen">
        <span className="sky cloud cloud-one" />
        <span className="sky cloud cloud-two" />
        <header className="app-topbar library-topbar-balanced">
          <Link className="library-screen-back" href="/play" aria-label="Back to play">
            <ArrowLeft size={22} strokeWidth={2.4} />
            Back
          </Link>
          <Link className="brand-lockup" href="/" aria-label="Storypop home">
            <StorypopLogo className="storypop-logo" />
          </Link>
          <span className="library-topbar-tail" aria-hidden />
        </header>

        <header className="storybook-header">
          <p className="eyebrow">my books</p>
          <h1>Story Library</h1>
          <p>Open a saved story and play it again whenever you want.</p>
        </header>

        {/* Client-side component to handle browser storage */}
        <BrowserStoriesLoader serverStories={stories} />

        <nav className="bottom-nav" aria-label="Primary">
          <Link href="/play">
            <Home size={27} fill="currentColor" />
            home
          </Link>
          <a className="active" href="#top" aria-current="page">
            <BookOpen size={27} fill="currentColor" />
            storybook
          </a>
        </nav>
      </div>
    </main>
  );
}
