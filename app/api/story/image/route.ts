import { NextResponse } from "next/server";
import {
  generateSceneImage,
  isPlaceholderImageUrl,
  looksLikeExpiredProneImageUrl,
} from "@/lib/image-provider";
import { memoryStories } from "@/lib/memory-store";
import type { ImageQualityTier } from "@/lib/openai-model-config";
import { getStorySession, saveStorySession } from "@/lib/supabase";

export const runtime = "nodejs";

const IMAGE_TIERS = new Set<ImageQualityTier>(["low", "medium", "high"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId?: string;
    sceneId?: string;
    imageQualityTier?: ImageQualityTier;
  };

  if (!body.sessionId || !body.sceneId) {
    return NextResponse.json({ error: "Missing sessionId or sceneId" }, { status: 400 });
  }

  const imageQualityTier =
    body.imageQualityTier && IMAGE_TIERS.has(body.imageQualityTier)
      ? body.imageQualityTier
      : undefined;

  const session = memoryStories.get(body.sessionId) || (await getStorySession(body.sessionId));
  if (!session) {
    return NextResponse.json({ error: "Story session not found" }, { status: 404 });
  }

  const scene = session.scenes.find((candidate) => candidate.id === body.sceneId);
  if (!scene) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  if (
    !scene.imageUrl ||
    isPlaceholderImageUrl(scene.imageUrl) ||
    looksLikeExpiredProneImageUrl(scene.imageUrl)
  ) {
    scene.imageUrl = await generateSceneImage(scene, session.storyBible, { imageQualityTier });
    session.updatedAt = new Date().toISOString();
    memoryStories.set(session.id, session);
    await saveStorySession(session);
  }

  return NextResponse.json({ sceneId: scene.id, imageUrl: scene.imageUrl });
}
