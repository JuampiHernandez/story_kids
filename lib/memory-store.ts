import type { StorySession } from "@/lib/story-schema";

const globalForStories = globalThis as typeof globalThis & {
  toddlerTalesStories?: Map<string, StorySession>;
};

export const memoryStories =
  globalForStories.toddlerTalesStories ?? new Map<string, StorySession>();

globalForStories.toddlerTalesStories = memoryStories;
