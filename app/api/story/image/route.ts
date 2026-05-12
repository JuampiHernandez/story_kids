import { NextResponse } from "next/server";
import {
  generateAndUploadStoryImage,
  isPlaceholderImageUrl,
  looksLikeExpiredProneImageUrl,
} from "@/lib/image-provider";
import { memoryStories } from "@/lib/memory-store";
import type { ImageQualityTier } from "@/lib/openai-model-config";
import { type ImageStyle, imageStyleSchema } from "@/lib/story-settings";
import { getStorySession, saveStorySession } from "@/lib/supabase";

export const runtime = "nodejs";

const IMAGE_TIERS = new Set<ImageQualityTier>(["low", "medium", "high"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId?: string;
    sceneId?: string;
    imageQualityTier?: ImageQualityTier;
    imageStyle?: ImageStyle;
    useChildAsProtagonist?: boolean;
    childFaceDataUrl?: string;
  };

  if (!body.sessionId || !body.sceneId) {
    return NextResponse.json({ error: "Missing sessionId or sceneId" }, { status: 400 });
  }

  const parsedImageStyle = imageStyleSchema.safeParse(body.imageStyle);
  const imageStyle: ImageStyle | undefined = parsedImageStyle.success
    ? parsedImageStyle.data
    : undefined;

  const requestedTier =
    body.imageQualityTier && IMAGE_TIERS.has(body.imageQualityTier)
      ? body.imageQualityTier
      : undefined;
  // Pixar style is always max quality; ignore any user-supplied tier.
  const imageQualityTier: ImageQualityTier | undefined =
    imageStyle === "disney-pixar" ? "high" : requestedTier;

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
    const sceneIndex = session.scenes.findIndex(s => s.id === scene.id);
    scene.imageUrl = await generateAndUploadStoryImage(
      scene,
      session.storyBible,
      session.id,
      sceneIndex,
      {
        imageQualityTier,
        imageStyle,
        childReference:
          body.useChildAsProtagonist && body.childFaceDataUrl
            ? {
                childName: session.childProfile.name,
                faceDataUrl: body.childFaceDataUrl,
              }
            : undefined,
      }
    );
    session.updatedAt = new Date().toISOString();
    memoryStories.set(session.id, session);
    await saveStorySession(session);
  }

  return NextResponse.json({ sceneId: scene.id, imageUrl: scene.imageUrl });
}
