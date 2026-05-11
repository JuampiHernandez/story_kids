import { NextResponse } from "next/server";
import { memoryStories } from "@/lib/memory-store";
import { saveStorySession } from "@/lib/supabase";
import { advanceStory } from "@/lib/story-engine";
import { storyTurnRequestSchema } from "@/lib/story-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = storyTurnRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid story turn request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing =
    parsed.data.session ||
    (parsed.data.sessionId ? memoryStories.get(parsed.data.sessionId) : undefined);

  const result = await advanceStory({ ...parsed.data, session: existing });
  memoryStories.set(result.session.id, result.session);
  await saveStorySession(result.session);

  return NextResponse.json(result);
}
