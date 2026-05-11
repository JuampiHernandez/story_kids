import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock, Home, Mic, Sparkles, Star } from "lucide-react";
import { memoryStories } from "@/lib/memory-store";
import { listStorySessions } from "@/lib/supabase";

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
        <header className="app-topbar">
          <Link className="brand-lockup" href="/" aria-label="Storypop home">
            <div className="mascot-book">
              <BookOpen size={24} strokeWidth={2.4} />
              <span />
            </div>
            <span className="brand-text" aria-hidden="true">
              <span>s</span>
              <span>t</span>
              <span>o</span>
              <span>r</span>
              <span>y</span>
              <span>p</span>
              <span>o</span>
              <span>p</span>
            </span>
          </Link>
          <span className="star-button" aria-hidden="true">
            <Star size={24} fill="currentColor" />
          </span>
        </header>

        <header className="storybook-header">
          <p className="eyebrow">my books</p>
          <h1>Story Library</h1>
          <p>Open a saved story and play it again whenever you want.</p>
        </header>

        {stories.length ? (
          <section className="story-library-grid">
            {stories.map((story) => {
              const coverScene = story.scenes.find((scene) => scene.imageUrl) || story.scenes[0];

              return (
                <Link className="story-library-card" href={`/story/${story.id}`} key={story.id}>
                  <div className="scene-cover">
                    {coverScene?.imageUrl ? (
                      <Image
                        src={coverScene.imageUrl}
                        alt={coverScene.title}
                        width={512}
                        height={512}
                        unoptimized
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
            <Link href="/">
              <Mic size={20} />
              start
            </Link>
          </section>
        )}

        <nav className="bottom-nav" aria-label="Primary">
          <Link href="/">
            <Home size={27} fill="currentColor" />
            home
          </Link>
          <Link href="/">
            <Mic size={27} />
            new story
          </Link>
          <a className="active" href="#top" aria-current="page">
            <BookOpen size={27} fill="currentColor" />
            books
          </a>
        </nav>
      </div>
    </main>
  );
}
