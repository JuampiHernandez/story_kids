import { notFound } from "next/navigation";
import { StorybookView } from "@/components/storybook-view";
import { memoryStories } from "@/lib/memory-store";
import { getStorySession } from "@/lib/supabase";

type StoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  const session = memoryStories.get(id) || (await getStorySession(id));

  if (!session) {
    notFound();
  }

  return <StorybookView session={session} />;
}
