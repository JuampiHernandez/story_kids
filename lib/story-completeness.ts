import type { StorySession } from "@/lib/story-schema";
import { hasGeneratedStoryImageUrl } from "@/lib/story-image-utils";

/** Non-empty persisted audio URL on every narration line (optional batch step). */
export function storyHasFullStoredAudio(session: StorySession): boolean {
  return session.scenes.every((scene) =>
    scene.lines.every((line) => typeof line.audioUrl === "string" && line.audioUrl.trim().length > 0),
  );
}

/** Every scene has durable generated art (strict — unused for community grid). */
export function storyHasFullIllustrations(session: StorySession): boolean {
  return session.scenes.length > 0 && session.scenes.every((scene) => hasGeneratedStoryImageUrl(scene.imageUrl));
}

/**
 * Library cards only show **one** cover image; requiring art on **every** scene hid otherwise great books
 * when a single page was still a placeholder or had an expired temporary URL.
 */
export function storyHasCommunityCoverArt(session: StorySession): boolean {
  return session.scenes.some((scene) => hasGeneratedStoryImageUrl(scene.imageUrl));
}

/**
 * Community shelf: replayable stories with at least one durable illustration.
 * Narration: stored clips optional — `complete` / `playing` sessions expect live TTS like `/api/tts`.
 */
export function storyQualifiesForCommunityShelf(session: StorySession): boolean {
  if (!storyHasCommunityCoverArt(session)) return false;
  if (storyHasFullStoredAudio(session)) return true;
  return session.status === "complete" || session.status === "playing";
}

/** Rough score for merging remote vs browser copies (prefer richer media state over newer empty rows). */
export function storyPersistedMediaScore(session: StorySession): number {
  const illustrationCount = session.scenes.filter((s) => hasGeneratedStoryImageUrl(s.imageUrl)).length;
  const audioLineCount = session.scenes.flatMap((s) => s.lines).filter((l) => l.audioUrl?.trim()).length;
  return illustrationCount * 10_000 + audioLineCount;
}

export function pickRicherPersistedStory(a: StorySession, b: StorySession): StorySession {
  const sa = storyPersistedMediaScore(a);
  const sb = storyPersistedMediaScore(b);
  if (sa > sb) return a;
  if (sb > sa) return b;
  return Date.parse(a.updatedAt) >= Date.parse(b.updatedAt) ? a : b;
}

/**
 * Personal shelf uses the **same replay bar as Community**: at least one durable illustration and either
 * batched narration clips or a complete/playing session (live `/api/tts` during replay).
 * Stricter “archived originals” checks live in {@link storyIsFullyArchived} for future UI badges.
 */
export function storyQualifiesForMyBooksShelf(session: StorySession): boolean {
  return storyQualifiesForCommunityShelf(session);
}

/** Every scene has migrated art plus every narration line persisted — optional quality tier. */
export function storyIsFullyArchived(session: StorySession): boolean {
  return storyHasFullIllustrations(session) && storyHasFullStoredAudio(session);
}

