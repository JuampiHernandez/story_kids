import Link from "next/link";
import { ArrowLeft, BookOpen, Home } from "lucide-react";
import { StorypopLogo } from "@/components/storypop-logo";
import { memoryStories } from "@/lib/memory-store";
import { storySessionToLibraryCard } from "@/lib/story-library";
import { listStoryLibraryCards } from "@/lib/supabase";
import { BrowserStoriesLoader } from "@/components/browser-stories-loader";

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  const persistedStoryCards = await listStoryLibraryCards();
  const storyCardsById = new Map(persistedStoryCards.map((story) => [story.id, story]));

  memoryStories.forEach((story) => {
    storyCardsById.set(story.id, storySessionToLibraryCard(story));
  });

  const storyCards = Array.from(storyCardsById.values()).sort(
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
        <BrowserStoriesLoader serverStories={storyCards} />

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
