import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock, Home, Mic, Sparkles, Star } from "lucide-react";
import { StoryAudioPlayer } from "@/components/story-audio-player";
import type { StorySession } from "@/lib/story-schema";

type StorybookViewProps = {
  session: StorySession;
};

export function StorybookView({ session }: StorybookViewProps) {
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
          <h1>{session.storyBible.protagonist}&apos;s Story</h1>
          <p>Your magical library story for {session.childProfile.name}.</p>
          <div className="library-meta">
            <span>
              <Clock size={18} /> 4 min
            </span>
            <span>
              <BookOpen size={18} /> {session.scenes.length} pages
            </span>
            <span>
              <Sparkles size={18} /> AI narrated
            </span>
          </div>
          <StoryAudioPlayer session={session} />
        </header>

        <section className="storybook-grid">
          {session.scenes.map((scene, index) => (
            <article className="storybook-scene" key={scene.id}>
              <div className="scene-cover">
                {scene.imageUrl ? (
                  <Image
                    src={scene.imageUrl}
                    alt={scene.title}
                    width={1024}
                    height={1024}
                    unoptimized
                  />
                ) : (
                  <div className="scene-art scene-art-waiting">
                    <BookOpen size={86} strokeWidth={1.4} />
                  </div>
                )}
                <span>
                  <Star size={16} fill="currentColor" /> Page {index + 1}
                </span>
              </div>
              <div>
                <h2>{scene.title}</h2>
                {scene.lines.map((line, index) => (
                  <p key={`${scene.id}-${line.speakerId}-${index}`}>
                    <strong>{line.speakerName}:</strong> {line.text}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>

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
            this book
          </a>
        </nav>
      </div>
    </main>
  );
}
