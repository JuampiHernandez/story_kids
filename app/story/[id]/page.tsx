import { memoryStories } from "@/lib/memory-store";
import { hydratePersistedStoryImages } from "@/lib/supabase-storage";
import { getStorySession } from "@/lib/supabase";
import { StoryPageClient } from "@/components/story-page-client";

type StoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  let session = memoryStories.get(id) || (await getStorySession(id));

  if (session) {
    session = await hydratePersistedStoryImages(session);
    memoryStories.set(id, session);
  }

  return <StoryPageClient storyId={id} serverSession={session} />;
}
