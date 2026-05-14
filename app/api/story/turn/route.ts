import { NextResponse } from "next/server";
import { memoryStories } from "@/lib/memory-store";
import { saveStorySession } from "@/lib/supabase";
import { getAuthSessionUser } from "@/lib/supabase/auth-server";
import { uploadStoryImages } from "@/lib/supabase-storage";
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
  
  // Upload any data URL images to Supabase Storage
  let sessionWithUploadedImages = result.session;
  try {
    sessionWithUploadedImages = await uploadStoryImages(result.session);
    console.log(`Uploaded images for story ${result.session.id}`);
  } catch (error) {
    console.error('Failed to upload story images:', error);
    // Continue with original session if upload fails
  }
  
  memoryStories.set(sessionWithUploadedImages.id, sessionWithUploadedImages);

  const user = await getAuthSessionUser();
  await saveStorySession(
    sessionWithUploadedImages,
    user ? { ownerUserId: user.id } : undefined,
  );

  return NextResponse.json({ ...result, session: sessionWithUploadedImages });
}
