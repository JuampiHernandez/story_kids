import { NextResponse } from "next/server";
import { generateSceneImage } from "@/lib/image-provider";
import { memoryStories } from "@/lib/memory-store";
import { getStorySession, saveStorySession } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId?: string;
    sceneId?: string;
  };

  if (!body.sessionId || !body.sceneId) {
    return NextResponse.json({ error: "Missing sessionId or sceneId" }, { status: 400 });
  }

  const session = memoryStories.get(body.sessionId) || (await getStorySession(body.sessionId));
  if (!session) {
    return NextResponse.json({ error: "Story session not found" }, { status: 404 });
  }

  const scene = session.scenes.find((candidate) => candidate.id === body.sceneId);
  if (!scene) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  if (!scene.imageUrl) {
    scene.imageUrl = await generateSceneImage(scene, session.storyBible);
    session.updatedAt = new Date().toISOString();
    memoryStories.set(session.id, session);
    await saveStorySession(session);
  }

  return NextResponse.json({ sceneId: scene.id, imageUrl: scene.imageUrl });
}
