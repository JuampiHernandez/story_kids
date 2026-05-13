import type { StorySession } from "@/lib/story-schema";
import { hasGeneratedStoryImageUrl } from "@/lib/story-image-utils";

export type StoryLibraryCard = {
  id: string;
  title: string;
  premise: string;
  pageCount: number;
  coverImageUrl?: string;
  coverTitle: string;
  updatedAt: string;
};

export function storySessionToLibraryCard(story: StorySession): StoryLibraryCard {
  const coverScene =
    story.scenes.find((scene) => hasGeneratedStoryImageUrl(scene.imageUrl)) || story.scenes[0];
  const coverImageUrl = hasGeneratedStoryImageUrl(coverScene?.imageUrl)
    ? coverScene.imageUrl
    : undefined;
  const fallbackTitle = story.storyBible.protagonist
    ? `${story.storyBible.protagonist}'s Story`
    : "Untitled Story";

  return {
    id: story.id,
    title: coverScene?.title || fallbackTitle,
    premise: story.storyBible.premise,
    pageCount: story.scenes.length,
    coverImageUrl,
    coverTitle: coverScene?.title || fallbackTitle,
    updatedAt: story.updatedAt,
  };
}
