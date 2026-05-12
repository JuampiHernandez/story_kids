"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Home, Sparkles, Star } from "lucide-react";
import { StorypopLogo } from "@/components/storypop-logo";
import { StoryAudioPlayer } from "@/components/story-audio-player";
import { StorySceneImage } from "@/components/story-scene-image";
import { hasGeneratedStoryImageUrl } from "@/lib/story-image-utils";
import type { StorySession } from "@/lib/story-schema";

type StorybookViewProps = {
  session: StorySession;
};

export function StorybookView({ session }: StorybookViewProps) {
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const sceneRefs = useRef<Map<string, HTMLElement>>(new Map());
  return (
    <main className="storybook-view">
      <div className="storybook-shell app-screen library-screen">
        <span className="sky cloud cloud-one" />
        <span className="sky cloud cloud-two" />
        <header className="app-topbar library-topbar-balanced">
          <Link className="library-screen-back" href="/stories" aria-label="Back to story library">
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
          <h1>{session.storyBible.protagonist}&apos;s Story</h1>
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
          <StoryAudioPlayer 
            session={session} 
            onSceneChange={(sceneId) => {
              setActiveSceneId(sceneId);
              if (sceneId) {
                const element = sceneRefs.current.get(sceneId);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }}
          />
        </header>

        <section className="storybook-grid">
          {session.scenes.map((scene, index) => (
            <article 
              className={`storybook-scene ${activeSceneId === scene.id ? 'active' : ''}`} 
              key={scene.id}
              ref={(el) => {
                if (el) {
                  sceneRefs.current.set(scene.id, el);
                } else {
                  sceneRefs.current.delete(scene.id);
                }
              }}
            >
              <div className="scene-cover">
                {hasGeneratedStoryImageUrl(scene.imageUrl) ? (
                  <StorySceneImage
                    src={scene.imageUrl}
                    alt={scene.title}
                    width={1024}
                    height={1024}
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
                {scene.lines.map((line, lineIndex) => (
                  <p key={`${scene.id}-${line.speakerId}-${lineIndex}`}>
                    <strong>{line.speakerName}:</strong> {line.text}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>

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
