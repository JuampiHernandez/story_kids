import { memoryStories } from "@/lib/memory-store";
import { getStorySession } from "@/lib/supabase";
import { StoryPageClient } from "@/components/story-page-client";

type StoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  const session = memoryStories.get(id) || (await getStorySession(id));

  return <StoryPageClient storyId={id} serverSession={session} />;
}
