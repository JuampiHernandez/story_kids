import Link from "next/link";
import { BookOpen, Clock, Home, Mic, Sparkles } from "lucide-react";
import { StorypopLogo } from "@/components/storypop-logo";
import { StorySceneImage } from "@/components/story-scene-image";
import { memoryStories } from "@/lib/memory-store";
import { hasGeneratedStoryImageUrl } from "@/lib/story-image-utils";
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
            <StorypopLogo className="storypop-logo" />
          </Link>
        </header>

        <header className="storybook-header">
          <p className="eyebrow">my books</p>
          <h1>Story Library</h1>
          <p>Open a saved story and play it again whenever you want.</p>
        </header>

        {stories.length ? (
          <section className="story-library-grid">
            {stories.map((story) => {
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
          <a className="active" href="#top" aria-current="page">
            <BookOpen size={27} fill="currentColor" />
            storybook
          </a>
        </nav>
      </div>
    </main>
  );
}
