import { z } from "zod";

export const STORY_SETTINGS_STORAGE_KEY = "storypop-parent-settings-v1";

export const STORY_SETTINGS_CHANGED_EVENT = "storypop-settings-changed";

export const storyParentSettingsSchema = z.object({
  childName: z.string().min(1).max(48).trim(),
  imageQualityTier: z.enum(["low", "medium", "high"]),
  childAgeRange: z.enum(["2-3", "4-5", "6-7"]),
  speechLocale: z.string().min(2).max(24),
  storyEnergy: z.enum(["calm", "balanced", "silly"]),
});

export type StoryParentSettings = z.infer<typeof storyParentSettingsSchema>;

export const DEFAULT_STORY_SETTINGS: StoryParentSettings = {
  childName: "Luna",
  imageQualityTier: "medium",
  childAgeRange: "4-5",
  speechLocale: "en-US",
  storyEnergy: "balanced",
};

export function loadStorySettings(): StoryParentSettings {
  if (typeof window === "undefined") {
    return DEFAULT_STORY_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORY_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_STORY_SETTINGS;
    const parsedJson = JSON.parse(raw) as unknown;
    const parsed = storyParentSettingsSchema.safeParse(parsedJson);
    return parsed.success ? parsed.data : DEFAULT_STORY_SETTINGS;
  } catch {
    return DEFAULT_STORY_SETTINGS;
  }
}

export function saveStorySettings(settings: StoryParentSettings): void {
  if (typeof window === "undefined") return;
  const parsed = storyParentSettingsSchema.safeParse({
    ...settings,
    childName: settings.childName.trim() || DEFAULT_STORY_SETTINGS.childName,
  });
  const next = parsed.success ? parsed.data : DEFAULT_STORY_SETTINGS;
  window.localStorage.setItem(STORY_SETTINGS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(STORY_SETTINGS_CHANGED_EVENT));
}
