import { memoryStories } from "@/lib/memory-store";
import { getStorySession } from "@/lib/supabase";
import { storySessionSchema, type StorySession } from "@/lib/story-schema";

/**
 * Resolve a story from in-process memory, Supabase, or a client-provided snapshot.
 * In serverless, /api/story/turn and /api/story/image may run on different instances
 * (memory is not shared). The client can pass the session from the last successful
 * turn when DB persistence is misconfigured or still in flight.
 */
export async function resolveStorySession(
  sessionId: string,
  clientSession: unknown | undefined,
): Promise<StorySession | null> {
  const cached = memoryStories.get(sessionId);
  if (cached) return cached;

  const persisted = await getStorySession(sessionId);
  if (persisted) {
    memoryStories.set(sessionId, persisted);
    return persisted;
  }

  if (clientSession === undefined) return null;

  const parsed = storySessionSchema.safeParse(clientSession);
  if (!parsed.success || parsed.data.id !== sessionId) return null;

  memoryStories.set(sessionId, parsed.data);
  return parsed.data;
}
