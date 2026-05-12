"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { StorypopLogo } from "@/components/storypop-logo";
import {
  DEFAULT_STORY_SETTINGS,
  loadStorySettings,
  saveStorySettings,
  type StoryParentSettings,
} from "@/lib/story-settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoryParentSettings>(DEFAULT_STORY_SETTINGS);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSettings(loadStorySettings()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const update = <K extends keyof StoryParentSettings>(key: K, value: StoryParentSettings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const commit = () => {
    saveStorySettings(settings);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <main className="storybook-view settings-screen">
      <div className="storybook-shell app-screen library-screen settings-shell">
        <span className="sky cloud cloud-one" />
        <span className="sky cloud cloud-two" />

        <header className="app-topbar">
          <Link className="brand-lockup" href="/" aria-label="Storypop home">
            <StorypopLogo className="storypop-logo" />
          </Link>
          <span className="settings-top-spacer" aria-hidden />
        </header>

        <div className="settings-layout">
          <Link className="settings-back" href="/">
            <ArrowLeft size={20} strokeWidth={2.4} />
            Back to play
          </Link>

          <header className="settings-header-block">
            <p className="eyebrow">for parents</p>
            <h1>Story settings</h1>
          </header>

          <form
            className="settings-form"
            onSubmit={(event) => {
              event.preventDefault();
              commit();
            }}
          >
            <fieldset className="settings-fieldset">
              <legend>Child</legend>
              <label className="settings-label">
                Name (used in greetings and in the story)
                <input
                  className="settings-input"
                  autoComplete="nickname"
                  maxLength={48}
                  value={settings.childName}
                  onChange={(event) => update("childName", event.target.value)}
                />
              </label>
              <label className="settings-label">
                Reading age
                <select
                  className="settings-input"
                  value={settings.childAgeRange}
                  onChange={(event) =>
                    update("childAgeRange", event.target.value as StoryParentSettings["childAgeRange"])
                  }
                >
                  <option value="2-3">2–3 · shortest sentences</option>
                  <option value="4-5">4–5 · playful default</option>
                  <option value="6-7">6–7 · richer twists</option>
                </select>
              </label>
            </fieldset>

            <fieldset className="settings-fieldset">
              <legend>Pictures</legend>
              <p className="settings-hint">
                Higher quality uses more detail (and API cost). What changes depends on your image model in production.
              </p>
              <div className="settings-segmented" role="group" aria-label="Image quality">
                {(
                  [
                    ["low", "Low", "Fastest, lightest"],
                    ["medium", "Medium", "Balanced"],
                    ["high", "High", "Sharpest"],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label key={value} className="settings-radio-tile">
                    <input
                      type="radio"
                      name="imageQualityTier"
                      checked={settings.imageQualityTier === value}
                      onChange={() => update("imageQualityTier", value)}
                    />
                    <span className="settings-radio-tile-body">
                      <strong>{label}</strong>
                      <span>{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="settings-fieldset">
              <legend>Story mood</legend>
              <label className="settings-label">
                Energy
                <select
                  className="settings-input"
                  value={settings.storyEnergy}
                  onChange={(event) =>
                    update("storyEnergy", event.target.value as StoryParentSettings["storyEnergy"])
                  }
                >
                  <option value="calm">Calm · wind-down friendly</option>
                  <option value="balanced">Balanced</option>
                  <option value="silly">Silly · extra giggles</option>
                </select>
              </label>
            </fieldset>

            <fieldset className="settings-fieldset">
              <legend>Microphone language</legend>
              <p className="settings-hint">Used when the browser listens for your child&apos;s idea (not all locales work on every device).</p>
              <label className="settings-label">
                Speech recognition locale
                <select
                  className="settings-input"
                  value={settings.speechLocale}
                  onChange={(event) => update("speechLocale", event.target.value)}
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Español (España)</option>
                  <option value="es-MX">Español (México)</option>
                  <option value="fr-FR">Français</option>
                  <option value="de-DE">Deutsch</option>
                  <option value="pt-BR">Português (Brasil)</option>
                </select>
              </label>
            </fieldset>

            <div className="settings-actions">
              <button className="settings-save" type="submit">
                Save settings
              </button>
              {savedFlash ? <span className="settings-saved">Saved!</span> : null}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
