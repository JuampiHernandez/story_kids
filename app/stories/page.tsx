import Link from "next/link";
import { ArrowLeft, BookOpen, Home, Settings } from "lucide-react";
import { StorypopLogo } from "@/components/storypop-logo";
import { BrowserStoriesLoader } from "@/components/browser-stories-loader";

export default function StoriesPage() {
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
          <Link className="library-settings-btn" href="/settings" aria-label="Parent settings">
            <Settings size={22} strokeWidth={2.4} />
          </Link>
        </header>

        <BrowserStoriesLoader />

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
