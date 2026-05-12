"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { StorypopLogo } from "@/components/storypop-logo";
import { StorageSetupButton } from "@/components/storage-setup-button";
import {
  DEFAULT_STORY_SETTINGS,
  loadStorySettings,
  saveStorySettings,
  type StoryParentSettings,
} from "@/lib/story-settings";

const FACE_IMAGE_SIZE = 512;

async function resizeFaceImage(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = rawDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = FACE_IMAGE_SIZE;
  canvas.height = FACE_IMAGE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the image.");

  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - side) / 2;
  const sourceY = (image.naturalHeight - side) / 2;
  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, FACE_IMAGE_SIZE, FACE_IMAGE_SIZE);

  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoryParentSettings>(DEFAULT_STORY_SETTINGS);
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploadError, setUploadError] = useState("");

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

  const handleFaceUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a photo file.");
      return;
    }

    try {
      const childFaceDataUrl = await resizeFaceImage(file);
      update("childFaceDataUrl", childFaceDataUrl);
      update("useChildAsProtagonist", true);
      setUploadError("");
    } catch {
      setUploadError("That photo could not be saved. Try a different image.");
    }
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
          <Link className="settings-back" href="/play">
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
              <label className="settings-checkbox-row">
                <input
                  type="checkbox"
                  checked={settings.useChildAsProtagonist}
                  onChange={(event) => update("useChildAsProtagonist", event.target.checked)}
                />
                <span>
                  <strong>Make my kid the main character</strong>
                  <small>
                    Stories will still invent magical friends and side characters, but the hero will be{" "}
                    {settings.childName.trim() || "your child"}.
                  </small>
                </span>
              </label>
              <div className="settings-face-upload">
                <div
                  className="settings-face-preview"
                  style={
                    settings.childFaceDataUrl
                      ? { backgroundImage: `url("${settings.childFaceDataUrl}")` }
                      : undefined
                  }
                  aria-hidden="true"
                >
                  {settings.childFaceDataUrl ? null : "face"}
                </div>
                <div>
                  <label className="settings-upload-button">
                    Upload face photo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => void handleFaceUpload(event.target.files?.[0])}
                    />
                  </label>
                  {settings.childFaceDataUrl ? (
                    <button
                      className="settings-text-button"
                      type="button"
                      onClick={() => update("childFaceDataUrl", undefined)}
                    >
                      Remove photo
                    </button>
                  ) : null}
                  <p className="settings-hint">
                    Used only when the main-character option is on, so illustrations can keep the hero&apos;s face consistent.
                  </p>
                  {uploadError ? <strong className="settings-error">{uploadError}</strong> : null}
                </div>
              </div>
            </fieldset>

            <fieldset className="settings-fieldset">
              <legend>Pictures</legend>
              <p className="settings-hint">
                Pick the art direction for every illustration. Watercolor matches the classic Storypop look; the Pixar style swaps in a cinematic 3D animated render.
              </p>
              <div className="settings-segmented" role="group" aria-label="AI image style">
                {(
                  [
                    [
                      "watercolor",
                      "Storybook watercolor",
                      "Soft painterly look · default",
                    ],
                    [
                      "disney-pixar",
                      "Disney / Pixar 3D animation",
                      "Max quality, slower",
                    ],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label key={value} className="settings-radio-tile">
                    <input
                      type="radio"
                      name="imageStyle"
                      checked={settings.imageStyle === value}
                      onChange={() => update("imageStyle", value)}
                    />
                    <span className="settings-radio-tile-body">
                      <strong>{label}</strong>
                      <span>{hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              <p className="settings-hint">
                {settings.imageStyle === "disney-pixar"
                  ? "Pixar style always renders at the highest quality (gpt-image-1 · 1024×1024 · high)."
                  : "Higher quality uses more detail (and API cost). What changes depends on your image model in production."}
              </p>
              <div
                className="settings-segmented"
                role="group"
                aria-label="Image quality"
                aria-disabled={settings.imageStyle === "disney-pixar" || undefined}
                style={
                  settings.imageStyle === "disney-pixar"
                    ? { opacity: 0.55, pointerEvents: "none" }
                    : undefined
                }
              >
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
                      disabled={settings.imageStyle === "disney-pixar"}
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
          
          <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>Storage Setup</h3>
            <p style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
              Initialize Supabase Storage buckets for storing story images and audio files.
            </p>
            <StorageSetupButton />
          </div>
        </div>
      </div>
    </main>
  );
}
