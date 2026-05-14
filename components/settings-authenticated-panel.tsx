"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, LogOut } from "lucide-react";
import {
  DEFAULT_STORY_SETTINGS,
  loadStorySettings,
  saveStorySettings,
  type StoryParentSettings,
} from "@/lib/story-settings";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-browser";

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

type Props = {
  userEmail: string | undefined;
};

export function SettingsAuthenticatedPanel({ userEmail }: Props) {
  const [settings, setSettings] = useState<StoryParentSettings>(DEFAULT_STORY_SETTINGS);
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSettings(loadStorySettings()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/profile")
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ is_premium: boolean; story_settings: StoryParentSettings }>;
      })
      .then((data) => {
        if (cancelled || !data?.story_settings) return;
        const merged: StoryParentSettings = {
          ...DEFAULT_STORY_SETTINGS,
          ...loadStorySettings(),
          ...data.story_settings,
        };
        setIsPremium(Boolean(data.is_premium));
        setSettings(merged);
        saveStorySettings(merged);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof StoryParentSettings>(key: K, value: StoryParentSettings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const commit = async () => {
    saveStorySettings(settings);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ story_settings: settings }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { story_settings?: StoryParentSettings; error?: string }
        | null;
      if (!response.ok) {
        if (typeof window !== "undefined" && payload?.error) {
          console.warn("profile sync skipped:", payload.error);
        }
      } else if (payload?.story_settings) {
        setSettings(payload.story_settings);
        saveStorySettings(payload.story_settings);
      }
    } catch {
      console.warn("profile sync failed");
    }
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

  const signOut = async () => {
    const sb = createSupabaseBrowserClient();
    await sb?.auth.signOut();
    window.location.href = "/play";
  };

  return (
    <div className="settings-layout settings-layout-signed-in">
      <div className="settings-sidebar-column">
        <Link className="settings-back" href="/play">
          <ArrowLeft size={20} strokeWidth={2.4} />
          Back to play
        </Link>

        <div className="settings-sidebar">
          <header className="settings-header-block">
            <p className="eyebrow">for parents</p>
            <h1>Story settings</h1>
            {userEmail ? (
              <p className="settings-signed-email">
                Signed in as <strong>{userEmail}</strong>
                {isPremium ? (
                  <>
                    {" "}
                    · <span className="settings-premium-pill">Premium storyteller</span>
                  </>
                ) : null}
              </p>
            ) : null}
          </header>

          <aside className="settings-account-card">
            <button className="settings-sign-out-button" type="button" onClick={() => void signOut()}>
              <LogOut size={18} strokeWidth={2.2} aria-hidden />
              Sign out
            </button>
          </aside>
        </div>
      </div>

      <form
        className="settings-form"
        onSubmit={(event) => {
          event.preventDefault();
          void commit();
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
                Saved to your Storypop profile so illustrations can keep the hero&apos;s face consistent on every device you sign into.
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
          {!isPremium ? (
            <aside className="settings-quote-card" aria-label="About premium illustration options">
              <p>
                Pixar-style scenes and full High quality controls unlock for premium storytellers (ElevenLabs, Cursor team emails, or invited accounts).
              </p>
            </aside>
          ) : null}
          <div className="settings-segmented" role="group" aria-label="AI image style">
            {(
              [
                ["watercolor", "Storybook watercolor", "Soft painterly look · default"],
                ["disney-pixar", "Disney / Pixar 3D animation", "Max quality · premium"],
              ] as const
            ).map(([value, label, hint]) => {
              const lockedPremiumStyle = !isPremium && value === "disney-pixar";
              return (
                <label
                  key={value}
                  className={`settings-radio-tile ${lockedPremiumStyle ? "settings-radio-tile-muted settings-radio-tile-premium-gated" : ""}`}
                >
                  <input
                    type="radio"
                    name="imageStyle"
                    checked={settings.imageStyle === value}
                    disabled={lockedPremiumStyle}
                    onChange={() => update("imageStyle", value)}
                  />
                  {lockedPremiumStyle ? (
                    <span className="settings-premium-lock-badge">
                      <Lock size={13} strokeWidth={2.6} aria-hidden />
                      Premium only
                    </span>
                  ) : null}
                  <span className="settings-radio-tile-body">
                    <strong>{label}</strong>
                    <span>{hint}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <p className="settings-hint">
            {settings.imageStyle === "disney-pixar"
              ? "Pixar style uses Gemini via Vercel AI Gateway (high visual quality; OpenAI backup is off unless you enable OPENAI_PIXAR_FALLBACK_ENABLED)."
              : "Higher quality uses more detail (and API cost). Medium is the standard for everyone—we removed the old “Low” tier because it was unreliable with current image models."}
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
                ["medium", "Medium", "Standard · default"],
                ["high", "High", "Sharpest"],
              ] as const
            ).map(([value, label, hint]) => {
              const lockedPremiumQuality = !isPremium && value === "high";
              const disabledQuality =
                settings.imageStyle === "disney-pixar" || lockedPremiumQuality;
              return (
                <label
                  key={value}
                  className={`settings-radio-tile ${lockedPremiumQuality ? "settings-radio-tile-muted settings-radio-tile-premium-gated" : ""}`}
                >
                  <input
                    type="radio"
                    name="imageQualityTier"
                    checked={settings.imageQualityTier === value}
                    disabled={disabledQuality}
                    onChange={() => update("imageQualityTier", value)}
                  />
                  {lockedPremiumQuality ? (
                    <span className="settings-premium-lock-badge">
                      <Lock size={13} strokeWidth={2.6} aria-hidden />
                      Premium only
                    </span>
                  ) : null}
                  <span className="settings-radio-tile-body">
                    <strong>{label}</strong>
                    <span>{hint}</span>
                  </span>
                </label>
              );
            })}
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
          <p className="settings-hint">
            Used when the browser listens for your child&apos;s idea (not all locales work on every device).
          </p>
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
  );
}
