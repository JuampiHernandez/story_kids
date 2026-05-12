"use client";

import { useEffect } from "react";
import { saveStoryToBrowser } from "@/lib/story-storage";
import type { StorySession } from "@/lib/story-schema";

export function useStoryStorage() {
  const saveStory = (story: StorySession) => {
    saveStoryToBrowser(story);
  };

  return { saveStory };
}